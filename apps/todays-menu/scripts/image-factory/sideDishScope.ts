/**
 * Sprint 50 / 50-B — recipe_0141–0160 side-dish hero scope.
 */
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';

const SIDE_DISH_ID_RE = /^recipe_01(4[1-9]|5[0-9]|60)$/;

export const SIDE_DISH_RECIPE_IDS = HANKKI_RECIPES
  .filter((r) => SIDE_DISH_ID_RE.test(r.id))
  .map((r) => r.id)
  .sort();

export function isSideDishRecipeId(recipeId: string): boolean {
  return SIDE_DISH_ID_RE.test(recipeId);
}
