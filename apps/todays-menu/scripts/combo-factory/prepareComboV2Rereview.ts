/**
 * Sprint Combo v2 — backup production + review v1, reset queue for re-review.
 * Does NOT delete production assets/convenience-combos JPGs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { COMBO_IMAGE_PILOT_MAP } from '../../data/content/combos/convenienceComboImagePilots';
import {
  loadComboQueue,
  updateQueueItem,
  writeComboQueue,
} from './buildQueue';
import { COMBO_IMAGE_PILOT_IDS } from './comboHeroHints';
import { PATHS } from './config';
import { reviewImagePath, writeComboReviewPackage } from './reviewStore';

export const COMBO_V2_HISTORY_ROOT = path.join(
  PATHS.generatedRoot,
  'history',
  'sprint-combo-v2-originals',
);

export type ComboV2RereviewReport = {
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

export function prepareComboV2Rereview(): ComboV2RereviewReport {
  const queue = loadComboQueue();
  if (!queue) {
    throw new Error('Missing combo queue — run: npm run combo:queue');
  }

  const productionBackupDir = path.join(COMBO_V2_HISTORY_ROOT, 'production');
  const reviewV1Dir = path.join(COMBO_V2_HISTORY_ROOT, 'review-v1');

  let approvedBefore = 0;
  let completedBefore = 0;
  let productionBackedUp = 0;
  let reviewV1BackedUp = 0;
  let resetToReview = 0;

  let working = queue;

  for (const comboId of COMBO_IMAGE_PILOT_IDS) {
    const imageKey = COMBO_IMAGE_PILOT_MAP[comboId];
    const item = working.items.find((i) => i.comboId === comboId);
    if (!item) continue;

    if (item.status === 'approved') approvedBefore += 1;
    if (item.status === 'completed') completedBefore += 1;

    const productionAbs = path.join(PATHS.comboAssetsDir, item.outputFilename);
    const productionDest = path.join(
      productionBackupDir,
      `${comboId}-${imageKey}.jpg`,
    );
    if (copyIfExists(productionAbs, productionDest)) {
      productionBackedUp += 1;
    }

    const reviewAbs = reviewImagePath(imageKey);
    const reviewDest = path.join(reviewV1Dir, `${imageKey}.jpg`);
    if (copyIfExists(reviewAbs, reviewDest)) {
      reviewV1BackedUp += 1;
    }

    if (item.status === 'approved' || item.status === 'completed') {
      working = updateQueueItem(working, imageKey, {
        status: 'completed',
        error: undefined,
      });
      writeComboReviewPackage({
        item: item,
        status: 'completed',
        notes:
          'Combo Hero v2.0 re-review — production kept until new approve; regenerate with --force',
      });
      resetToReview += 1;
    }
  }

  writeComboQueue(working);

  return {
    approvedBefore,
    completedBefore,
    productionBackedUp,
    reviewV1BackedUp,
    resetToReview,
    backupDir: COMBO_V2_HISTORY_ROOT,
  };
}

export function v1ProductionHistoryRelative(
  comboId: string,
  imageKey: string,
): string | null {
  const rel = path.join(
    'generated/combo-factory/history/sprint-combo-v2-originals/production',
    `${comboId}-${imageKey}.jpg`,
  );
  const abs = path.join(PATHS.appRoot, rel);
  return fs.existsSync(abs) ? rel : null;
}

export function v1ReviewHistoryRelative(imageKey: string): string | null {
  const rel = path.join(
    'generated/combo-factory/history/sprint-combo-v2-originals/review-v1',
    `${imageKey}.jpg`,
  );
  const abs = path.join(PATHS.appRoot, rel);
  return fs.existsSync(abs) ? rel : null;
}
