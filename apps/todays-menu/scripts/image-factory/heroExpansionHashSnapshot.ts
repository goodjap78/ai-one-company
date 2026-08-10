/**
 * Sprint 60 — SHA-256 snapshot for protected heroes (recipe 001–160).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { PATHS } from './config';
import {
  MEAL_HERO_EXPANSION_PATHS,
  PROTECTED_HERO_RECIPE_NUM_MAX,
  PROTECTED_HERO_RECIPE_NUM_MIN,
  type MealHeroExpansionBatch,
} from './mealHeroExpansionConfig';
import { parseHankkiRecipeNum } from './parseHankkiRecipeNum';
import { flatReviewImagePath } from './reviewStore';
import { productionAssetPath, sha256File, verifyPromoteCopy } from './promoteVerify';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { loadImageQueue } from './buildImageQueue';

export type ProtectedHeroHashRow = {
  recipeId: string;
  imageKey: string;
  productionPath: string;
  sha256: string;
  byteLength: number;
};

export type ProtectedHeroHashSnapshot = {
  generatedAt: string;
  recipeRange: string;
  count: number;
  rows: ProtectedHeroHashRow[];
};

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function buildProtectedHeroHashSnapshot(): ProtectedHeroHashSnapshot {
  const rows: ProtectedHeroHashRow[] = [];

  for (const recipe of HANKKI_RECIPES) {
    const n = parseHankkiRecipeNum(recipe.id);
    if (n == null || n < PROTECTED_HERO_RECIPE_NUM_MIN || n > PROTECTED_HERO_RECIPE_NUM_MAX) {
      continue;
    }
    const productionPath = `assets/meals/${recipe.heroImageKey}.jpg`;
    const abs = path.join(PATHS.mealAssetsDir, `${recipe.heroImageKey}.jpg`);
    if (!fs.existsSync(abs)) {
      throw new Error(`Protected hero missing on disk: ${recipe.id} ${productionPath}`);
    }
    rows.push({
      recipeId: recipe.id,
      imageKey: recipe.heroImageKey,
      productionPath,
      sha256: sha256File(abs),
      byteLength: fs.statSync(abs).size,
    });
  }

  rows.sort((a, b) => a.recipeId.localeCompare(b.recipeId));

  return {
    generatedAt: new Date().toISOString(),
    recipeRange: `${String(PROTECTED_HERO_RECIPE_NUM_MIN).padStart(3, '0')}–${String(PROTECTED_HERO_RECIPE_NUM_MAX).padStart(3, '0')}`,
    count: rows.length,
    rows,
  };
}

export function writeProtectedHeroHashSnapshot(
  target: 'before' | 'after' = 'before',
): string {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.root, { recursive: true });
  const snapshot = buildProtectedHeroHashSnapshot();
  const outPath =
    target === 'after'
      ? MEAL_HERO_EXPANSION_PATHS.hashSnapshotAfter
      : MEAL_HERO_EXPANSION_PATHS.hashSnapshotBefore;
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return outPath;
}

export function verifyProtectedHeroHashesMatch(
  beforePath = MEAL_HERO_EXPANSION_PATHS.hashSnapshotBefore,
): { ok: boolean; mismatches: string[] } {
  if (!fs.existsSync(beforePath)) {
    return { ok: false, mismatches: ['missing before snapshot'] };
  }
  const before = JSON.parse(fs.readFileSync(beforePath, 'utf8')) as ProtectedHeroHashSnapshot;
  const current = buildProtectedHeroHashSnapshot();
  const mismatches: string[] = [];
  const beforeMap = new Map(before.rows.map((r) => [r.recipeId, r.sha256]));

  for (const row of current.rows) {
    const prev = beforeMap.get(row.recipeId);
    if (!prev) {
      mismatches.push(`${row.recipeId}: not in before snapshot`);
      continue;
    }
    if (prev !== row.sha256) {
      mismatches.push(`${row.recipeId}: hash changed`);
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

export type BatchProductionHashRow = {
  recipeId: string;
  recipeName: string;
  imageKey: string;
  reviewPath: string;
  productionPath: string;
  reviewSha256: string;
  productionSha256: string;
  hashMatch: boolean;
  byteLength: number;
};

export function writeMealHeroExpansionBatchProductionHashes(
  batch: MealHeroExpansionBatch,
): {
  path: string;
  rows: BatchProductionHashRow[];
  allMatch: boolean;
} {
  const queue = loadImageQueue();
  const rows: BatchProductionHashRow[] = [];

  for (const recipeId of batch.recipeIds) {
    const recipe = getHankkiRecipeById(recipeId);
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const imageKey = item?.heroImageKey ?? recipe?.heroImageKey ?? '';
    const recipeName = item?.recipeName ?? recipe?.name ?? recipeId;

    const reviewAbs = imageKey ? flatReviewImagePath(recipeId, imageKey) : '';
    const productionAbs = imageKey ? productionAssetPath(imageKey) : '';

    const verify =
      reviewAbs && productionAbs
        ? verifyPromoteCopy({
            reviewAbs,
            productionAbs,
            heroImageKey: imageKey,
          })
        : null;

    rows.push({
      recipeId,
      recipeName,
      imageKey,
      reviewPath: reviewAbs,
      productionPath: productionAbs,
      reviewSha256: verify?.reviewSha256 ?? '',
      productionSha256: verify?.productionSha256 ?? '',
      hashMatch: verify?.hashMatch ?? false,
      byteLength:
        verify?.productionExists && productionAbs && fs.existsSync(productionAbs)
          ? fs.statSync(productionAbs).size
          : 0,
    });
  }

  const allMatch = rows.every((r) => r.hashMatch);
  const outPath = path.join(
    MEAL_HERO_EXPANSION_PATHS.root,
    `${batch.id}-production-hashes.json`,
  );
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.root, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        batchId: batch.id,
        label: batch.label,
        generatedAt: new Date().toISOString(),
        allMatch,
        matchCount: rows.filter((r) => r.hashMatch).length,
        total: rows.length,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );

  return { path: outPath, rows, allMatch };
}
