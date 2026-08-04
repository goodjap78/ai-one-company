/**
 * npm run hero:reset-side-dishes
 * Sprint 50-B — backup + reset recipe_0141–0160 for v2 hero re-review.
 */
import { prepareSideDishRereview } from '../prepareSideDishRereview';
import { SIDE_DISH_RECIPE_IDS } from '../sideDishScope';

function main(): void {
  console.log('\n========== hero:reset-side-dishes (Sprint 50-B) ==========');
  console.log(`Scope: ${SIDE_DISH_RECIPE_IDS.length} recipes (0141–0160)\n`);

  const report = prepareSideDishRereview();

  console.log('--- Before reset ---');
  console.log(`approved (side dishes): ${report.approvedBefore}`);
  console.log(`completed (side dishes): ${report.completedBefore}`);
  console.log('--- Backup ---');
  console.log(`production JPG copied: ${report.productionBackedUp}`);
  console.log(`review v1 JPG copied: ${report.reviewV1BackedUp}`);
  console.log(`backup dir: ${report.backupDir}`);
  console.log('--- Reset ---');
  console.log(`approved → completed for re-review: ${report.resetToReview}`);
  console.log('Production assets/meals NOT deleted.');
  console.log('Next: npm run image-factory:prepare && hero:generate -- --from=0141 --to=0160 --force');
  console.log('==========================================================\n');
}

main();
