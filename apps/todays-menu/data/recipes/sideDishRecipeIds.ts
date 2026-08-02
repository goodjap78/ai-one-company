import { HANKKI_RECIPES } from './hankkiRecipes';
import { isSideDishRecipe } from './sideDishPolicy';

const SIDE_DISH_RECIPE_IDS = new Set(
  HANKKI_RECIPES.filter((recipe) => isSideDishRecipe(recipe)).map((recipe) => recipe.id),
);

export function isSideDishRecipeId(recipeId: string): boolean {
  return SIDE_DISH_RECIPE_IDS.has(recipeId);
}

export function listSideDishRecipeIds(): string[] {
  return [...SIDE_DISH_RECIPE_IDS];
}
