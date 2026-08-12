/**
 * CONTENT-3 — batch generate missing Hero Images (20).
 * Review only. Never regenerates approved. Never auto-approves.
 *
 *   npm run produce:heroes:generate
 */
import {
  archiveHeroReviewsInRange,
  recordBatchTiming,
} from '../scaleProgress';
import {
  BATCH_SIZE,
  getProductionProgress,
  listMissingHeroIds,
  printProductionDashboard,
} from '../productionProgress';
import { runHeroGenerate } from '../../image-factory/runGenerate';

async function main(): Promise<void> {
  console.log('\n========== produce:heroes:generate (CONTENT-3) ==========');
  const batchIds = listMissingHeroIds(BATCH_SIZE);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Missing selected: ${batchIds.length}`);
  console.log(batchIds.length ? `IDs: ${batchIds.join(', ')}` : 'None — nothing to generate');

  if (batchIds.length === 0) {
    printProductionDashboard();
    return;
  }

  const started = Date.now();
  const result = await runHeroGenerate({
    recipeIds: batchIds,
    force: true,
    resume: true,
  });
  const elapsed = (Date.now() - started) / 1000;
  recordBatchTiming({
    lane: 'hero',
    count: Math.max(1, result.written),
    elapsedSeconds: elapsed,
  });
  archiveHeroReviewsInRange(batchIds[0], batchIds[batchIds.length - 1]);

  console.log(`\nGenerated this batch: ${result.written}`);
  console.log(`Failed: ${result.failed}`);
  console.log('Saved to Review only. Human approve required before production.');
  printProductionDashboard(getProductionProgress());

  if (result.failed > 0 || result.written < batchIds.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
