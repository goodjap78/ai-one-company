/**
 * Registry Updater — sync static require() registries for assets that EXIST on disk.
 * Does NOT generate images. Safe for AUTO-1 prepare/validate stages.
 */
import fs from 'node:fs';
import { updateIngredientRegistry } from '../../recipe-assets/updateIngredientRegistry';
import { updateStepImageRegistry } from '../../recipe-assets/updateStepImageRegistry';
import { updateMealImageRegistry } from '../../image-factory/updateMealImageRegistry';
import { clearRegisteredMealKeyCache } from '../../image-factory/buildImageQueue';
import { PIPELINE_PATHS } from '../config';
import { HANKKI_RECIPES } from '../../../data/recipes/hankkiRecipes';

export type RegistryUpdaterResult = {
  mealsUpdated: boolean;
  ingredientsUpdated: boolean;
  stepsUpdated: boolean;
  mealKeys: string[];
  ingredientKeys: string[];
  stepKeys: string[];
};

function listKeysOnDisk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`^[a-z][a-z0-9_]*\\.${ext}$`, 'i');
  return fs
    .readdirSync(dir)
    .filter((f) => re.test(f))
    .map((f) => f.replace(new RegExp(`\\.${ext}$`, 'i'), ''))
    .sort((a, b) => a.localeCompare(b));
}

export function runRegistryUpdater(): RegistryUpdaterResult {
  const mealKeysOnDisk = listKeysOnDisk(PIPELINE_PATHS.mealsDir, 'jpg').filter(
    (k) => !k.startsWith('category_'),
  );
  // Prefer catalog heroes that exist on disk (factory still may sweep all on-disk)
  const catalogKeys = new Set(HANKKI_RECIPES.map((r) => r.heroImageKey));
  const mealKeys = mealKeysOnDisk.filter((k) => catalogKeys.has(k));

  const ingredientKeys = listKeysOnDisk(PIPELINE_PATHS.ingredientsDir, 'png');
  const stepKeys = listKeysOnDisk(PIPELINE_PATHS.stepsDir, 'jpg');

  const meals = updateMealImageRegistry(mealKeys);
  clearRegisteredMealKeyCache();
  const ingredients = updateIngredientRegistry(ingredientKeys);
  const steps = updateStepImageRegistry(stepKeys);

  return {
    mealsUpdated: meals.updated,
    ingredientsUpdated: ingredients.updated,
    stepsUpdated: steps.updated,
    mealKeys: meals.registeredHankkiKeys,
    ingredientKeys: ingredients.registeredKeys,
    stepKeys: steps.registeredKeys,
  };
}
