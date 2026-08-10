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
import { parseRegisteredMealKeys } from './updateMealImageRegistry';
import { countActiveHeroExpansionWaiver } from './heroExpansionWaiver';
import { isCatalogExpansionHeroWaiver } from '../../data/recipes/catalogExpansionHeroWaiver';

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

/** Verify production JPGs still match a saved batch production hash snapshot. */
export function verifyBatchProductionHashesFromSnapshot(
  snapshotPath: string,
): { ok: boolean; mismatches: string[] } {
  if (!fs.existsSync(snapshotPath)) {
    return { ok: false, mismatches: ['missing production hash snapshot'] };
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
    rows: Array<{ recipeId: string; imageKey: string; productionSha256: string }>;
  };
  const mismatches: string[] = [];
  for (const row of snapshot.rows) {
    const productionAbs = productionAssetPath(row.imageKey);
    if (!fs.existsSync(productionAbs)) {
      mismatches.push(`${row.recipeId}: production missing`);
      continue;
    }
    const current = sha256File(productionAbs);
    if (current !== row.productionSha256) {
      mismatches.push(`${row.recipeId}: production hash changed`);
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

export function verifyApprovedExpansionProductionHashes(): {
  ok: boolean;
  protected160: { ok: boolean; mismatches: string[] };
  batches: Array<{ batchId: string; ok: boolean; mismatches: string[] }>;
} {
  const protected160 = verifyProtectedHeroHashesMatch();
  const batches: Array<{ batchId: string; ok: boolean; mismatches: string[] }> = [];

  for (const batchId of ['batch-1', 'batch-2', 'batch-3', 'batch-4', 'batch-5', 'batch-6', 'batch-7']) {
    const snapshotPath = path.join(
      MEAL_HERO_EXPANSION_PATHS.root,
      `${batchId}-production-hashes.json`,
    );
    if (!fs.existsSync(snapshotPath)) continue;
    const result = verifyBatchProductionHashesFromSnapshot(snapshotPath);
    batches.push({ batchId, ...result });
  }

  return {
    ok: protected160.ok && batches.every((b) => b.ok),
    protected160,
    batches,
  };
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

export type Final300HeroAudit = {
  generatedAt: string;
  sprint: string;
  summary: {
    recipeCount: number;
    productionJpg: number;
    registryCoverage: number;
    activeWaiver: number;
    fallbackRecipes: number;
    duplicateImageKeys: number;
    duplicateAssetPaths: number;
    brokenRegistryRequires: number;
    protected160HashOk: boolean;
    expansionBatchHashesOk: boolean;
    allOk: boolean;
  };
  protected160: { ok: boolean; mismatches: string[] };
  expansionBatches: Array<{ batchId: string; ok: boolean; mismatches: string[] }>;
  issues: string[];
};

export function buildFinal300HeroAudit(): Final300HeroAudit {
  const registered = new Set(parseRegisteredMealKeys());
  const issues: string[] = [];

  const keyCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  let productionJpg = 0;
  let registryCoverage = 0;
  let brokenRegistryRequires = 0;

  for (const recipe of HANKKI_RECIPES) {
    const key = recipe.heroImageKey;
    const prodAbs = path.join(PATHS.mealAssetsDir, `${key}.jpg`);
    const prodRel = `assets/meals/${key}.jpg`;

    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    pathCounts.set(prodRel, (pathCounts.get(prodRel) ?? 0) + 1);

    if (fs.existsSync(prodAbs)) {
      productionJpg += 1;
    } else {
      issues.push(`${recipe.id}: production JPG missing (${prodRel})`);
    }

    if (registered.has(key)) {
      registryCoverage += 1;
    } else {
      brokenRegistryRequires += 1;
      issues.push(`${recipe.id}: heroImageKey not in mealImageAssets (${key})`);
    }

    if (isCatalogExpansionHeroWaiver(recipe.id)) {
      issues.push(`${recipe.id}: still on active hero waiver`);
    }
  }

  const duplicateImageKeys = [...keyCounts.entries()].filter(([, c]) => c > 1).map(([k]) => k);
  const duplicateAssetPaths = [...pathCounts.entries()].filter(([, c]) => c > 1).map(([p]) => p);

  if (duplicateImageKeys.length > 0) {
    issues.push(`duplicate imageKeys: ${duplicateImageKeys.join(', ')}`);
  }
  if (duplicateAssetPaths.length > 0) {
    issues.push(`duplicate asset paths: ${duplicateAssetPaths.join(', ')}`);
  }

  const protected160 = verifyProtectedHeroHashesMatch();
  const expansionVerify = verifyApprovedExpansionProductionHashes();
  const activeWaiver = countActiveHeroExpansionWaiver();
  const fallbackRecipes = HANKKI_RECIPES.length - productionJpg;

  if (activeWaiver > 0) {
    issues.push(`active waiver count ${activeWaiver} (expected 0)`);
  }
  if (fallbackRecipes > 0) {
    issues.push(`fallback recipes ${fallbackRecipes} (expected 0)`);
  }

  const allOk =
    issues.length === 0 &&
    productionJpg === 300 &&
    registryCoverage === 300 &&
    activeWaiver === 0 &&
    protected160.ok &&
    expansionVerify.ok;

  return {
    generatedAt: new Date().toISOString(),
    sprint: 'Sprint 60.14',
    summary: {
      recipeCount: HANKKI_RECIPES.length,
      productionJpg,
      registryCoverage,
      activeWaiver,
      fallbackRecipes,
      duplicateImageKeys: duplicateImageKeys.length,
      duplicateAssetPaths: duplicateAssetPaths.length,
      brokenRegistryRequires,
      protected160HashOk: protected160.ok,
      expansionBatchHashesOk: expansionVerify.ok,
      allOk,
    },
    protected160,
    expansionBatches: expansionVerify.batches,
    issues,
  };
}

export function writeFinal300HeroAudit(): string {
  const audit = buildFinal300HeroAudit();
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.root, { recursive: true });
  const outPath = MEAL_HERO_EXPANSION_PATHS.final300HeroAudit;
  fs.writeFileSync(outPath, JSON.stringify(audit, null, 2), 'utf8');
  return outPath;
}
