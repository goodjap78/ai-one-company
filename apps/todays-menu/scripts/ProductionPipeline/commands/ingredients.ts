/**
 * npm run pipeline:ingredients
 * Ingredient Queue Generator (+ optional registry sync for on-disk files).
 */
import { runIngredientQueueGenerator } from '../modules/ingredientQueueGenerator';
import { runRegistryUpdater } from '../modules/registryUpdater';
import { persistAfterModule } from './_persist';

function main(): void {
  console.log('=== pipeline:ingredients (Ingredient Queue) ===\n');

  const queue = runIngredientQueueGenerator();
  console.log(`Ingredient keys: ${queue.total}`);
  console.log(`Present: ${queue.present}`);
  console.log(`Missing: ${queue.missing}`);
  console.log(`Registered: ${queue.registered}`);
  console.log(`Queue: ${queue.queuePath}`);

  const registry = runRegistryUpdater();
  console.log(
    `\nRegistry sync (disk→require): ingredients updated=${registry.ingredientsUpdated} keys=${registry.ingredientKeys.length}`,
  );
  console.log('(No AI images generated.)');

  persistAfterModule(
    'ingredients',
    `${new Date().toISOString()} total=${queue.total} missing=${queue.missing}`,
  );
  console.log('\nDashboard updated → generated/production-pipeline/');
}

main();
