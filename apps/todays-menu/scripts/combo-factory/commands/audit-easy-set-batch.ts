/**
 * npm run combo:audit-easy-set-batch -- --batch=1
 */
import {
  auditComboHeroes,
  metaMapFromManifest,
  writeEasySetComboAuditJson,
} from '../auditComboHeroV2';
import { loadComboManifest } from '../collectCombos';
import { easySetBatchComboIds, parseEasySetBatchArg } from '../easySetBatchScope';
import { writeEasySetBatchReviewHtml } from '../writeEasySetBatchReviewHtml';

async function main(): Promise<void> {
  const batch = parseEasySetBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error('Usage: npm run combo:audit-easy-set-batch -- --batch=1');
  }

  console.log(`\n========== combo:audit-easy-set-batch (batch ${batch}) ==========`);

  const manifest = loadComboManifest();
  if (!manifest) {
    throw new Error('Missing manifest. Run: npm run combo:queue-easy-set');
  }

  const comboIds = [...easySetBatchComboIds(batch)];
  const meta = metaMapFromManifest(manifest.items);
  const rows = await auditComboHeroes(comboIds, meta);
  const auditRel = writeEasySetComboAuditJson(batch, rows);
  const reviewRel = writeEasySetBatchReviewHtml(batch);

  for (const row of rows) {
    console.log(
      `  ${row.comboId} [${row.grade}] fill=${(row.fillRatio * 100).toFixed(0)}%`,
    );
  }

  console.log(`Audit → ${auditRel}`);
  console.log(`Review HTML → ${reviewRel}`);
  console.log('====================================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
