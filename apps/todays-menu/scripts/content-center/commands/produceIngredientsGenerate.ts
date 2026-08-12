/**
 * CONTENT-3 — batch generate missing Ingredient Icons (20).
 * Review only. Never auto-approves.
 *
 *   npm run produce:ingredients:generate
 */
import {
  collectIngredientManifest,
  writeIngredientManifest,
} from '../../ingredient-factory/collectIngredients';
import { writeAllIngredientPrompts } from '../../ingredient-factory/buildPrompts';
import {
  buildIngredientQueue,
  loadIngredientQueue,
  writeIngredientQueue,
} from '../../ingredient-factory/buildQueue';
import { runIngredientGenerate } from '../../ingredient-factory/runGenerate';
import { writeIngredientReviewHtml } from '../../ingredient-factory/writeReviewHtml';
import { recordBatchTiming } from '../scaleProgress';
import {
  BATCH_SIZE,
  getProductionProgress,
  listMissingIngredientKeys,
  printProductionDashboard,
} from '../productionProgress';

async function main(): Promise<void> {
  console.log('\n========== produce:ingredients:generate (CONTENT-3) ==========');

  // Ensure queue covers enough unique keys
  const manifest = collectIngredientManifest('001', '100');
  writeIngredientManifest(manifest);
  writeAllIngredientPrompts(manifest.items);
  const queue = buildIngredientQueue(
    manifest,
    process.env.IMAGE_PROVIDER ?? 'gemini',
    { missingOnly: true },
  );
  writeIngredientQueue(queue);

  const keys = listMissingIngredientKeys(BATCH_SIZE);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Missing selected: ${keys.length}`);
  console.log(keys.length ? `Keys: ${keys.join(', ')}` : 'None');

  if (keys.length === 0) {
    printProductionDashboard();
    return;
  }

  const started = Date.now();
  const result = await runIngredientGenerate({
    keys,
    force: true,
    resume: true,
  });
  const elapsed = (Date.now() - started) / 1000;
  recordBatchTiming({
    lane: 'ingredient',
    count: Math.max(1, result.written),
    elapsedSeconds: elapsed,
  });

  const q2 = loadIngredientQueue();
  if (q2) writeIngredientReviewHtml(q2);

  console.log(`\nGenerated this batch: ${result.written}`);
  console.log(`Failed: ${result.failed}`);
  console.log('Saved to Review only. Human approve required before production.');
  printProductionDashboard(getProductionProgress());

  if (result.failed > 0 || result.written < keys.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
