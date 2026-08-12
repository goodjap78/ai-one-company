/**
 * npm run step:generate -- --from=001 --to=050 --missing-only --resume
 * npm run step:generate -- --recipe=003
 * npm run step:generate -- --keys=kimchi_stew_step_01,...
 */
import path from 'node:path';
import { writeAllStepPrompts } from '../buildPrompts';
import {
  buildStepQueue,
  loadStepQueue,
  writeStepQueue,
} from '../buildQueue';
import {
  collectStepManifest,
  loadStepManifest,
  writeStepManifest,
} from '../collectSteps';
import { PATHS, STEP1_TEST_KEYS } from '../config';
import { runStepGenerate } from '../runGenerate';
import { writeStepDashboard } from '../writeDashboard';
import { writeStepReviewHtml } from '../writeReviewHtml';

function parseArgs(argv: string[]) {
  const missingOnly = argv.includes('--missing-only');
  const resume = argv.includes('--resume');
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const testFive = argv.includes('--test-five');
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  const keysArg = argv.find((a) => a.startsWith('--keys='))?.slice(7);
  const recipeIds: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith('--recipe=')) {
      recipeIds.push(...arg.slice(9).split(',').filter(Boolean));
    }
    if (arg.startsWith('--id=')) {
      recipeIds.push(...arg.slice(5).split(',').filter(Boolean));
    }
  }
  const keys = testFive
    ? [...STEP1_TEST_KEYS]
    : keysArg
      ? keysArg.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined;
  return {
    missingOnly,
    resume,
    force,
    dryRun,
    keys,
    fromId,
    toId,
    recipeIds: recipeIds.length ? recipeIds : undefined,
  };
}

async function main(): Promise<void> {
  console.log('\n========== step:generate (STEP-1) ==========');
  console.log('Review only → generated/step-image-factory/review/{key}.jpg');
  console.log('Batches of 5 · concurrency 2 · fail-one continues\n');

  const args = parseArgs(process.argv.slice(2));

  if (args.fromId && args.toId) {
    console.log(`Refreshing queue ${args.fromId}–${args.toId}…`);
    const manifest = collectStepManifest(args.fromId, args.toId);
    writeStepManifest(manifest);
    writeAllStepPrompts(manifest.items);
    const queue = buildStepQueue(
      manifest,
      process.env.IMAGE_PROVIDER ?? 'disabled',
      { missingOnly: args.missingOnly },
    );
    writeStepQueue(queue);
    writeStepReviewHtml(queue);
  } else if (args.recipeIds?.length) {
    // Ensure queue covers the requested recipe ids (e.g. 003).
    const ids = [...args.recipeIds].sort();
    const fromId = ids[0];
    const toId = ids[ids.length - 1];
    console.log(`Refreshing queue for recipe(s) ${args.recipeIds.join(', ')}…`);
    const existing = loadStepQueue();
    if (!existing) {
      const manifest = collectStepManifest(fromId, toId);
      writeStepManifest(manifest);
      writeAllStepPrompts(manifest.items);
      const queue = buildStepQueue(
        manifest,
        process.env.IMAGE_PROVIDER ?? 'disabled',
        { missingOnly: args.missingOnly },
      );
      writeStepQueue(queue);
      writeStepReviewHtml(queue);
    }
  } else if (!loadStepQueue()) {
    console.error(
      'No queue. Run: npm run step:queue -- --from=001 --to=050 --missing-only',
    );
    process.exitCode = 1;
    return;
  }

  if (args.keys?.length) console.log(`Keys filter: ${args.keys.join(', ')}`);
  if (args.recipeIds?.length) {
    console.log(`Recipe filter: ${args.recipeIds.join(', ')}`);
  }
  if (args.fromId && args.toId) {
    console.log(`Range: ${args.fromId}–${args.toId}`);
  }

  const result = await runStepGenerate(args);

  console.log('\n--- Result ---');
  console.log(`provider: ${result.providerName}`);
  console.log(`provider_status: ${result.providerStatus}`);
  console.log(`generated (review): ${result.written}`);
  console.log(`skipped: ${result.skipped}`);
  console.log(`failed: ${result.failed}`);

  const manifest = loadStepManifest();
  const queue = loadStepQueue();
  if (manifest && queue) {
    writeStepReviewHtml(queue);
    writeStepDashboard({ manifest, queue });
    console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
    console.log(
      `Review HTML → ${path.relative(PATHS.appRoot, PATHS.reviewIndex)}`,
    );
  }

  if (
    result.providerStatus === 'PROVIDER_NOT_CONFIGURED' ||
    result.providerStatus === 'API_KEY_MISSING'
  ) {
    process.exitCode = 0;
  }
  console.log('===========================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
