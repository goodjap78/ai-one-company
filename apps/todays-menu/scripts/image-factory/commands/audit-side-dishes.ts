/**
 * npm run hero:audit-side-dishes
 */
import { auditSideDishHeroes, writeSideDishAuditJson } from '../auditSideDishHeroV2';

async function main(): Promise<void> {
  console.log('\n========== hero:audit-side-dishes (Sprint 50-B) ==========');
  const rows = await auditSideDishHeroes();
  const json = writeSideDishAuditJson(rows);
  const pass = rows.filter((r) => r.grade === 'PASS_CANDIDATE').length;
  const manual = rows.filter((r) => r.grade === 'MANUAL_REVIEW').length;
  const regen = rows.filter((r) => r.grade === 'REGENERATE').length;
  console.log(`PASS_CANDIDATE: ${pass}`);
  console.log(`MANUAL_REVIEW: ${manual}`);
  console.log(`REGENERATE: ${regen}`);
  console.log(`JSON → ${json}`);
  for (const r of rows) {
    console.log(
      `${r.recipeId} | ${r.grade} | ${(r.centroidX * 100).toFixed(0)}×${(r.centroidY * 100).toFixed(0)}% | ${r.reasons.join('; ')}`,
    );
  }
  console.log('==========================================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
