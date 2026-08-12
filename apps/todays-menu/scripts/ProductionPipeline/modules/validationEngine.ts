/**
 * Validation Engine — duplicate IDs/keys, missing assets, broken registry refs.
 * No AI image generation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../../../data/recipes/validateHankkiProduction';
import { buildAssetManifest } from '../../recipe-assets/buildAssetManifest';
import { readRecipes } from '../../recipe-assets/readRecipes';
import { PIPELINE_PATHS } from '../config';
import type { PipelineStats, PipelineValidation } from '../types';

function parseRequireKeys(filePath: string, constName: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const source = fs.readFileSync(filePath, 'utf8');
  const block = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!block) return [];
  const keys: string[] = [];
  const re = /^\s*(?:'([^']+)'|([a-zA-Z_][a-zA-Z0-9_]*))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    keys.push(m[1] ?? m[2]);
  }
  return keys;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dups.add(v);
    else seen.add(v);
  }
  return [...dups].sort();
}

function heroFileExists(heroImageKey: string): boolean {
  const p = path.join(PIPELINE_PATHS.mealsDir, `${heroImageKey}.jpg`);
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

export type ValidationEngineResult = {
  stats: PipelineStats;
  validation: PipelineValidation;
};

export function runValidationEngine(): ValidationEngineResult {
  const recipes = HANKKI_RECIPES;
  const production = validateHankkiProductionDb(recipes);
  const scanned = readRecipes(null);
  const manifest = buildAssetManifest(scanned);

  const ids = recipes.map((r) => r.id);
  const names = recipes.map((r) => r.name);
  const heroKeys = recipes.map((r) => r.heroImageKey);
  const ingredientKeys = manifest.ingredients.map((i) => i.iconKey);
  const stepKeys = manifest.steps.map((s) => s.imageKey);

  const missingHeroImages = recipes
    .filter((r) => !heroFileExists(r.heroImageKey))
    .map((r) => `${r.id}:${r.heroImageKey}`);

  const missingIngredientIcons = manifest.ingredients
    .filter((i) => !i.fileExists)
    .map((i) => i.iconKey);

  const missingStepImages = manifest.steps
    .filter((s) => !s.fileExists)
    .map((s) => s.imageKey);

  const mealRegKeys = parseRequireKeys(
    PIPELINE_PATHS.mealRegistry,
    'MEAL_LOCAL_IMAGES',
  ).filter(
    (k) =>
      k !== 'hankki-default' &&
      !k.startsWith('category_') &&
      !k.startsWith('gold_'),
  );

  const ingredientRegKeys = parseRequireKeys(
    PIPELINE_PATHS.ingredientRegistry,
    'INGREDIENT_IMAGE_ASSETS',
  );
  const stepRegKeys = parseRequireKeys(
    PIPELINE_PATHS.stepRegistry,
    'RECIPE_STEP_IMAGE_ASSETS',
  );

  const brokenRegistryKeys: string[] = [];
  for (const key of mealRegKeys) {
    if (!heroFileExists(key)) {
      brokenRegistryKeys.push(`meal:${key}`);
    }
  }
  for (const key of ingredientRegKeys) {
    const p = path.join(PIPELINE_PATHS.ingredientsDir, `${key}.png`);
    if (!fs.existsSync(p)) brokenRegistryKeys.push(`ingredient:${key}`);
  }
  for (const key of stepRegKeys) {
    const p = path.join(PIPELINE_PATHS.stepsDir, `${key}.jpg`);
    if (!fs.existsSync(p)) brokenRegistryKeys.push(`step:${key}`);
  }

  const brokenReferences: string[] = [];
  for (const recipe of recipes) {
    if (
      heroFileExists(recipe.heroImageKey) &&
      !mealRegKeys.includes(recipe.heroImageKey)
    ) {
      // File present but not in static registry — soft break for Metro
      brokenReferences.push(
        `hero unregistered:${recipe.id}:${recipe.heroImageKey}`,
      );
    }
  }
  for (const ing of manifest.ingredients) {
    if (ing.fileExists && !ing.registryHasKey) {
      brokenReferences.push(`ingredient unregistered:${ing.iconKey}`);
    }
  }
  for (const step of manifest.steps) {
    if (step.fileExists && !step.registryHasKey) {
      brokenReferences.push(`step unregistered:${step.imageKey}`);
    }
  }
  for (const d of manifest.duplicates) {
    brokenReferences.push(`manifest:${d}`);
  }
  for (const k of manifest.invalidKeys) {
    brokenReferences.push(`invalid:${k}`);
  }

  const duplicateIds = findDuplicates(ids);
  const duplicateNames = findDuplicates(names);
  const duplicateHeroKeys = findDuplicates(heroKeys);
  const duplicateIngredientKeys = findDuplicates(ingredientKeys);
  const duplicateStepKeys = findDuplicates(stepKeys);

  const issues: string[] = [];
  if (duplicateIds.length) issues.push(`Duplicate recipe IDs: ${duplicateIds.join(', ')}`);
  if (duplicateNames.length) {
    issues.push(`Duplicate recipe names: ${duplicateNames.join(', ')}`);
  }
  if (duplicateHeroKeys.length) {
    issues.push(`Duplicate hero keys: ${duplicateHeroKeys.join(', ')}`);
  }
  if (duplicateIngredientKeys.length) {
    issues.push(`Duplicate ingredient keys: ${duplicateIngredientKeys.join(', ')}`);
  }
  if (duplicateStepKeys.length) {
    issues.push(`Duplicate step keys: ${duplicateStepKeys.join(', ')}`);
  }
  if (brokenRegistryKeys.length) {
    issues.push(`Broken registry entries: ${brokenRegistryKeys.length}`);
  }
  for (const i of production.issues.slice(0, 20)) {
    issues.push(`[${i.code}] ${i.recipeId}: ${i.message}`);
  }
  if (production.issues.length > 20) {
    issues.push(`…and ${production.issues.length - 20} more recipe schema issues`);
  }

  // Structural integrity (duplicates + broken registry) gates ok.
  // Missing images are expected until Image Factory completes — reported but not fatal.
  const structuralOk =
    duplicateIds.length === 0 &&
    duplicateNames.length === 0 &&
    duplicateHeroKeys.length === 0 &&
    duplicateIngredientKeys.length === 0 &&
    duplicateStepKeys.length === 0 &&
    brokenRegistryKeys.length === 0 &&
    production.ok;

  const heroPresent = recipes.length - missingHeroImages.length;
  const ingredientPresent =
    manifest.summary.ingredientTotal - manifest.summary.ingredientMissing;
  const stepPresent = manifest.summary.stepTotal - manifest.summary.stepMissing;

  const readyRecipes = recipes.filter((r) => {
    if (!heroFileExists(r.heroImageKey)) return false;
    const ingOk = r.ingredients.every((ing) => {
      const entry = manifest.ingredients.find((i) => i.iconKey === ing.iconKey);
      return entry?.fileExists;
    });
    const steps = r.recipe?.steps ?? [];
    const stepOk = steps.every((step) => {
      const entry = manifest.steps.find((s) => s.imageKey === step.imageKey);
      return entry?.fileExists;
    });
    return ingOk && stepOk && steps.length > 0;
  }).length;

  const totalSlots =
    recipes.length +
    manifest.summary.ingredientTotal +
    manifest.summary.stepTotal;
  const filledSlots = heroPresent + ingredientPresent + stepPresent;
  const progressPercent =
    totalSlots === 0 ? 0 : Math.round((filledSlots / totalSlots) * 1000) / 10;

  const validation: PipelineValidation = {
    ok: structuralOk,
    duplicateIds,
    duplicateNames,
    duplicateHeroKeys,
    duplicateIngredientKeys,
    duplicateStepKeys,
    missingHeroImages,
    missingIngredientIcons,
    missingStepImages,
    brokenRegistryKeys,
    brokenReferences,
    recipeIssues: production.issues.length,
    issues,
  };

  const stats: PipelineStats = {
    recipes: recipes.length,
    heroPresent,
    heroMissing: missingHeroImages.length,
    ingredientPresent,
    ingredientMissing: manifest.summary.ingredientMissing,
    stepPresent,
    stepMissing: manifest.summary.stepMissing,
    readyRecipes,
    progressPercent,
  };

  return { stats, validation };
}
