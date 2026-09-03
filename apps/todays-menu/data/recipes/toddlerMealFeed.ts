/**
 * Sprint v1.1 toddler feed — eligible recipe selection only.
 * Does not change Home / AI recommendation or elementary weekly plan.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isEligibleForChildFeed } from './recipeFamilyAudiencePolicy';
import type { Recipe } from './types';

export const TODDLER_FEED_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type ToddlerFeedMealType = (typeof TODDLER_FEED_MEAL_TYPES)[number];

export type ToddlerMealFeedPick = {
  mealType: ToddlerFeedMealType;
  main: Recipe;
  alternatives: Recipe[];
};

function compareRecipeId(a: Recipe, b: Recipe): number {
  return a.id.localeCompare(b.id);
}

export function isToddlerFeedMealType(value: string): value is ToddlerFeedMealType {
  return (TODDLER_FEED_MEAL_TYPES as readonly string[]).includes(value);
}

export function isEligibleToddlerMealFeedRecipe(
  recipe: Recipe,
  mealType?: ToddlerFeedMealType,
): boolean {
  const audience = recipe.familyAudience;
  if (!audience.audiences.includes('toddler')) return false;
  if (audience.audiences.includes('baby')) return false;
  if (audience.reviewStatus !== 'explicit') return false;
  if (audience.toddlerSafetyReview?.reviewStatus !== 'approved') return false;

  const childFeed = isEligibleForChildFeed(audience, { audience: 'toddler' });
  if (!childFeed.ok) return false;

  if (mealType) {
    if (!recipe.standardMetadata.mealTypes.includes(mealType)) return false;
    const intended = audience.toddlerSafetyReview?.intendedMealTypes ?? [];
    if (intended.length > 0 && !intended.includes(mealType)) return false;
  }

  return true;
}

export function listToddlerMealFeedRecipes(mealType?: ToddlerFeedMealType): Recipe[] {
  return HANKKI_RECIPES.filter((recipe) => isEligibleToddlerMealFeedRecipe(recipe, mealType)).sort(
    compareRecipeId,
  );
}

export function pickToddlerMealFeed(
  mealType: ToddlerFeedMealType,
  previousRecipeId?: string | null,
): ToddlerMealFeedPick | null {
  const candidates = listToddlerMealFeedRecipes(mealType);
  if (candidates.length === 0) return null;

  let index = 0;
  if (previousRecipeId) {
    const previousIndex = candidates.findIndex((recipe) => recipe.id === previousRecipeId);
    if (previousIndex >= 0) {
      index = candidates.length === 1 ? previousIndex : (previousIndex + 1) % candidates.length;
    }
  }

  const main = candidates[index];
  return {
    mealType,
    main,
    alternatives: candidates.filter((recipe) => recipe.id !== main.id),
  };
}
