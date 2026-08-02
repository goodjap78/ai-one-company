import type { Recipe } from '../../data/recipes/types';
import { resolveRecipeIngredientMatchKey } from './fridgeIngredientMatch';
import type { FridgeRecipeIndexEntry } from './fridgeRaidTypes';

const recipeIndexCache = new Map<string, FridgeRecipeIndexEntry>();

function buildIndexEntry(recipe: Recipe): FridgeRecipeIndexEntry {
  const mainMatchKeys: string[] = [];
  const mainNames: string[] = [];
  const subMatchKeys: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const matchKey = resolveRecipeIngredientMatchKey(ingredient);
    if (!matchKey) continue;

    if (ingredient.group === 'main') {
      mainMatchKeys.push(matchKey);
      mainNames.push(ingredient.name);
      continue;
    }

    if (ingredient.group === 'sub') {
      subMatchKeys.push(matchKey);
    }
  }

  return {
    recipeId: recipe.id,
    title: recipe.name,
    cookTime: recipe.time,
    imagePath: recipe.image,
    heroImageKey: recipe.heroImageKey,
    mainMatchKeys,
    mainNames,
    subMatchKeys,
  };
}

/** Memoized per-recipe normalization — safe to call repeatedly across pantry changes. */
export function getFridgeRecipeIndexEntry(recipe: Recipe): FridgeRecipeIndexEntry {
  const cached = recipeIndexCache.get(recipe.id);
  if (cached) return cached;

  const built = buildIndexEntry(recipe);
  recipeIndexCache.set(recipe.id, built);
  return built;
}

export function buildFridgeRecipeIndex(recipes: Recipe[]): Map<string, FridgeRecipeIndexEntry> {
  const index = new Map<string, FridgeRecipeIndexEntry>();
  for (const recipe of recipes) {
    index.set(recipe.id, getFridgeRecipeIndexEntry(recipe));
  }
  return index;
}

/** Test helper — clears memoization between runs. */
export function clearFridgeRecipeIndexCache(): void {
  recipeIndexCache.clear();
}
