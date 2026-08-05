/**
 * npm run combo:generate -- --combo=combo_0020
 * npm run combo:generate -- --keys=spicy_cheese_stir_noodles_combo
 */
import path from 'node:path';
import {
  collectComboManifest,
  collectEasySetComboManifest,
  collectHackComboManifest,
  loadComboManifest,
  writeComboManifest,
} from '../collectCombos';
import { writeAllComboPrompts } from '../buildPrompts';
import {
  buildComboQueue,
  loadComboQueue,
  writeComboQueue,
} from '../buildQueue';
import { PATHS } from '../config';
import { runComboGenerate } from '../runGenerate';
import { writeComboReviewHtml } from '../writeReviewHtml';
import { writeComboV2ReviewHtml } from '../writeComboV2ReviewHtml';

function parseArgs(argv: string[]) {
  const missingOnly = argv.includes('--missing-only');
  const resume = argv.includes('--resume');
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const keysArg = argv.find((a) => a.startsWith('--keys='))?.slice(7);
  const comboArg = argv.find((a) => a.startsWith('--combo='))?.slice(8);
  const keys = keysArg
    ? keysArg.split(',').map((k) => k.trim()).filter(Boolean)
    : undefined;
  const comboIds = comboArg
    ? comboArg.split(',').map((k) => k.trim()).filter(Boolean)
    : undefined;
  return { missingOnly, resume, force, dryRun, keys, comboIds, refresh: argv.includes('--refresh'), refreshHack: argv.includes('--refresh-hack'), refreshEasySet: argv.includes('--refresh-easy-set') };
}

async function main(): Promise<void> {
  console.log('\n========== combo:generate (48-C) ==========');
  console.log('Review only → generated/combo-factory/review/{imageKey}.jpg\n');

  const args = parseArgs(process.argv.slice(2));

  if (args.refreshHack || (args.comboIds?.length && !loadComboQueue())) {
    console.log('Refreshing HACK combo queue…');
    const manifest = collectHackComboManifest();
    writeComboManifest(manifest);
    writeAllComboPrompts(manifest.items);
    const queue = buildComboQueue(
      manifest,
      process.env.IMAGE_PROVIDER ?? 'disabled',
      { missingOnly: args.missingOnly },
    );
    writeComboQueue(queue);
    writeComboReviewHtml(queue);
  } else if (args.refreshEasySet) {
    console.log('Refreshing EASY_SET combo queue…');
    const manifest = collectEasySetComboManifest();
    writeComboManifest(manifest);
    writeAllComboPrompts(manifest.items);
    const queue = buildComboQueue(
      manifest,
      process.env.IMAGE_PROVIDER ?? 'disabled',
      { missingOnly: args.missingOnly },
    );
    writeComboQueue(queue);
    writeComboReviewHtml(queue);
  } else if (args.refresh || !loadComboQueue()) {
    console.log('Refreshing pilot queue…');
    const manifest = collectComboManifest();
    writeComboManifest(manifest);
    writeAllComboPrompts(manifest.items);
    const queue = buildComboQueue(
      manifest,
      process.env.IMAGE_PROVIDER ?? 'disabled',
      { missingOnly: args.missingOnly },
    );
    writeComboQueue(queue);
    writeComboReviewHtml(queue);
  }

  if (args.comboIds?.length) {
    console.log(`Combo filter: ${args.comboIds.join(', ')}`);
  }
  if (args.keys?.length) {
    console.log(`Keys filter: ${args.keys.join(', ')}`);
  }

  const result = await runComboGenerate({
    missingOnly: args.missingOnly,
    resume: args.resume,
    force: args.force,
    dryRun: args.dryRun,
    keys: args.keys,
    comboIds: args.comboIds,
  });

  console.log('\n--- Result ---');
  console.log(`provider: ${result.providerName}`);
  console.log(`provider_status: ${result.providerStatus}`);
  console.log(`generated (review): ${result.written}`);
  console.log(`skipped: ${result.skipped}`);
  console.log(`failed: ${result.failed}`);

  const queue = loadComboQueue();
  if (queue) {
    writeComboReviewHtml(queue);
    const v2Rel = writeComboV2ReviewHtml();
    console.log(`Review HTML → ${path.relative(PATHS.appRoot, PATHS.reviewIndex)}`);
    console.log(`v2 comparison → ${v2Rel}`);
  }

  if (
    result.providerStatus === 'PROVIDER_NOT_CONFIGURED' ||
    result.providerStatus === 'API_KEY_MISSING'
  ) {
    process.exitCode = 0;
  }
  console.log('==========================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
