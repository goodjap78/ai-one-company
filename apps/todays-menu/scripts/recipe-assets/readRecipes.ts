import {
  HANKKI_RECIPES,
  getHankkiRecipeById,
} from '../../data/recipes/hankkiRecipes';
import type { Recipe, RecipeStepContent } from '../../data/recipes/types';
import { lookupIngredientAlias } from '../../data/ingredients/ingredientAliases';
import { heroKeyFromImagePath, normalizeAssetKey } from './normalizeAssetKey';
import type {
  RecipeIngredientRef,
  RecipeStepRef,
  ScannedRecipe,
} from './types';

function resolveIconKey(name: string, explicit?: string): string {
  if (explicit?.trim()) return normalizeAssetKey(explicit);
  const alias = lookupIngredientAlias(name);
  if (alias) return normalizeAssetKey(alias);
  return normalizeAssetKey(name) || `unknown_${name.length}`;
}

function parseStep(
  step: RecipeStepContent,
  index: number,
): RecipeStepRef | null {
  const imageKey = step.imageKey?.trim()
    ? normalizeAssetKey(step.imageKey)
    : '';

  return {
    order: index + 1,
    title: step.title?.trim() || step.guide?.trim() || `단계 ${index + 1}`,
    instruction: step.instruction.trim(),
    imageKey,
    tip: step.tip,
  };
}

function collectUniqueIngredients(recipe: Recipe): RecipeIngredientRef[] {
  const byKey = new Map<string, RecipeIngredientRef & { names: string[] }>();

  for (const item of recipe.ingredients) {
    const iconKey = resolveIconKey(item.name, item.iconKey);
    const existing = byKey.get(iconKey);
    if (existing) {
      if (!existing.names.includes(item.name)) existing.names.push(item.name);
      continue;
    }
    byKey.set(iconKey, {
      name: item.name,
      iconKey,
      group: item.group ?? 'unknown',
      names: [item.name],
    });
  }

  return [...byKey.values()].map(({ names: _names, ...rest }) => rest);
}

/** Collect all display names that map to each iconKey (for prompts / reports). */
export function collectIngredientNamesByKey(
  recipes: Recipe[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const recipe of recipes) {
    for (const item of recipe.ingredients) {
      const iconKey = resolveIconKey(item.name, item.iconKey);
      const list = map.get(iconKey) ?? [];
      if (!list.includes(item.name)) list.push(item.name);
      map.set(iconKey, list);
    }
  }
  return map;
}

export function scanRecipe(recipe: Recipe): ScannedRecipe {
  const steps = recipe.recipe.steps
    .map((step, index) => parseStep(step, index))
    .filter((step): step is RecipeStepRef => step !== null);

  return {
    id: recipe.id,
    name: recipe.name,
    heroImagePath: recipe.image,
    heroImageKey: heroKeyFromImagePath(recipe.image),
    ingredients: collectUniqueIngredients(recipe),
    steps: steps.filter((s) => s.imageKey.length > 0),
  };
}

export function readRecipes(recipeIds: string[] | null): ScannedRecipe[] {
  const source =
    recipeIds && recipeIds.length > 0
      ? recipeIds.map((id) => {
          const recipe = getHankkiRecipeById(id);
          if (!recipe) {
            throw new Error(`Recipe not found: ${id}`);
          }
          return recipe;
        })
      : HANKKI_RECIPES;

  return source.map(scanRecipe);
}

export function listAllHankkiRecipes(): Recipe[] {
  return HANKKI_RECIPES;
}
