/**
 * Adult Home pool and general Fridge Raid auto-recommendation exclusion
 * for toddler-approved and baby-approved catalog rows.
 * Does not remove `general` from audiences and does not change child feeds,
 * recent/favorite, or direct recipe routes.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isExcludedFromGeneralHomeFeed } from './recipeFamilyAudiencePolicy';

const GENERAL_HOME_EXCLUDED_RECIPE_IDS = new Set(
  HANKKI_RECIPES.filter((recipe) => isExcludedFromGeneralHomeFeed(recipe.familyAudience)).map(
    (recipe) => recipe.id,
  ),
);

export function isExcludedFromGeneralHomeByRecipeId(recipeId: string): boolean {
  return GENERAL_HOME_EXCLUDED_RECIPE_IDS.has(recipeId);
}

export function listGeneralHomeExcludedRecipeIds(): string[] {
  return [...GENERAL_HOME_EXCLUDED_RECIPE_IDS];
}
