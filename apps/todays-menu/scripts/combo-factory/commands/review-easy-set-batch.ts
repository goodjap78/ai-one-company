/**
 * npm run combo:review-easy-set-batch -- --batch=1
 */
import { loadEasySetComboAuditJson } from '../auditComboHeroV2';
import { parseEasySetBatchArg } from '../easySetBatchScope';
import { writeEasySetBatchReviewHtml } from '../writeEasySetBatchReviewHtml';

function main(): void {
  const batch = parseEasySetBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error('Usage: npm run combo:review-easy-set-batch -- --batch=1');
  }

  const audit = loadEasySetComboAuditJson(batch);
  const reviewRel = writeEasySetBatchReviewHtml(batch);
  console.log(`Review HTML → ${reviewRel}`);
  if (audit) {
    console.log(`Audit rows: ${audit.length}`);
  }
}

main();
