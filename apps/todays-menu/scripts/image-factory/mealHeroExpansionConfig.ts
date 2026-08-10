/**
 * Sprint 60 — Hero expansion batches (recipe_0161–recipe_0300, 20 per batch).
 * Reuses existing image-factory pipeline — no duplicate factory.
 */
import path from 'node:path';
import { APP_ROOT } from './config';

export const MEAL_HERO_EXPANSION_ROOT = path.join(
  APP_ROOT,
  'generated/meal-hero-expansion',
);

export const MEAL_HERO_EXPANSION_PATHS = {
  root: MEAL_HERO_EXPANSION_ROOT,
  inventory: path.join(MEAL_HERO_EXPANSION_ROOT, 'hero-140-inventory.json'),
  approvedRecipes: path.join(MEAL_HERO_EXPANSION_ROOT, 'approved-recipes.json'),
  hashSnapshotBefore: path.join(MEAL_HERO_EXPANSION_ROOT, 'protected-160-hashes-before.json'),
  hashSnapshotAfter: path.join(MEAL_HERO_EXPANSION_ROOT, 'protected-160-hashes-after.json'),
  auditDir: path.join(MEAL_HERO_EXPANSION_ROOT, 'audit'),
  reviewDir: path.join(MEAL_HERO_EXPANSION_ROOT, 'review'),
  /** Sprint 60.1.1 — copies of review JPGs for static serve (originals stay in image-factory). */
  reviewImagesDir: path.join(MEAL_HERO_EXPANSION_ROOT, 'review', 'images'),
  queueReadyDir: path.join(MEAL_HERO_EXPANSION_ROOT, 'queue-ready'),
  historyDir: path.join(MEAL_HERO_EXPANSION_ROOT, 'history'),
  final300HeroAudit: path.join(MEAL_HERO_EXPANSION_ROOT, 'final-300-hero-audit.json'),
} as const;

export function mealHeroExpansionHumanReviewPath(
  batchId: MealHeroExpansionBatchId,
): string {
  return path.join(MEAL_HERO_EXPANSION_ROOT, 'review', `${batchId}-human-review.json`);
}

export type MealHeroExpansionBatchId =
  | 'batch-1'
  | 'batch-2'
  | 'batch-3'
  | 'batch-4'
  | 'batch-5'
  | 'batch-6'
  | 'batch-7';

export type MealHeroExpansionBatch = {
  id: MealHeroExpansionBatchId;
  label: string;
  fromNum: number;
  toNum: number;
  recipeIds: string[];
};

function recipeIdFromNum(n: number): string {
  return `recipe_${String(n).padStart(4, '0')}`;
}

function buildBatch(
  id: MealHeroExpansionBatchId,
  label: string,
  fromNum: number,
  toNum: number,
): MealHeroExpansionBatch {
  const recipeIds: string[] = [];
  for (let n = fromNum; n <= toNum; n += 1) {
    recipeIds.push(recipeIdFromNum(n));
  }
  return { id, label, fromNum, toNum, recipeIds };
}

/** Sprint 60 — 7 batches × 20 recipes = 140 waived heroes. */
export const MEAL_HERO_EXPANSION_BATCHES: MealHeroExpansionBatch[] = [
  buildBatch('batch-1', '0161–0180', 161, 180),
  buildBatch('batch-2', '0181–0200', 181, 200),
  buildBatch('batch-3', '0201–0220', 201, 220),
  buildBatch('batch-4', '0221–0240', 221, 240),
  buildBatch('batch-5', '0241–0260', 241, 260),
  buildBatch('batch-6', '0261–0280', 261, 280),
  buildBatch('batch-7', '0281–0300', 281, 300),
];

export const MEAL_HERO_EXPANSION_ALL_RECIPE_IDS: string[] = MEAL_HERO_EXPANSION_BATCHES.flatMap(
  (b) => b.recipeIds,
);

export function getMealHeroExpansionBatch(
  batchId: MealHeroExpansionBatchId,
): MealHeroExpansionBatch {
  const batch = MEAL_HERO_EXPANSION_BATCHES.find((b) => b.id === batchId);
  if (!batch) throw new Error(`Unknown hero expansion batch: ${batchId}`);
  return batch;
}

export function parseMealHeroExpansionBatchArg(value: string): MealHeroExpansionBatch {
  const normalized = value.startsWith('batch-') ? value : `batch-${value}`;
  return getMealHeroExpansionBatch(normalized as MealHeroExpansionBatchId);
}

/** Recipes 001–160 — never overwrite in hero expansion. */
export const PROTECTED_HERO_RECIPE_NUM_MIN = 1;
export const PROTECTED_HERO_RECIPE_NUM_MAX = 160;

export const HERO_EXPANSION_REVIEW_PORT = 8770;
