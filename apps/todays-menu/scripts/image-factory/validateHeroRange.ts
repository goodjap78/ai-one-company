/**
 * Sprint IMG-3 — validate heroes in a recipe ID range.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { loadImageQueue } from './buildImageQueue';
import { HERO_SIZE_EXPECT, PATHS } from './config';
import { inspectImageFile } from './engine';
import { expandRecipeIdRange } from './recipeIdRange';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';

export type HeroRangeValidation = {
  ok: boolean;
  fromId: string;
  toId: string;
  recipeCount: number;
  approved: number;
  missingProduction: number;
  duplicateHeroKeys: string[];
  filenameCollisions: string[];
  missingRegistry: string[];
  typescriptOk: boolean;
  issues: string[];
};

export function validateHeroRange(
  fromId: string,
  toId: string,
): HeroRangeValidation {
  const ids = expandRecipeIdRange(fromId, toId);
  const idSet = new Set(ids);
  const recipes = HANKKI_RECIPES.filter((r) => idSet.has(r.id));
  const issues: string[] = [];
  const queue = loadImageQueue();

  const keyToIds = new Map<string, string[]>();
  const fileToIds = new Map<string, string[]>();
  for (const r of recipes) {
    const list = keyToIds.get(r.heroImageKey) ?? [];
    list.push(r.id);
    keyToIds.set(r.heroImageKey, list);
    const file = `${r.heroImageKey}.jpg`;
    const fl = fileToIds.get(file) ?? [];
    fl.push(r.id);
    fileToIds.set(file, fl);
  }

  const duplicateHeroKeys = [...keyToIds.entries()]
    .filter(([, rids]) => rids.length > 1)
    .map(([k]) => k);
  const filenameCollisions = [...fileToIds.entries()]
    .filter(([, rids]) => rids.length > 1)
    .map(([f]) => f);

  if (duplicateHeroKeys.length) {
    issues.push(`Duplicate heroImageKey: ${duplicateHeroKeys.join(', ')}`);
  }
  if (filenameCollisions.length) {
    issues.push(`Filename collisions: ${filenameCollisions.join(', ')}`);
  }

  const registered = new Set(parseRegisteredMealKeys());
  const missingRegistry: string[] = [];
  let approved = 0;
  let missingProduction = 0;

  for (const r of recipes) {
    const abs = path.join(PATHS.mealAssetsDir, `${r.heroImageKey}.jpg`);
    const exists = fs.existsSync(abs);
    const q = queue?.items.find((i) => i.recipeId === r.id);
    if (q?.status === 'approved' || (exists && registered.has(r.heroImageKey))) {
      approved += 1;
    }
    if (!exists) {
      missingProduction += 1;
      // Missing is expected until generate+approve — track, not always fatal for range ok
    } else {
      const check = inspectImageFile(abs, {
        minWidth: HERO_SIZE_EXPECT.minWidth,
        minHeight: HERO_SIZE_EXPECT.minHeight,
        aspectHint: HERO_SIZE_EXPECT.aspectHint,
      });
      if (check.broken) {
        issues.push(`Broken image ${r.id}:${r.heroImageKey}`);
      }
      if (!registered.has(r.heroImageKey) && q?.status === 'approved') {
        missingRegistry.push(r.heroImageKey);
        issues.push(`Approved but unregistered: ${r.heroImageKey}`);
      }
    }

    // Resolve mapping (text check — avoid Metro require)
    const mapPath = path.join(PATHS.appRoot, 'data/recipes/recipeImageMap.ts');
    const mapSrc = fs.readFileSync(mapPath, 'utf8');
    const mapOk = new RegExp(
      `['"]${r.id}['"]\\s*:\\s*\\{\\s*kind:\\s*['"]local['"]`,
    ).test(mapSrc);
    if (!mapOk) issues.push(`recipeImageMap missing ${r.id}`);
  }

  let typescriptOk = false;
  try {
    execSync('npx tsc --noEmit -p tsconfig.json', {
      cwd: PATHS.appRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120_000,
    });
    typescriptOk = true;
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}`;
    const mealRelated = /mealImage(Assets|Types)|recipeImageMap/i.test(out);
    typescriptOk = !mealRelated;
    if (mealRelated) issues.push('TypeScript errors in meal image / map files');
  }

  // Structural integrity gates ok (duplicates / broken approved registry).
  // Missing production for ungenerated recipes does not fail IMG-3 prep.
  const ok =
    duplicateHeroKeys.length === 0 &&
    filenameCollisions.length === 0 &&
    missingRegistry.length === 0 &&
    typescriptOk &&
    !issues.some((i) => i.startsWith('Broken image'));

  return {
    ok,
    fromId,
    toId,
    recipeCount: recipes.length,
    approved,
    missingProduction,
    duplicateHeroKeys,
    filenameCollisions,
    missingRegistry,
    typescriptOk,
    issues,
  };
}
