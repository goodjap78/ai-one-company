/**
 * npm run combo:queue
 */
import path from 'node:path';
import { collectComboManifest, writeComboManifest } from '../collectCombos';
import { writeAllComboPrompts } from '../buildPrompts';
import { buildComboQueue, writeComboQueue } from '../buildQueue';
import { PATHS } from '../config';
import { writeComboReviewHtml } from '../writeReviewHtml';

function main(): void {
  console.log('\n========== combo:queue (48-C pilot) ==========');
  const manifest = collectComboManifest();
  writeComboManifest(manifest);
  writeAllComboPrompts(manifest.items);

  const queue = buildComboQueue(
    manifest,
    process.env.IMAGE_PROVIDER ?? 'disabled',
    { missingOnly: false },
  );
  writeComboQueue(queue);
  writeComboReviewHtml(queue);

  console.log(`Pilot combos: ${manifest.total}`);
  for (const item of manifest.items) {
    console.log(`  ${item.comboId} → ${item.imageKey} [${item.status}]`);
  }
  console.log(`Manifest → ${path.relative(PATHS.appRoot, PATHS.manifest)}`);
  console.log(`Queue → ${path.relative(PATHS.appRoot, PATHS.imageQueue)}`);
  console.log(`Review → ${path.relative(PATHS.appRoot, PATHS.reviewIndex)}`);
  console.log('============================================\n');
}

main();
