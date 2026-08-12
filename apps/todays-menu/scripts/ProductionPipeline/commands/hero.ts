/**
 * npm run pipeline:hero
 * Hero Prompt + Hero Queue (no AI generation).
 */
import { runHeroPromptGenerator } from '../modules/heroPromptGenerator';
import { runHeroQueueGenerator } from '../modules/heroQueueGenerator';
import { persistAfterModule } from './_persist';

function main(): void {
  console.log('=== pipeline:hero (Prompt + Queue) ===\n');

  const prompts = runHeroPromptGenerator();
  console.log(`Hero prompts: ${prompts.promptCount}`);
  console.log(`Manifest: ${prompts.manifestPath}`);
  console.log(`Prompts dir: ${prompts.promptsDir}`);

  const queue = runHeroQueueGenerator();
  console.log('\nHero queue totals:');
  console.log(`  recipes: ${queue.totals.recipes}`);
  console.log(`  queued: ${queue.totals.queued}`);
  console.log(`  approved: ${queue.totals.approved}`);
  console.log(`  completed: ${queue.totals.completed}`);
  console.log(`Queue: ${queue.queuePath}`);
  console.log(`Review HTML: ${queue.reviewHtml}`);
  console.log('\n(No AI images generated.)');

  persistAfterModule(
    'hero',
    `${new Date().toISOString()} prompts=${prompts.promptCount} queued=${queue.totals.queued}`,
  );
  console.log('\nDashboard updated → generated/production-pipeline/');
}

main();
