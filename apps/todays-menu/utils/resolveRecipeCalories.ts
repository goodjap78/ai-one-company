import { getCoreRecipeById, getHankkiRecipeById } from '../data/recipes';

/**
 * Resolve display calories without mutating recipe DTOs.
 * Prefers HANKKI content nutrition, then core catalog.
 */
export function resolveRecipeCalories(recipeId: string): number | null {
  const hankki = getHankkiRecipeById(recipeId);
  if (typeof hankki?.nutrition.calorie === 'number' && hankki.nutrition.calorie > 0) {
    return hankki.nutrition.calorie;
  }

  const core = getCoreRecipeById(recipeId);
  if (typeof core?.calories === 'number' && core.calories > 0) {
    return core.calories;
  }

  return null;
}
