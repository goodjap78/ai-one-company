import type { Recipe } from '../../data/recipes/types';
import { resolveRecipeIngredientMatchKey } from './fridgeIngredientMatch';
import type { FridgeRecipeIndexEntry, FridgeRequiredIngredient } from './fridgeRaidTypes';

const recipeIndexCache = new Map<string, FridgeRecipeIndexEntry>();

function buildIndexEntry(recipe: Recipe): FridgeRecipeIndexEntry {
  const requiredIngredients: FridgeRequiredIngredient[] = [];

  for (const ingredient of recipe.ingredients) {
    const matchKey = resolveRecipeIngredientMatchKey(ingredient);
    if (!matchKey) continue;

    requiredIngredients.push({
      matchKey,
      name: ingredient.name,
      group: ingredient.group,
    });
  }

  const mainMatchKeys = requiredIngredients
    .filter((item) => item.group === 'main')
    .map((item) => item.matchKey);
  const mainNames = requiredIngredients
    .filter((item) => item.group === 'main')
    .map((item) => item.name);
  const subMatchKeys = requiredIngredients
    .filter((item) => item.group === 'sub')
    .map((item) => item.matchKey);

  return {
    recipeId: recipe.id,
    title: recipe.name,
    cookTime: recipe.time,
    difficulty: recipe.difficulty,
    recommendationPriority: recipe.recommendationPriority,
    imagePath: recipe.image,
    heroImageKey: recipe.heroImageKey,
    requiredIngredients,
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
