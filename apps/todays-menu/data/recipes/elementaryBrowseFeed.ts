/**
 * Elementary browse feed — explicit elementary recipes only (78 eligible).
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isEligibleForChildFeed } from './recipeFamilyAudiencePolicy';
import type { Recipe } from './types';

function compareRecipeId(a: Recipe, b: Recipe): number {
  return a.id.localeCompare(b.id);
}

export function isEligibleElementaryBrowseRecipe(recipe: Recipe): boolean {
  const audience = recipe.familyAudience;
  if (!audience.audiences.includes('elementary')) return false;
  if (audience.audiences.includes('baby')) return false;
  if (audience.audiences.includes('toddler')) return false;
  if (audience.reviewStatus !== 'explicit') return false;

  return isEligibleForChildFeed(audience, { audience: 'elementary' }).ok;
}

export function listElementaryBrowseRecipes(): Recipe[] {
  return HANKKI_RECIPES.filter(isEligibleElementaryBrowseRecipe).sort(compareRecipeId);
}
