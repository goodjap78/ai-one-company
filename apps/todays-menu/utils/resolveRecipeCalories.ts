import { getCoreRecipeById } from '../data/recipes/coreRecipeService';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

/**
 * Resolve display calories without mutating recipe DTOs.
 * Prefers HANKKI content nutrition, then core catalog.
 * Unverified placeholders are not shown as measured values.
 */
export function resolveRecipeCalories(recipeId: string): number | null {
  const hankki = getHankkiRecipeById(recipeId);
  if (hankki?.nutrition.source === 'unverified') {
    return null;
  }
  if (typeof hankki?.nutrition.calorie === 'number' && hankki.nutrition.calorie > 0) {
    return hankki.nutrition.calorie;
  }

  const core = getCoreRecipeById(recipeId);
  if (typeof core?.calories === 'number' && core.calories > 0) {
    return core.calories;
  }

  return null;
}
