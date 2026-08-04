/**
 * npm run combo:reset-pilots
 * Backup production + review v1, reset queue for Combo Hero v2.0 re-review.
 */
import { prepareComboV2Rereview } from '../prepareComboV2Rereview';
import { COMBO_IMAGE_PILOT_IDS } from '../comboHeroHints';

function main(): void {
  console.log('\n========== combo:reset-pilots (Combo v2) ==========');
  console.log(`Scope: ${COMBO_IMAGE_PILOT_IDS.join(', ')}\n`);

  const report = prepareComboV2Rereview();

  console.log('--- Before reset ---');
  console.log(`approved: ${report.approvedBefore}`);
  console.log(`completed: ${report.completedBefore}`);
  console.log('--- Backup ---');
  console.log(`production JPG backed up: ${report.productionBackedUp}`);
  console.log(`review v1 backed up: ${report.reviewV1BackedUp}`);
  console.log(`backup dir: ${report.backupDir}`);
  console.log('--- Reset ---');
  console.log(`reset to completed (re-review): ${report.resetToReview}`);
  console.log('Production assets/convenience-combos NOT deleted.');
  console.log('Next: npm run combo:generate -- --force');
  console.log('===================================================\n');
}

main();
