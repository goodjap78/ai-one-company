/**
 * npm run hero:generate
 *
 * Sprint IMG-3:
 *   npm run hero:generate -- --from=001 --to=050 --resume
 *
 * Also:
 *   npm run hero:generate -- --recipe=003
 *
 * Review only. PROVIDER_NOT_CONFIGURED → exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadImageQueue } from '../buildImageQueue';
import { PATHS } from '../config';
import { runHeroGenerate } from '../runGenerate';
import { validateHeroProduction } from '../validateProduction';
import {
  buildProductionDashboardMarkdown,
  writeScopedDashboard,
} from '../writeProductionDashboard';

function parseArgs(argv: string[]) {
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const resume = argv.includes('--resume');
  const writeAssets = argv.includes('--write-assets') ? true : undefined;
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
  const batchArg = argv.find((a) => a.startsWith('--batch-size='));
  const batchSize = batchArg ? Number(batchArg.split('=')[1]) : undefined;
  const concArg = argv.find((a) => a.startsWith('--concurrency='));
  const concurrency = concArg ? Number(concArg.split('=')[1]) : undefined;
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  const ids: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith('--id=')) ids.push(...arg.slice(5).split(',').filter(Boolean));
    if (arg.startsWith('--recipe=')) ids.push(...arg.slice(9).split(',').filter(Boolean));
  }
  return {
    force,
    dryRun,
    resume,
    limit,
    batchSize,
    concurrency,
    fromId,
    toId,
    recipeIds: ids.length ? ids : undefined,
    writeAssets,
  };
}

async function main(): Promise<void> {
  console.log('\n========== hero:generate (IMG-3) ==========');
  console.log('Review only → generated/image-factory/review/{id}-{key}.jpg');
  console.log('Batches of 5 · concurrency 2 · fail-one continues\n');

  const args = parseArgs(process.argv.slice(2));
  if (!args.fromId && !args.toId && !args.recipeIds?.length) {
    console.warn(
      'Tip: npm run hero:generate -- --from=001 --to=050 --resume\n',
    );
  }
  if ((args.fromId && !args.toId) || (!args.fromId && args.toId)) {
    console.error('Provide both --from= and --to=');
    process.exitCode = 1;
    return;
  }

  const result = await runHeroGenerate(args);

  console.log('\n--- Result ---');
  console.log(`provider: ${result.providerName}`);
  console.log(`provider_status: ${result.providerStatus}`);
  console.log(`generated (review): ${result.written}`);
  console.log(`skipped: ${result.skipped}`);
  console.log(`failed: ${result.failed}`);
  console.log(`assets written: ${result.assetsWritten}`);
  if (result.reviewPaths.length) {
    console.log('review paths (sample):');
    for (const p of result.reviewPaths.slice(0, 10)) console.log(`  - ${p}`);
  }
  if (
    result.providerStatus === 'PROVIDER_NOT_CONFIGURED' ||
    result.providerStatus === 'API_KEY_MISSING'
  ) {
    console.log(`status: ${result.providerStatus}`);
    process.exitCode = 0;
  } else if (result.failed > 0) {
    process.exitCode = 0; // do not fail whole project — individual fails only
  }

  const queue = loadImageQueue();
  if (queue) {
    const validation = validateHeroProduction();
    fs.writeFileSync(
      PATHS.dashboard,
      buildProductionDashboardMarkdown({
        queue,
        validation,
        scope: args.fromId && args.toId
          ? { fromId: args.fromId, toId: args.toId, label: 'IMG-3' }
          : undefined,
      }),
      'utf8',
    );
    if (args.fromId && args.toId) {
      writeScopedDashboard(queue, validation, args.fromId, args.toId);
    }
    console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  }
  console.log('===========================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
