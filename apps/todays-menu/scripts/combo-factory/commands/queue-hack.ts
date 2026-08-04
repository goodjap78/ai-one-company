/**
 * npm run combo:queue-hack -- --batch=1
 * Writes full 21-combo manifest; queue scope = approved pilots + requested batch(es).
 */
import path from 'node:path';
import { COMBO_HACK_PILOT_IDS } from '../../../data/content/combos/convenienceComboHackImageKeys';
import { collectHackComboManifest, writeComboManifest } from '../collectCombos';
import { writeAllComboPrompts } from '../buildPrompts';
import { buildComboQueue, loadComboQueue, writeComboQueue } from '../buildQueue';
import { PATHS } from '../config';
import { hackBatchComboIds, parseHackBatchArg } from '../hackBatchScope';
import { writeComboReviewHtml } from '../writeReviewHtml';

function main(): void {
  const batch = parseHackBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error(
      'Usage: npm run combo:queue-hack -- --batch=1 (queues pilots + that batch only)',
    );
  }

  console.log(`\n========== combo:queue-hack (51-B batch ${batch}) ==========`);

  const fullManifest = collectHackComboManifest();
  writeComboManifest(fullManifest);

  const queueComboIds = new Set<string>([
    ...COMBO_HACK_PILOT_IDS,
    ...hackBatchComboIds(batch),
  ]);
  const queueManifest = {
    ...fullManifest,
    total: queueComboIds.size,
    items: fullManifest.items.filter((i) => queueComboIds.has(i.comboId)),
  };

  writeAllComboPrompts(queueManifest.items);

  const previous = loadComboQueue();
  const queue = buildComboQueue(
    queueManifest,
    process.env.IMAGE_PROVIDER ?? 'disabled',
    { missingOnly: false },
  );

  // Preserve completed review items from other batches if queue already had them.
  if (previous) {
    const mergedKeys = new Set(queue.items.map((i) => i.imageKey));
    const extra = previous.items.filter((i) => !mergedKeys.has(i.imageKey));
    if (extra.length > 0) {
      queue.items = [...queue.items, ...extra];
    }
  }

  writeComboQueue(queue);
  writeComboReviewHtml(queue);

  const approved = fullManifest.items.filter((i) => i.status === 'approved').length;
  const remaining = fullManifest.items.filter((i) => i.status !== 'approved').length;

  console.log(`Full HACK manifest: ${fullManifest.total} (production approved: ${approved})`);
  console.log(`Queue scope: pilots + batch ${batch} → ${queueManifest.total} items`);
  console.log(`Remaining HACK without production: ${remaining - approved}`);
  for (const item of queueManifest.items) {
    console.log(`  ${item.comboId} → ${item.imageKey} [${item.status}]`);
  }
  console.log(`Manifest → ${path.relative(PATHS.appRoot, PATHS.manifest)}`);
  console.log(`Queue → ${path.relative(PATHS.appRoot, PATHS.imageQueue)}`);
  console.log('============================================\n');
}

main();
