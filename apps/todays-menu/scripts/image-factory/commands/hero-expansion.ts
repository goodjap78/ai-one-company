/**
 * Sprint 60 — Meal hero expansion CLI.
 *
 * npm run hero:expansion -- inventory|snapshot|prepare|generate|audit|review|queue-ready [--batch=1]
 * npm run hero:expansion:serve
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildImageQueue } from '../buildImageQueue';
import { writeHeroExpansionInventory } from '../buildHeroExpansionInventory';
import {
  auditMealHeroExpansionBatch,
  writeMealHeroExpansionAudit,
} from '../auditMealHeroExpansion';
import { writeProtectedHeroHashSnapshot, writeMealHeroExpansionBatchProductionHashes, verifyApprovedExpansionProductionHashes } from '../heroExpansionHashSnapshot';
import { runHeroApprove } from '../runApprove';
import {
  HERO_EXPANSION_REVIEW_PORT,
  MEAL_HERO_EXPANSION_BATCHES,
  parseMealHeroExpansionBatchArg,
  MEAL_HERO_EXPANSION_PATHS,
} from '../mealHeroExpansionConfig';
import { runHeroGenerate } from '../runGenerate';
import {
  writeMealHeroExpansionBatchIndex,
  writeMealHeroExpansionBatchReview,
} from '../writeMealHeroExpansionReview';
import { PATHS } from '../config';
import {
  archiveBatchMockReview,
  assertGeminiProviderReadyForExpansion,
} from '../heroExpansionGenerateGuard';

function parseBatchArg(argv: string[]): ReturnType<typeof parseMealHeroExpansionBatchArg> {
  const arg = argv.find((a) => a.startsWith('--batch='));
  const value = arg?.split('=')[1] ?? '1';
  return parseMealHeroExpansionBatchArg(value);
}

async function cmdInventory(): Promise<void> {
  const out = writeHeroExpansionInventory();
  console.log(`Inventory → ${path.relative(PATHS.appRoot, out)}`);
}

async function cmdSnapshot(): Promise<void> {
  const out = writeProtectedHeroHashSnapshot('before');
  console.log(`Protected 160 hash snapshot → ${path.relative(PATHS.appRoot, out)}`);
}

async function cmdPrepare(): Promise<void> {
  console.log('Running image-factory:prepare…');
  execSync('npm run image-factory:prepare', {
    cwd: PATHS.appRoot,
    stdio: 'inherit',
  });
  execSync('npm run hero:queue', {
    cwd: PATHS.appRoot,
    stdio: 'inherit',
  });
  buildImageQueue();
  console.log('Prepare complete.');
}

function assertGenerateBatchAllowed(batch: ReturnType<typeof parseMealHeroExpansionBatchArg>): void {
  throw new Error(
    `Sprint 60.8: image regeneration forbidden — generation blocked for ${batch.id}`,
  );
}

function parseRecipeFilterArg(argv: string[]): string[] | undefined {
  const arg = argv.find((a) => a.startsWith('--recipe='));
  if (!arg) return undefined;
  return arg
    .slice('--recipe='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function cmdGenerate(
  batch: ReturnType<typeof parseMealHeroExpansionBatchArg>,
  argv: string[],
): Promise<void> {
  try {
    assertGenerateBatchAllowed(batch);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  const guard = assertGeminiProviderReadyForExpansion();
  if (!guard.ok) {
    console.error(`ABORT hero expansion generate: ${guard.reason}`);
    process.exitCode = 1;
    return;
  }

  if (batch.id === 'batch-1') {
    archiveBatchMockReview(batch, 'batch-1-mock');
  }

  const recipeFilter = parseRecipeFilterArg(argv);
  let targetRecipeIds = batch.recipeIds;
  if (recipeFilter?.length) {
    const invalid = recipeFilter.filter((id) => !batch.recipeIds.includes(id));
    if (invalid.length > 0) {
      console.error(`Recipe(s) not in ${batch.id}: ${invalid.join(', ')}`);
      process.exitCode = 1;
      return;
    }
    targetRecipeIds = recipeFilter;
  }

  await cmdPrepare();
  const fromId = targetRecipeIds[0];
  const toId = targetRecipeIds[targetRecipeIds.length - 1];
  console.log(`Generating ${batch.id} (${fromId}–${toId}) via ${guard.provider}…`);
  const result = await runHeroGenerate({
    fromId,
    toId,
    force: true,
    recipeIds: targetRecipeIds,
    batchSize: 5,
    concurrency: 2,
  });
  console.log(`written: ${result.written} skipped: ${result.skipped} failed: ${result.failed}`);
  console.log(`provider_status: ${result.providerStatus}`);

  if (result.failed > 0) {
    process.exitCode = 1;
    return;
  }

  const productionGuard = verifyApprovedExpansionProductionHashes();
  console.log(
    `Production guard: protected160=${productionGuard.protected160.ok} batches=${productionGuard.batches.map((b) => `${b.batchId}:${b.ok}`).join(',')}`,
  );
  if (!productionGuard.ok) {
    console.error('Existing production heroes changed after generation — abort');
    process.exitCode = 1;
  }
}

async function cmdAudit(batch: ReturnType<typeof parseMealHeroExpansionBatchArg>): Promise<void> {
  const rows = await auditMealHeroExpansionBatch(batch);
  const out = writeMealHeroExpansionAudit(batch, rows);
  console.log(`Audit → ${path.relative(PATHS.appRoot, out)}`);
  for (const row of rows) {
    console.log(`  ${row.recipeId} ${row.grade} ${row.reasons[0] ?? ''}`);
  }
}

async function cmdReview(batch: ReturnType<typeof parseMealHeroExpansionBatchArg>): Promise<void> {
  const rows = await auditMealHeroExpansionBatch(batch);
  writeMealHeroExpansionAudit(batch, rows);
  const html = writeMealHeroExpansionBatchReview(batch, rows);
  writeMealHeroExpansionBatchIndex();
  console.log(`Review HTML → ${path.relative(PATHS.appRoot, html)}`);
  console.log(
    `Open http://127.0.0.1:${HERO_EXPANSION_REVIEW_PORT}/${batch.id}.html (npm run hero:expansion:serve)`,
  );
}

function cmdQueueReady(): void {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.queueReadyDir, { recursive: true });
  for (const batch of MEAL_HERO_EXPANSION_BATCHES) {
    if (batch.id === 'batch-1') continue;
    const out = path.join(MEAL_HERO_EXPANSION_PATHS.queueReadyDir, `${batch.id}.json`);
    fs.writeFileSync(
      out,
      JSON.stringify(
        {
          batchId: batch.id,
          label: batch.label,
          recipeIds: batch.recipeIds,
          status: 'queued_for_generation_after_batch1_approval',
        },
        null,
        2,
      ),
      'utf8',
    );
    console.log(`Queue ready → ${path.relative(PATHS.appRoot, out)}`);
  }
}

export function serveMealHeroExpansionReview(port = HERO_EXPANSION_REVIEW_PORT): void {
  const root = path.resolve(MEAL_HERO_EXPANSION_PATHS.reviewDir);
  fs.mkdirSync(root, { recursive: true });

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url?.split('?')[0] ?? '/');
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const abs = path.resolve(root, rel);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    const types: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
    fs.createReadStream(abs).pipe(res);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} already in use. Stop the existing hero:expansion:serve process or use another port.`,
      );
    } else {
      console.error(err);
    }
    process.exitCode = 1;
  });

  server.listen(port, '127.0.0.1', () => {
    const pages = fs
      .readdirSync(root)
      .filter((f) => f.endsWith('.html'))
      .sort();
    console.log('Hero expansion review server');
    console.log(`  URL: http://127.0.0.1:${port}/`);
    console.log(`  Document root: ${root}`);
    console.log(`  Pages: ${pages.join(', ')}`);
    for (const id of ['batch-1', 'batch-2', 'batch-3', 'batch-4']) {
      console.log(`  → http://127.0.0.1:${port}/${id}.html`);
    }
  });
}

async function cmdApprove(batch: ReturnType<typeof parseMealHeroExpansionBatchArg>): Promise<void> {
  if (batch.id !== 'batch-4') {
    console.error(
      `Sprint 60.8: approval only allowed for batch-4 (recipe_0221–0240), got ${batch.id}`,
    );
    process.exitCode = 1;
    return;
  }

  const fromId = String(batch.fromNum);
  const toId = String(batch.toNum);
  console.log(`Approving ${batch.id} (${batch.recipeIds[0]}–${batch.recipeIds[batch.recipeIds.length - 1]})…`);

  const result = runHeroApprove({
    decision: 'approve',
    fromId,
    toId,
    force: true,
  });

  console.log(`Promoted: ${result.promoted.length} failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.error(`FAILED: ${result.failed.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const hashReport = writeMealHeroExpansionBatchProductionHashes(batch);
  console.log(
    `Production hashes → ${path.relative(PATHS.appRoot, hashReport.path)} (${hashReport.rows.filter((r) => r.hashMatch).length}/${hashReport.rows.length} MATCH)`,
  );

  if (!hashReport.allMatch) {
    console.error('Hash verification failed for one or more recipes');
    process.exitCode = 1;
    return;
  }

  const expansionVerify = verifyApprovedExpansionProductionHashes();
  for (const b of expansionVerify.batches) {
    console.log(`  ${b.batchId} production hashes: ${b.ok ? 'ok' : b.mismatches.join(', ')}`);
  }
  console.log(
    `Protected 160 hashes: ${expansionVerify.protected160.ok ? 'ok' : expansionVerify.protected160.mismatches.join(', ')}`,
  );
  if (!expansionVerify.ok) {
    console.error('Expansion production hash guard failed');
    process.exitCode = 1;
    return;
  }

  writeProtectedHeroHashSnapshot('after');
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const sub = argv[0] ?? 'help';
  const batch = parseBatchArg(argv);

  switch (sub) {
    case 'inventory':
      await cmdInventory();
      break;
    case 'snapshot':
      await cmdSnapshot();
      break;
    case 'prepare':
      await cmdPrepare();
      break;
    case 'generate':
      await cmdGenerate(batch, argv);
      break;
    case 'audit':
      await cmdAudit(batch);
      break;
    case 'approve':
      await cmdApprove(batch);
      break;
    case 'review':
      await cmdReview(batch);
      break;
    case 'queue-ready':
      cmdQueueReady();
      break;
    case 'serve':
      serveMealHeroExpansionReview();
      break;
    default:
      console.log(`
hero:expansion commands:
  inventory     hero-140-inventory.json
  snapshot      protected 160 SHA-256 before snapshot
  prepare       image-factory prepare + queue
  generate      --batch=1  (Batch 1 only in Sprint 60 first pass)
  approve       --batch=4  Review → production (Sprint 60.8)
  audit         --batch=1
  review        --batch=1 HTML + audit
  queue-ready   batches 2-7 JSON stubs
  serve         static review on :${HERO_EXPANSION_REVIEW_PORT}
`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
