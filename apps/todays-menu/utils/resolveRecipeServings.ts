import { getGoldMealById } from '../library/gold-meals';
import { getMasterRecipeById } from '../recipes';
import { getRecipeById } from '../services/recipe/mockRecipeDetails';
import type { MealMode } from '../types/home';

const DEFAULT_HOMEMADE_SERVINGS = 2;
const DEFAULT_DELIVERY_SERVINGS = 1;

/** Resolve serving size for Home quick-info chips without an extra fetch. */
export function resolveRecipeServings(recipeId: string, mealMode: MealMode): number {
  const gold = getGoldMealById(recipeId);
  if (gold) return gold.servings;

  const master = getMasterRecipeById(recipeId);
  if (master?.servings) return master.servings;

  const recipe = getRecipeById(recipeId);
  if (recipe) return recipe.servings;

  return mealMode === 'delivery' ? DEFAULT_DELIVERY_SERVINGS : DEFAULT_HOMEMADE_SERVINGS;
}
