/**
 * Sprint IMG-4 — hero:rollback
 *
 * Restores the previous production asset from
 *   generated/image-factory/backups/{recipeId}-{heroImageKey}.prev.jpg
 * written automatically by hero:approve --force before overwrite.
 *
 *   npm run hero:rollback -- --recipe=003
 *
 * Does not change prompts, recipes, UI, or navigation.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildImageQueue,
  clearRegisteredMealKeyCache,
  loadImageQueue,
  updateQueueItem,
  writeImageQueue,
} from '../buildImageQueue';
import { PATHS } from '../config';
import {
  backupAssetPath,
  productionAssetPath,
  sha256File,
} from '../promoteVerify';
import { updateMealImageRegistry } from '../updateMealImageRegistry';
import { writeReviewPackage } from '../reviewStore';

function parseArgs(argv: string[]) {
  const recipeId =
    argv.find((a) => a.startsWith('--id='))?.split('=')[1] ??
    argv.find((a) => a.startsWith('--recipe='))?.split('=')[1];
  const heroImageKey = argv.find((a) => a.startsWith('--key='))?.split('=')[1];
  return { recipeId, heroImageKey };
}

function main(): void {
  console.log('\n========== hero:rollback (IMG-4) ==========');
  const args = parseArgs(process.argv.slice(2));

  const queue = loadImageQueue() ?? buildImageQueue();
  const item = queue.items.find((row) => {
    if (args.recipeId) return row.recipeId === args.recipeId;
    if (args.heroImageKey) return row.heroImageKey === args.heroImageKey;
    return false;
  });

  if (!item) {
    console.error('Pass --recipe=003 (or --key=kimchi_stew) for a known queue item.');
    process.exitCode = 1;
    return;
  }

  const backupAbs = backupAssetPath(item.recipeId, item.heroImageKey);
  const productionAbs = productionAssetPath(item.heroImageKey);

  if (!fs.existsSync(backupAbs)) {
    console.error(
      `No backup found: ${path.relative(PATHS.appRoot, backupAbs)}\n` +
        'Rollback is only available after hero:approve --force created a .prev.jpg backup.',
    );
    process.exitCode = 1;
    return;
  }

  const backupSha = sha256File(backupAbs);
  fs.mkdirSync(path.dirname(productionAbs), { recursive: true });
  fs.copyFileSync(backupAbs, productionAbs);
  const prodSha = sha256File(productionAbs);

  if (backupSha !== prodSha) {
    console.error('Rollback hash mismatch — production not restored safely.');
    process.exitCode = 1;
    return;
  }

  let nextQueue = updateQueueItem(queue, item.recipeId, {
    status: 'completed',
    error: undefined,
  });
  writeImageQueue(nextQueue);

  writeReviewPackage({
    recipeId: item.recipeId,
    recipeName: item.recipeName,
    heroImageKey: item.heroImageKey,
    status: 'completed',
    notes: `Rolled back production from backup (sha256=${backupSha.slice(0, 16)})`,
  });

  const registry = updateMealImageRegistry([item.heroImageKey]);
  clearRegisteredMealKeyCache();

  console.log(`Restored: assets/meals/${item.heroImageKey}.jpg`);
  console.log(`From:     ${path.relative(PATHS.appRoot, backupAbs)}`);
  console.log(`Verify:   hashMatch=yes sha256=${prodSha.slice(0, 16)}…`);
  console.log(`Registry: ${registry.updated ? 'refreshed' : 'unchanged'}`);
  console.log(`Queue:    ${item.recipeId} → completed (awaiting re-approve)`);
  console.log('SUCCESS: Production rolled back.');
  console.log('==========================================\n');
}

main();
