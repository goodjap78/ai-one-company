/**
 * Sprint 50-B — backup side-dish heroes and reset queue for v2 re-review.
 * Does NOT delete production assets/meals JPGs.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadImageQueue,
  updateQueueItem,
  writeImageQueue,
} from './buildImageQueue';
import { PATHS } from './config';
import {
  candidatePathFor,
  flatReviewImagePath,
  writeReviewPackage,
} from './reviewStore';
import { isSideDishRecipeId, SIDE_DISH_RECIPE_IDS } from './sideDishScope';

export const SIDE_DISH_HISTORY_ROOT = path.join(
  PATHS.generatedRoot,
  'history',
  'sprint50-side-dish-originals',
);

export type SideDishRereviewReport = {
  approvedBefore: number;
  completedBefore: number;
  productionBackedUp: number;
  reviewV1BackedUp: number;
  resetToReview: number;
  backupDir: string;
};

function copyIfExists(src: string, dest: string): boolean {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

export function prepareSideDishRereview(): SideDishRereviewReport {
  const queue = loadImageQueue();
  if (!queue) {
    throw new Error('Missing image-queue.json — run npm run image-factory:prepare');
  }

  const productionBackupDir = path.join(SIDE_DISH_HISTORY_ROOT, 'production');
  const reviewV1Dir = path.join(SIDE_DISH_HISTORY_ROOT, 'review-v1');

  let approvedBefore = 0;
  let completedBefore = 0;
  let productionBackedUp = 0;
  let reviewV1BackedUp = 0;
  let resetToReview = 0;

  let working = queue;

  for (const recipeId of SIDE_DISH_RECIPE_IDS) {
    const item = working.items.find((i) => i.recipeId === recipeId);
    if (!item) continue;

    if (item.status === 'approved') approvedBefore += 1;
    if (item.status === 'completed') completedBefore += 1;

    const productionAbs = path.join(PATHS.mealAssetsDir, `${item.heroImageKey}.jpg`);
    const productionDest = path.join(
      productionBackupDir,
      `${recipeId}-${item.heroImageKey}.jpg`,
    );
    if (copyIfExists(productionAbs, productionDest)) {
      productionBackedUp += 1;
    }

    const flatReview = flatReviewImagePath(recipeId, item.heroImageKey);
    const flatDest = path.join(reviewV1Dir, `${recipeId}-${item.heroImageKey}.jpg`);
    if (copyIfExists(flatReview, flatDest)) {
      reviewV1BackedUp += 1;
    }

    const legacyCandidate = candidatePathFor(item.heroImageKey);
    const legacyDest = path.join(
      reviewV1Dir,
      `${recipeId}-${item.heroImageKey}-candidate.jpg`,
    );
    copyIfExists(legacyCandidate, legacyDest);

    // Reset approved → completed (review candidate slot) for v2 regen without touching production.
    if (item.status === 'approved') {
      working = updateQueueItem(working, recipeId, {
        status: 'completed',
        error: undefined,
      });
      writeReviewPackage({
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        heroImageKey: item.heroImageKey,
        status: 'completed',
        notes:
          'Sprint 50-B v2 re-review — production kept until new approve; regenerate with --force',
      });
      resetToReview += 1;
    }
  }

  writeImageQueue(working);

  return {
    approvedBefore,
    completedBefore,
    productionBackedUp,
    reviewV1BackedUp,
    resetToReview,
    backupDir: path.relative(PATHS.appRoot, SIDE_DISH_HISTORY_ROOT),
  };
}

export function filterSideDishQueueItems(
  items: { recipeId: string }[],
): { recipeId: string }[] {
  return items.filter((i) => isSideDishRecipeId(i.recipeId));
}
