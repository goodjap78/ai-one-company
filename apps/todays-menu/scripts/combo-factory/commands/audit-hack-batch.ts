/**
 * npm run combo:audit-hack-batch -- --batch=1
 */
import {
  auditComboHeroes,
  metaMapFromManifest,
  writeComboAuditJson,
} from '../auditComboHeroV2';
import { loadComboManifest } from '../collectCombos';
import { hackBatchComboIds, parseHackBatchArg } from '../hackBatchScope';
import { writeHackBatchReviewHtml } from '../writeHackBatchReviewHtml';

async function main(): Promise<void> {
  const batch = parseHackBatchArg(process.argv.slice(2));
  if (!batch) {
    throw new Error('Usage: npm run combo:audit-hack-batch -- --batch=1');
  }

  console.log(`\n========== combo:audit-hack-batch (batch ${batch}) ==========`);

  const manifest = loadComboManifest();
  if (!manifest) {
    throw new Error('Missing manifest. Run: npm run combo:queue-hack');
  }

  const comboIds = [...hackBatchComboIds(batch)];
  const meta = metaMapFromManifest(manifest.items);
  const rows = await auditComboHeroes(comboIds, meta);
  const auditRel = writeComboAuditJson(batch, rows);
  const reviewRel = writeHackBatchReviewHtml(batch);

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
