/**
 * Production progress — APPROVED production assets only.
 *
 * Counts only when the full pipeline is complete:
 * Generate → Review → Human Approval → Production asset → App uses it
 *
 * Never auto-approves. Generated/review-only assets do not count.
 */
import fs from 'node:fs';
import path from 'node:path';
import { listHankkiRecipes } from '../../data/recipes/hankkiRecipes';
import { PATHS as HERO_PATHS } from '../image-factory/config';
import { PATHS as INGREDIENT_PATHS } from '../ingredient-factory/config';
import { PATHS as RECIPE_ASSET_PATHS } from '../recipe-assets/config';
import { loadImageQueue } from '../image-factory/buildImageQueue';
import { loadIngredientQueue } from '../ingredient-factory/buildQueue';
import { loadDashboardState } from '../image-factory/review-dashboard/dashboardState';

export const HERO_COST_USD = 0.04;
export const INGREDIENT_COST_USD = 0.04;
export const BATCH_SIZE = 20;

/** @deprecated Use getHeroRecipeTarget() — kept for legacy scale dashboards. */
export const SCALE_TARGET = 100;

/** Production hero denominator — all HANKKI recipes (excludes convenience combos). */
export function getHeroRecipeTarget(): number {
  return listHankkiRecipes().length;
}

export type ProductionProgress = {
  approvedHeroImages: number;
  approvedIngredientIcons: number;
  remaining: number;
  heroTarget: number;
  ingredientTarget: number;
  updatedAt: string;
};

function parseRequireKeys(source: string, constName: string): Set<string> {
  const keys = new Set<string>();
  const block = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!block) return keys;
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    keys.add(m[1] || m[2]);
  }
  return keys;
}

function parseRecipeImageMapLocalKeys(): Map<string, string> {
  const p = path.join(HERO_PATHS.appRoot, 'data/recipes/recipeImageMap.ts');
  const src = fs.readFileSync(p, 'utf8');
  const map = new Map<string, string>();
  const re =
    /'(0\d{2}|100)'\s*:\s*\{\s*kind:\s*'local',\s*key:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function humanApprovedHero(recipeId: string, heroImageKey: string): boolean {
  const q = loadImageQueue();
  const item = q?.items.find((i) => i.recipeId === recipeId);
  const dash = loadDashboardState().recipes[recipeId];
  const metaPath = path.join(HERO_PATHS.reviewDir, heroImageKey, 'meta.json');
  let metaStatus: string | undefined;
  if (fs.existsSync(metaPath)) {
    try {
      metaStatus = (
        JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { status?: string }
      ).status;
    } catch {
      /* ignore */
    }
  }
  return (
    item?.status === 'approved' ||
    dash?.reviewStatus === 'approved' ||
    metaStatus === 'approved'
  );
}

/**
 * Full pipeline hero count for one recipe.
 */
export function isHeroFullyApprovedInApp(
  recipeId: string,
  heroImageKey: string,
  imageMap: Map<string, string>,
  mealRegistryKeys: Set<string>,
): boolean {
  if (heroImageKey.startsWith('category_')) return false;

  // Human approval
  if (!humanApprovedHero(recipeId, heroImageKey)) return false;

  // Review existed (generate → review). Prefer flat review; allow approve-only trail.
  const reviewFlat = path.join(
    HERO_PATHS.reviewDir,
    `${recipeId}-${heroImageKey}.jpg`,
  );
  const reviewLegacy = path.join(
    HERO_PATHS.reviewDir,
    heroImageKey,
    'candidate.jpg',
  );
  if (!fs.existsSync(reviewFlat) && !fs.existsSync(reviewLegacy)) {
    // Approved without review file is invalid for this metric
    return false;
  }

  // Production asset updated
  const prod = path.join(HERO_PATHS.mealAssetsDir, `${heroImageKey}.jpg`);
  if (!fs.existsSync(prod)) return false;

  // App uses it — explicit RECIPE_IMAGE_MAP row or registry-backed heroImageKey.
  const mapKey = imageMap.get(recipeId);
  if (mapKey) {
    if (mapKey !== heroImageKey || mapKey.startsWith('category_')) return false;
    if (!mealRegistryKeys.has(mapKey)) return false;
  } else if (!mealRegistryKeys.has(heroImageKey)) {
    return false;
  }

  return true;
}

function humanApprovedIngredient(iconKey: string): boolean {
  const q = loadIngredientQueue();
  const item = q?.items.find((i) => i.iconKey === iconKey);
  return item?.status === 'approved';
}

export function isIngredientFullyApprovedInApp(
  iconKey: string,
  ingredientRegistryKeys: Set<string>,
): boolean {
  if (!iconKey || iconKey.startsWith('fallback_')) return false;

  // Human approval
  if (!humanApprovedIngredient(iconKey)) return false;

  // Review
  const review = path.join(INGREDIENT_PATHS.reviewDir, `${iconKey}.png`);
  if (!fs.existsSync(review)) return false;

  // Production
  const prod = path.join(INGREDIENT_PATHS.ingredientsDir, `${iconKey}.png`);
  if (!fs.existsSync(prod)) return false;

  // App uses it
  if (!ingredientRegistryKeys.has(iconKey)) return false;

  return true;
}

/**
 * Unique ingredient iconKeys required by recipe data (excludes fallback_*).
 * This is the correct production denominator — not an arbitrary 100.
 */
export function listUniqueIngredientKeys(): string[] {
  const keys = new Set<string>();
  for (const r of listHankkiRecipes()) {
    for (const ing of r.ingredients) {
      const k = (ing.iconKey || '').trim();
      if (k && !k.startsWith('fallback_')) keys.add(k);
    }
  }
  return [...keys].sort();
}

function listTrackedIngredientKeys(): string[] {
  const q = loadIngredientQueue();
  const keys = new Set<string>((q?.items ?? []).map((i) => i.iconKey));
  if (fs.existsSync(INGREDIENT_PATHS.reviewDir)) {
    for (const f of fs.readdirSync(INGREDIENT_PATHS.reviewDir)) {
      if (f.endsWith('.png')) keys.add(path.basename(f, '.png'));
    }
  }
  if (fs.existsSync(INGREDIENT_PATHS.ingredientsDir)) {
    for (const f of fs.readdirSync(INGREDIENT_PATHS.ingredientsDir)) {
      if (f.endsWith('.png')) keys.add(path.basename(f, '.png'));
    }
  }
  return [...keys].filter((k) => k && !k.startsWith('fallback_')).sort();
}

export function getProductionProgress(): ProductionProgress {
  const mealRegistryKeys = parseRequireKeys(
    fs.readFileSync(HERO_PATHS.mealRegistry, 'utf8'),
    'MEAL_LOCAL_IMAGES',
  );
  const ingredientRegistryKeys = parseRequireKeys(
    fs.readFileSync(RECIPE_ASSET_PATHS.ingredientRegistry, 'utf8'),
    'INGREDIENT_IMAGE_ASSETS',
  );
  const imageMap = parseRecipeImageMapLocalKeys();
  const recipes = listHankkiRecipes();
  const heroTarget = recipes.length;

  let approvedHeroImages = 0;
  for (const r of recipes) {
    if (
      isHeroFullyApprovedInApp(
        r.id,
        r.heroImageKey,
        imageMap,
        mealRegistryKeys,
      )
    ) {
      approvedHeroImages += 1;
    }
  }

  const ingredientKeys = listUniqueIngredientKeys();
  const ingredientTarget = ingredientKeys.length;
  let approvedIngredientIcons = 0;
  for (const key of ingredientKeys) {
    if (isIngredientFullyApprovedInApp(key, ingredientRegistryKeys)) {
      approvedIngredientIcons += 1;
    }
  }

  const remaining =
    Math.max(0, heroTarget - approvedHeroImages) +
    Math.max(0, ingredientTarget - approvedIngredientIcons);

  return {
    approvedHeroImages,
    approvedIngredientIcons,
    remaining,
    heroTarget,
    ingredientTarget,
    updatedAt: new Date().toISOString(),
  };
}

export function printProductionDashboard(
  progress = getProductionProgress(),
): void {
  console.log('\n========== HANKKI Production Progress ==========');
  console.log(
    `Approved Hero Images        ${progress.approvedHeroImages} / ${progress.heroTarget}`,
  );
  console.log(
    `Approved Ingredient Icons   ${progress.approvedIngredientIcons} / ${progress.ingredientTarget}`,
  );
  console.log(`Remaining                   ${progress.remaining}`);
  console.log('================================================\n');
}

/** Helpers still used by generate/approve batch commands */
export function listMissingHeroIds(limit = BATCH_SIZE): string[] {
  const mealRegistryKeys = parseRequireKeys(
    fs.readFileSync(HERO_PATHS.mealRegistry, 'utf8'),
    'MEAL_LOCAL_IMAGES',
  );
  const imageMap = parseRecipeImageMapLocalKeys();
  const out: string[] = [];
  for (const r of listHankkiRecipes()) {
    if (
      isHeroFullyApprovedInApp(
        r.id,
        r.heroImageKey,
        imageMap,
        mealRegistryKeys,
      )
    ) {
      continue;
    }
    const review = path.join(
      HERO_PATHS.reviewDir,
      `${r.id}-${r.heroImageKey}.jpg`,
    );
    if (fs.existsSync(review)) continue;
    if (humanApprovedHero(r.id, r.heroImageKey)) continue;
    out.push(r.id);
    if (out.length >= limit) break;
  }
  return out;
}

export function listHeroIdsAwaitingApproval(limit?: number): string[] {
  const mealRegistryKeys = parseRequireKeys(
    fs.readFileSync(HERO_PATHS.mealRegistry, 'utf8'),
    'MEAL_LOCAL_IMAGES',
  );
  const imageMap = parseRecipeImageMapLocalKeys();
  const out: string[] = [];
  for (const r of listHankkiRecipes()) {
    if (
      isHeroFullyApprovedInApp(
        r.id,
        r.heroImageKey,
        imageMap,
        mealRegistryKeys,
      )
    ) {
      continue;
    }
    const review = path.join(
      HERO_PATHS.reviewDir,
      `${r.id}-${r.heroImageKey}.jpg`,
    );
    if (!fs.existsSync(review)) continue;
    if (humanApprovedHero(r.id, r.heroImageKey)) continue;
    const q = loadImageQueue();
    const item = q?.items.find((i) => i.recipeId === r.id);
    if (item?.status === 'rejected') continue;
    out.push(r.id);
    if (limit != null && out.length >= limit) break;
  }
  return out;
}

export function listMissingIngredientKeys(limit = BATCH_SIZE): string[] {
  const registry = parseRequireKeys(
    fs.readFileSync(RECIPE_ASSET_PATHS.ingredientRegistry, 'utf8'),
    'INGREDIENT_IMAGE_ASSETS',
  );
  const q = loadIngredientQueue();
  const pending = (q?.items ?? []).filter((i) => {
    if (isIngredientFullyApprovedInApp(i.iconKey, registry)) return false;
    const review = path.join(
      INGREDIENT_PATHS.reviewDir,
      `${i.iconKey}.png`,
    );
    if (fs.existsSync(review)) return false;
    if (i.status === 'rejected' || i.status === 'approved') return false;
    return true;
  });
  return pending.slice(0, limit).map((i) => i.iconKey);
}

export function listIngredientKeysAwaitingApproval(limit?: number): string[] {
  const registry = parseRequireKeys(
    fs.readFileSync(RECIPE_ASSET_PATHS.ingredientRegistry, 'utf8'),
    'INGREDIENT_IMAGE_ASSETS',
  );
  const keys: string[] = [];
  for (const key of listTrackedIngredientKeys()) {
    if (isIngredientFullyApprovedInApp(key, registry)) continue;
    const review = path.join(INGREDIENT_PATHS.reviewDir, `${key}.png`);
    if (!fs.existsSync(review)) continue;
    if (humanApprovedIngredient(key)) continue;
    const q = loadIngredientQueue();
    const item = q?.items.find((i) => i.iconKey === key);
    if (item?.status === 'rejected') continue;
    keys.push(key);
  }
  return limit != null ? keys.slice(0, limit) : keys;
}
