/**
 * npm run pipeline:validate
 * Full Validation Engine + dashboard/report.
 */
import { runValidationEngine } from '../modules/validationEngine';
import { runRegistryUpdater } from '../modules/registryUpdater';
import { mergeAndPersistState } from '../modules/dashboard';
import { PIPELINE_PATHS } from '../config';

function main(): void {
  console.log('=== pipeline:validate (Validation Engine) ===\n');

  // Sync registries for any files already on disk before validating refs
  const registry = runRegistryUpdater();
  console.log('Registry sync:');
  console.log(
    `  meals updated=${registry.mealsUpdated} keys=${registry.mealKeys.length}`,
  );
  console.log(
    `  ingredients updated=${registry.ingredientsUpdated} keys=${registry.ingredientKeys.length}`,
  );
  console.log(
    `  steps updated=${registry.stepsUpdated} keys=${registry.stepKeys.length}`,
  );

  const { stats, validation } = runValidationEngine();
  mergeAndPersistState(
    {
      registry: `${new Date().toISOString()} meals=${registry.mealKeys.length}`,
      validate: `${new Date().toISOString()} ok=${validation.ok}`,
    },
    stats,
    validation,
  );

  console.log('\n## Progress');
  console.log(`  Recipes: ${stats.recipes}`);
  console.log(`  Heroes: ${stats.heroPresent} present / ${stats.heroMissing} missing`);
  console.log(
    `  Ingredients: ${stats.ingredientPresent} present / ${stats.ingredientMissing} missing`,
  );
  console.log(
    `  Steps: ${stats.stepPresent} present / ${stats.stepMissing} missing`,
  );
  console.log(`  Ready: ${stats.readyRecipes}`);
  console.log(`  Progress: ${stats.progressPercent}%`);

  console.log('\n## Validation');
  console.log(`  Structural OK: ${validation.ok ? 'PASS' : 'FAIL'}`);
  console.log(`  Duplicate IDs: ${validation.duplicateIds.length}`);
  console.log(`  Duplicate names: ${validation.duplicateNames.length}`);
  console.log(`  Duplicate hero keys: ${validation.duplicateHeroKeys.length}`);
  console.log(`  Broken registry: ${validation.brokenRegistryKeys.length}`);
  console.log(`  Recipe schema issues: ${validation.recipeIssues}`);
  console.log(`  Missing heroes: ${validation.missingHeroImages.length}`);
  console.log(
    `  Missing ingredient icons: ${validation.missingIngredientIcons.length}`,
  );
  console.log(`  Missing step images: ${validation.missingStepImages.length}`);

  if (validation.issues.length) {
    console.log('\n## Issues (sample)');
    for (const issue of validation.issues.slice(0, 20)) {
      console.log(`  - ${issue}`);
    }
  }

  console.log(`\nDashboard: ${PIPELINE_PATHS.dashboard}`);
  console.log(`Report:    ${PIPELINE_PATHS.report}`);
  console.log('\n(No AI images generated.)');

  if (!validation.ok) process.exitCode = 1;
}

main();
