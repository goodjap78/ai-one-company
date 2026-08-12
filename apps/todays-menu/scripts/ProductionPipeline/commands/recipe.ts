/**
 * npm run pipeline:recipe
 * Recipe Generator — validate / count HANKKI_RECIPES production catalog.
 */
import { runRecipeGenerator } from '../modules/recipeGenerator';
import { persistAfterModule } from './_persist';

function main(): void {
  console.log('=== pipeline:recipe (Recipe Generator) ===\n');
  const result = runRecipeGenerator();
  console.log(`Recipes: ${result.count}`);
  console.log(`Validation: ${result.validationOk ? 'PASS' : 'FAIL'}`);
  console.log(`Issues: ${result.issueCount}`);
  if (result.issues.length) {
    for (const i of result.issues.slice(0, 15)) {
      console.log(`  - [${i.code}] ${i.recipeId}: ${i.message}`);
    }
    if (result.issues.length > 15) {
      console.log(`  …and ${result.issues.length - 15} more`);
    }
  }

  persistAfterModule(
    'recipe',
    `${new Date().toISOString()} count=${result.count} ok=${result.validationOk}`,
  );
  console.log('\nDashboard updated → generated/production-pipeline/');
  if (!result.validationOk) process.exitCode = 1;
}

main();
