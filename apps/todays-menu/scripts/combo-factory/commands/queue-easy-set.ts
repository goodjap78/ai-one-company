/**
 * npm run combo:queue-easy-set -- --batch=1
 */
import path from 'node:path';
import { collectEasySetComboManifest, writeComboManifest } from '../collectCombos';
import { writeAllComboPrompts } from '../buildPrompts';
import { buildComboQueue, loadComboQueue, writeComboQueue } from '../buildQueue';
import { PATHS } from '../config';
import { easySetBatchComboIds, parseEasySetBatchArg } from '../easySetBatchScope';
import { writeComboReviewHtml } from '../writeReviewHtml';

function main(): void {
  const batch = parseEasySetBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error(
      'Usage: npm run combo:queue-easy-set -- --batch=1 (queues that EASY_SET batch only)',
    );
  }

  console.log(`\n========== combo:queue-easy-set (Sprint 53 batch ${batch}) ==========`);

  const fullManifest = collectEasySetComboManifest();
  writeComboManifest(fullManifest);

  const queueComboIds = new Set<string>(easySetBatchComboIds(batch));
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

  console.log(`Full EASY_SET manifest: ${fullManifest.total} (production approved: ${approved})`);
  console.log(`Queue scope: batch ${batch} → ${queueManifest.total} items`);
  console.log(`Remaining EASY_SET without production: ${remaining}`);
  for (const item of queueManifest.items) {
    console.log(`  ${item.comboId} → ${item.imageKey} [${item.status}]`);
  }
  console.log(`Manifest → ${path.relative(PATHS.appRoot, PATHS.manifest)}`);
  console.log(`Queue → ${path.relative(PATHS.appRoot, PATHS.imageQueue)}`);
  console.log('============================================\n');
}

main();
