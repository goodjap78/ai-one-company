/**
 * Sprint 60 — Build hero-140-inventory.json for recipe_0161–recipe_0300.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES, getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../../data/recipes/catalogExpansionHeroWaiver';
import { classifyRecipeFoodTypes } from '../../services/recommendation/mealTime/classifyMealFoodType';
import { deriveMealTimeFit } from '../../services/recommendation/mealTime/deriveMealTimeFit';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';
import { PATHS } from './config';
import {
  MEAL_HERO_EXPANSION_ALL_RECIPE_IDS,
  MEAL_HERO_EXPANSION_PATHS,
} from './mealHeroExpansionConfig';
import { isHeroExpansionApproved } from './heroExpansionWaiver';
import { parseHankkiRecipeNum } from './parseHankkiRecipeNum';

export type HeroExpansionInventoryRow = {
  recipeId: string;
  name: string;
  imageKey: string;
  foodTypes: string[];
  mealTime: string[];
  primaryMealTime: string;
  productionAssetPath: string;
  productionAssetExists: boolean;
  registryRegistered: boolean;
  waiverStatus: 'active' | 'approved' | 'not_waiver';
  expansionBatch: string | null;
};

export type HeroExpansionInventory = {
  generatedAt: string;
  targetCount: number;
  productionHeroCountBefore: number;
  rows: HeroExpansionInventoryRow[];
  duplicateImageKeys: string[];
  summary: {
    productionExists: number;
    registryRegistered: number;
    activeWaiver: number;
    approvedFromWaiver: number;
  };
};

function productionExists(imageKey: string): boolean {
  const abs = path.join(PATHS.mealAssetsDir, `${imageKey}.jpg`);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function batchForRecipeId(recipeId: string): string | null {
  const n = parseHankkiRecipeNum(recipeId);
  if (n == null || n < 161 || n > 300) return null;
  const batchIndex = Math.floor((n - 161) / 20) + 1;
  return `batch-${batchIndex}`;
}

export function buildHeroExpansionInventory(): HeroExpansionInventory {
  const registered = new Set(parseRegisteredMealKeys());
  const rows: HeroExpansionInventoryRow[] = [];

  for (const recipeId of MEAL_HERO_EXPANSION_ALL_RECIPE_IDS) {
    const recipe = getHankkiRecipeById(recipeId);
    if (!recipe) {
      throw new Error(`Missing recipe in catalog: ${recipeId}`);
    }
    const fit = deriveMealTimeFit(recipe);
    const textBlob = [
      recipe.name,
      ...recipe.ingredients.map((i) => i.name),
      recipe.category.join(' '),
    ].join(' ');
    const foodTypes = classifyRecipeFoodTypes(recipe, textBlob);
    const onWaiver = CATALOG_EXPANSION_HERO_WAIVER_IDS.has(recipeId);
    const approved = isHeroExpansionApproved(recipeId);

    rows.push({
      recipeId: recipe.id,
      name: recipe.name,
      imageKey: recipe.heroImageKey,
      foodTypes,
      mealTime: [...recipe.mealType],
      primaryMealTime: fit.primaryMealTime,
      productionAssetPath: `assets/meals/${recipe.heroImageKey}.jpg`,
      productionAssetExists: productionExists(recipe.heroImageKey),
      registryRegistered: registered.has(recipe.heroImageKey),
      waiverStatus: onWaiver
        ? approved
          ? 'approved'
          : 'active'
        : 'not_waiver',
      expansionBatch: batchForRecipeId(recipeId),
    });
  }

  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    keyCounts.set(row.imageKey, (keyCounts.get(row.imageKey) ?? 0) + 1);
  }
  const duplicateImageKeys = [...keyCounts.entries()]
    .filter(([, c]) => c > 1)
    .map(([k]) => k);

  const productionHeroCountBefore = HANKKI_RECIPES.filter((r) => {
    const n = parseHankkiRecipeNum(r.id);
    return n != null && n >= 1 && n <= 160 && productionExists(r.heroImageKey);
  }).length;

  return {
    generatedAt: new Date().toISOString(),
    targetCount: MEAL_HERO_EXPANSION_ALL_RECIPE_IDS.length,
    productionHeroCountBefore,
    rows,
    duplicateImageKeys,
    summary: {
      productionExists: rows.filter((r) => r.productionAssetExists).length,
      registryRegistered: rows.filter((r) => r.registryRegistered).length,
      activeWaiver: rows.filter((r) => r.waiverStatus === 'active').length,
      approvedFromWaiver: rows.filter((r) => r.waiverStatus === 'approved').length,
    },
  };
}

export function writeHeroExpansionInventory(): string {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.root, { recursive: true });
  const inventory = buildHeroExpansionInventory();
  fs.writeFileSync(
    MEAL_HERO_EXPANSION_PATHS.inventory,
    JSON.stringify(inventory, null, 2),
    'utf8',
  );
  return MEAL_HERO_EXPANSION_PATHS.inventory;
}
