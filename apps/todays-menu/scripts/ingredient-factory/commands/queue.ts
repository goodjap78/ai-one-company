/**
 * npm run ingredient:queue -- --from=001 --to=050 --missing-only
 */
import path from 'node:path';
import {
  collectIngredientManifest,
  writeIngredientManifest,
} from '../collectIngredients';
import { writeAllIngredientPrompts } from '../buildPrompts';
import { buildIngredientQueue, writeIngredientQueue } from '../buildQueue';
import { PATHS } from '../config';
import { writeIngredientDashboard } from '../writeDashboard';
import { writeIngredientReviewHtml } from '../writeReviewHtml';

function parseArgs(argv: string[]) {
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1] ?? '001';
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? '160';
  const missingOnly = argv.includes('--missing-only');
  return { fromId, toId, missingOnly };
}

function main(): void {
  console.log('\n========== ingredient:queue (ING-2) ==========');
  const { fromId, toId, missingOnly } = parseArgs(process.argv.slice(2));
  console.log(`Range: ${fromId}–${toId}`);
  console.log(`missing-only: ${missingOnly}`);

  const manifest = collectIngredientManifest(fromId, toId);
  writeIngredientManifest(manifest);
  writeAllIngredientPrompts(manifest.items);

  const queue = buildIngredientQueue(
    manifest,
    process.env.IMAGE_PROVIDER ?? 'disabled',
    { missingOnly },
  );
  writeIngredientQueue(queue);
  writeIngredientReviewHtml(queue);
  writeIngredientDashboard({
    manifest,
    queue,
    unresolved: manifest.unresolvedAliases,
  });

  const approved = queue.totals.approved;
  const existing = queue.totals.existing_unregistered;
  const actionable = queue.items.filter((i) =>
    missingOnly
      ? i.status === 'queued' ||
        i.status === 'missing' ||
        i.status === 'failed' ||
        i.status === 'processing'
      : true,
  );
  const queued = queue.items.filter(
    (i) => i.status === 'queued' || i.status === 'missing',
  ).length;

  console.log(`\n--- Queue report ---`);
  console.log(`Total unique ingredients: ${manifest.totalUnique}`);
  console.log(`Approved count: ${approved}`);
  console.log(`Existing (unregistered) count: ${existing}`);
  console.log(`Queued count (missing): ${queued}`);
  console.log(`Actionable for generate: ${actionable.filter((i) => i.status !== 'approved' && i.status !== 'existing_unregistered' && i.status !== 'completed' && i.status !== 'rejected').length}`);
  console.log(`Unresolved aliases: ${manifest.unresolvedAliases.length}`);
  if (manifest.unresolvedAliases.length) {
    for (const u of manifest.unresolvedAliases.slice(0, 15)) {
      console.log(`  ~ ${u}`);
    }
    if (manifest.unresolvedAliases.length > 15) {
      console.log(`  … +${manifest.unresolvedAliases.length - 15} more`);
    }
  }
  console.log(`\nManifest → ${path.relative(PATHS.appRoot, PATHS.manifest)}`);
  console.log(`Queue → ${path.relative(PATHS.appRoot, PATHS.imageQueue)}`);
  console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  console.log('==============================================\n');
}

main();
