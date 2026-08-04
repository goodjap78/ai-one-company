/**
 * npm run ingredient:generate -- --from=001 --to=050 --missing-only --resume
 */
import path from 'node:path';
import {
  collectIngredientManifest,
  loadIngredientManifest,
  writeIngredientManifest,
} from '../collectIngredients';
import { writeAllIngredientPrompts } from '../buildPrompts';
import {
  buildIngredientQueue,
  loadIngredientQueue,
  writeIngredientQueue,
} from '../buildQueue';
import { PATHS, ING1_TEST_KEYS } from '../config';
import { runIngredientGenerate } from '../runGenerate';
import { writeIngredientDashboard } from '../writeDashboard';
import { writeIngredientReviewHtml } from '../writeReviewHtml';

function parseArgs(argv: string[]) {
  const missingOnly = argv.includes('--missing-only');
  const resume = argv.includes('--resume');
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const testFive = argv.includes('--test-five');
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  const keysArg = argv.find((a) => a.startsWith('--keys='))?.slice(7);
  const keys = testFive
    ? [...ING1_TEST_KEYS]
    : keysArg
      ? keysArg.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined;
  return { missingOnly, resume, force, dryRun, keys, fromId, toId };
}

async function main(): Promise<void> {
  console.log('\n========== ingredient:generate (ING-2) ==========');
  console.log('Review only → generated/ingredient-factory/review/{key}.png');
  console.log('Batches of 10 · concurrency 2 · fail-one continues\n');

  const args = parseArgs(process.argv.slice(2));

  // Refresh queue for range before generate (keeps resume statuses)
  if (args.fromId && args.toId) {
    console.log(`Refreshing queue ${args.fromId}–${args.toId}…`);
    const manifest = collectIngredientManifest(args.fromId, args.toId);
    writeIngredientManifest(manifest);
    writeAllIngredientPrompts(manifest.items);
    const queue = buildIngredientQueue(
      manifest,
      process.env.IMAGE_PROVIDER ?? 'disabled',
      { missingOnly: args.missingOnly },
    );
    writeIngredientQueue(queue);
    writeIngredientReviewHtml(queue);
  } else if (!loadIngredientQueue()) {
    console.error(
      'No queue found. Run: npm run ingredient:queue -- --from=001 --to=050 --missing-only',
    );
    process.exitCode = 1;
    return;
  }

  if (args.keys?.length) {
    console.log(`Keys filter: ${args.keys.join(', ')}`);
  }
  if (args.fromId && args.toId) {
    console.log(`Range: ${args.fromId}–${args.toId}`);
  }

  const result = await runIngredientGenerate({
    missingOnly: args.missingOnly,
    resume: args.resume,
    force: args.force,
    dryRun: args.dryRun,
    keys: args.keys,
  });

  console.log('\n--- Result ---');
  console.log(`provider: ${result.providerName}`);
  console.log(`provider_status: ${result.providerStatus}`);
  console.log(`generated (review): ${result.written}`);
  console.log(`skipped: ${result.skipped}`);
  console.log(`failed: ${result.failed}`);

  const manifest = loadIngredientManifest();
  const queue = loadIngredientQueue();
  if (manifest && queue) {
    writeIngredientReviewHtml(queue);
    writeIngredientDashboard({
      manifest,
      queue,
      unresolved: manifest.unresolvedAliases,
    });
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
  console.log('================================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
