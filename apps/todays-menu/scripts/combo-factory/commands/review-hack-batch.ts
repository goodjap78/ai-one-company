/**
 * npm run combo:review-hack-batch -- --batch=1
 */
import { loadComboAuditJson } from '../auditComboHeroV2';
import { hackBatchComboIds, parseHackBatchArg } from '../hackBatchScope';
import { writeHackBatchReviewHtml } from '../writeHackBatchReviewHtml';
import { getComboReviewPort } from '../writeComboV2ReviewHtml';

function main(): void {
  const batch = parseHackBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error('Usage: npm run combo:review-hack-batch -- --batch=1');
  }

  const audit = loadComboAuditJson(batch);
  if (!audit) {
    console.warn(`No audit JSON for batch ${batch}. Run combo:audit-hack-batch first.`);
  }

  const rel = writeHackBatchReviewHtml(batch);
  const port = getComboReviewPort();
  const comboIds = hackBatchComboIds(batch);

  console.log(`\nHACK batch ${batch} review → ${rel}`);
  console.log(`HTTP → http://127.0.0.1:${port}/hack-batch-${batch}.html`);
  console.log(`Combos: ${comboIds.join(', ')}\n`);
}

main();
