/**
 * npm run pipeline:steps
 * Step Queue Generator (+ optional registry sync for on-disk files).
 */
import { runStepQueueGenerator } from '../modules/stepQueueGenerator';
import { runRegistryUpdater } from '../modules/registryUpdater';
import { persistAfterModule } from './_persist';

function main(): void {
  console.log('=== pipeline:steps (Step Queue) ===\n');

  const queue = runStepQueueGenerator();
  console.log(`Step images: ${queue.total}`);
  console.log(`Present: ${queue.present}`);
  console.log(`Missing: ${queue.missing}`);
  console.log(`Registered: ${queue.registered}`);
  console.log(`Queue: ${queue.queuePath}`);

  const registry = runRegistryUpdater();
  console.log(
    `\nRegistry sync (disk→require): steps updated=${registry.stepsUpdated} keys=${registry.stepKeys.length}`,
  );
  console.log('(No AI images generated.)');

  persistAfterModule(
    'steps',
    `${new Date().toISOString()} total=${queue.total} missing=${queue.missing}`,
  );
  console.log('\nDashboard updated → generated/production-pipeline/');
}

main();
