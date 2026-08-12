import { getMasterRecipeById, getMasterRecipeBySlug } from '../../recipes';
import type { Recipe } from '../../types/recipe';
import { withResolvedHeroImage } from '../../utils/mealHeroImage';
import { mapMasterRecipeToRecipe } from './masterRecipeMapper';
import { getRecipeById } from './mockRecipeDetails';

function resolveFromMasterDb(recipeId: string): Recipe | null {
  const byId = getMasterRecipeById(recipeId);
  if (byId) return mapMasterRecipeToRecipe(byId);

  const bySlug = getMasterRecipeBySlug(recipeId);
  if (bySlug) return mapMasterRecipeToRecipe(bySlug);

  return null;
}

export async function fetchRecipe(recipeId: string): Promise<Recipe | null> {
  const masterRecipe = resolveFromMasterDb(recipeId);
  if (masterRecipe) return withResolvedHeroImage(masterRecipe);

  const recipe = getRecipeById(recipeId);
  return recipe ? withResolvedHeroImage(recipe) : null;
}

/** @deprecated Use `fetchRecipe` */
export const fetchRecipeDetail = fetchRecipe;
