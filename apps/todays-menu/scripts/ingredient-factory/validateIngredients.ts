/**
 * Validate ingredient assets + recipe resolution for a recipe range.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  fallbackKeyForCategory,
  lookupIngredientAlias,
} from '../../data/ingredients/ingredientAliases';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { inRecipeIdRange } from '../image-factory/recipeIdRange';
import { normalizeAssetKey } from '../recipe-assets/normalizeAssetKey';
import { loadIngredientQueue } from './buildQueue';
import { PATHS } from './config';
import { resolveIngredientIconMeta } from '../../services/images/resolveIngredientIcon';

export type IngredientValidation = {
  ok: boolean;
  totalUnique: number;
  approved: number;
  missingFiles: string[];
  missingRegistry: string[];
  requireMismatches: string[];
  duplicateKeys: string[];
  casingIssues: string[];
  brokenImages: string[];
  unresolved: string[];
  typescriptOk: boolean;
  recipeCoveragePercent: number;
  issues: string[];
};

function parseRequireMap(source: string): Map<string, string> {
  const map = new Map<string, string>();
  const block = source.match(
    /export const INGREDIENT_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return map;
  const re =
    /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*require\('([^']+)'\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    map.set(m[1], m[2].replace(/\\/g, '/'));
  }
  return map;
}

export function validateIngredients(
  fromId: string,
  toId: string,
): IngredientValidation {
  const queue = loadIngredientQueue();
  const recipes = HANKKI_RECIPES.filter((r) =>
    inRecipeIdRange(r.id, fromId, toId),
  );
  const issues: string[] = [];

  const items = queue?.items ?? [];
  const keys = items.map((i) => i.iconKey);
  const duplicateKeys = [
    ...new Set(keys.filter((k, i) => keys.indexOf(k) !== i)),
  ];
  if (duplicateKeys.length) {
    issues.push(`Duplicate iconKeys in queue: ${duplicateKeys.join(', ')}`);
  }

  const casingIssues: string[] = [];
  for (const key of keys) {
    if (key !== key.toLowerCase() || !/^[a-z][a-z0-9_]*$/.test(key)) {
      casingIssues.push(key);
    }
  }
  if (casingIssues.length) {
    issues.push(`Casing/key pattern issues: ${casingIssues.join(', ')}`);
  }

  const registrySource = fs.existsSync(PATHS.ingredientRegistry)
    ? fs.readFileSync(PATHS.ingredientRegistry, 'utf8')
    : '';
  const requireMap = parseRequireMap(registrySource);

  const missingFiles: string[] = [];
  const missingRegistry: string[] = [];
  const requireMismatches: string[] = [];
  const brokenImages: string[] = [];
  let approved = 0;

  for (const item of items) {
    const abs = path.join(PATHS.ingredientsDir, item.outputFilename);
    const exists = fs.existsSync(abs);
    if (item.status === 'approved') {
      approved += 1;
      if (!exists) {
        missingFiles.push(item.iconKey);
        issues.push(`Approved but file missing: ${item.iconKey}`);
      } else {
        const bytes = fs.readFileSync(abs);
        if (bytes.length < 50) brokenImages.push(item.iconKey);
        const isPng =
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47;
        if (!isPng) brokenImages.push(`${item.iconKey} (not PNG)`);
      }
      if (!requireMap.has(item.iconKey)) {
        missingRegistry.push(item.iconKey);
      } else {
        const expected = `../../assets/ingredients/${item.outputFilename}`;
        if (requireMap.get(item.iconKey) !== expected) {
          requireMismatches.push(
            `${item.iconKey}: ${requireMap.get(item.iconKey)}`,
          );
        }
      }
    }
  }

  // Filename collision on disk
  const onDisk = fs.existsSync(PATHS.ingredientsDir)
    ? fs.readdirSync(PATHS.ingredientsDir).filter((f) => f.endsWith('.png'))
    : [];
  const lower = onDisk.map((f) => f.toLowerCase());
  const collisions = onDisk.filter(
    (f, i) => lower.indexOf(f.toLowerCase()) !== i,
  );
  if (collisions.length) {
    issues.push(`Filename collisions: ${collisions.join(', ')}`);
  }

  // Resolution path for every recipe ingredient
  const unresolved: string[] = [];
  let coveredRecipes = 0;
  for (const recipe of recipes) {
    let recipeOk = true;
    for (const ing of recipe.ingredients) {
      const meta = resolveIngredientIconMeta({
        name: ing.name,
        iconKey: ing.iconKey,
      });
      // Safe resolve means we always get a key (specific or fallback)
      if (!meta.iconKey) {
        unresolved.push(`${recipe.id}:${ing.name}`);
        recipeOk = false;
        continue;
      }
      // Prefer chain verification
      const explicit = ing.iconKey?.trim()
        ? normalizeAssetKey(ing.iconKey)
        : null;
      const alias = lookupIngredientAlias(ing.name);
      const fallback = fallbackKeyForCategory(meta.category);
      if (!explicit && !alias && meta.iconKey !== fallback && !meta.iconKey) {
        unresolved.push(`${recipe.id}:${ing.name}`);
        recipeOk = false;
      }
    }
    if (recipeOk) coveredRecipes += 1;
  }

  const recipeCoveragePercent =
    recipes.length === 0
      ? 0
      : Math.round((coveredRecipes / recipes.length) * 1000) / 10;

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
    const related = /ingredientImageAssets/i.test(out);
    typescriptOk = !related;
    if (related) issues.push('TypeScript errors in ingredientImageAssets');
  }

  if (brokenImages.length) {
    issues.push(`Broken images: ${brokenImages.join(', ')}`);
  }
  if (missingRegistry.length) {
    issues.push(`Missing registry: ${missingRegistry.join(', ')}`);
  }
  if (requireMismatches.length) {
    issues.push(`Require mismatches: ${requireMismatches.length}`);
  }

  const ok =
    duplicateKeys.length === 0 &&
    casingIssues.length === 0 &&
    missingFiles.length === 0 &&
    missingRegistry.length === 0 &&
    requireMismatches.length === 0 &&
    brokenImages.length === 0 &&
    unresolved.length === 0 &&
    typescriptOk;

  return {
    ok,
    totalUnique: items.length,
    approved,
    missingFiles,
    missingRegistry,
    requireMismatches,
    duplicateKeys,
    casingIssues,
    brokenImages,
    unresolved,
    typescriptOk,
    recipeCoveragePercent,
    issues,
  };
}
