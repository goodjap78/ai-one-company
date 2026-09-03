/**
 * Sprint v1.1 baby food feed — eligible complementary-food selection only.
 * Does not change Home / Fridge / AI recommendation or toddler / elementary feeds.
 * Does not assign audience or rewrite recipes.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isEligibleForChildFeed } from './recipeFamilyAudiencePolicy';
import type { BabyFoodStage } from './recipeFamilyAudienceTypes';
import type { Recipe } from './types';

/** Visible feed stages including 전환기 (completion). Internal enum is never shown as UI copy. */
export const BABY_FOOD_FEED_STAGES = ['early', 'middle', 'late', 'completion'] as const;
export type BabyFoodFeedStage = (typeof BABY_FOOD_FEED_STAGES)[number];

export const BABY_FOOD_FEED_DEFAULT_STAGE: BabyFoodFeedStage = 'early';

function compareRecipeId(a: Recipe, b: Recipe): number {
  return a.id.localeCompare(b.id);
}

export function isBabyFoodFeedStage(value: string): value is BabyFoodFeedStage {
  return (BABY_FOOD_FEED_STAGES as readonly string[]).includes(value);
}

export function isEligibleBabyFoodFeedRecipe(recipe: Recipe, stage?: BabyFoodFeedStage): boolean {
  const audience = recipe.familyAudience;
  if (!audience.audiences.includes('baby')) return false;
  if (audience.audiences.includes('toddler')) return false;
  if (audience.audiences.includes('elementary')) return false;
  if (audience.audiences.includes('general')) return false;
  if (audience.reviewStatus !== 'explicit') return false;
  if (audience.babySafetyReview?.reviewStatus !== 'approved') return false;
  if (!audience.babyFood) return false;

  const childFeed = isEligibleForChildFeed(audience, { audience: 'baby' });
  if (!childFeed.ok) return false;

  if (stage) {
    if (audience.babyFood.stage !== stage) return false;
    if (audience.babySafetyReview.stage !== stage) return false;
  }

  return true;
}

export function listBabyFoodFeedRecipes(stage?: BabyFoodFeedStage): Recipe[] {
  return HANKKI_RECIPES.filter((recipe) => isEligibleBabyFoodFeedRecipe(recipe, stage)).sort(
    compareRecipeId,
  );
}

function isApprovedBabyOnlyRecipe(recipe: Recipe): boolean {
  const audience = recipe.familyAudience;
  if (!audience.audiences.includes('baby')) return false;
  if (audience.audiences.includes('toddler')) return false;
  if (audience.audiences.includes('elementary')) return false;
  if (audience.audiences.includes('general')) return false;
  if (audience.reviewStatus !== 'explicit') return false;
  if (audience.babySafetyReview?.reviewStatus !== 'approved') return false;
  if (!audience.babyFood) return false;
  return isEligibleForChildFeed(audience, { audience: 'baby' }).ok;
}

export function isEligibleBabyFoodCompletionRecipe(recipe: Recipe): boolean {
  if (!isApprovedBabyOnlyRecipe(recipe)) return false;
  return (
    recipe.familyAudience.babyFood?.stage === 'completion' &&
    recipe.familyAudience.babySafetyReview?.stage === 'completion'
  );
}

export function listBabyFoodCompletionRecipes(): Recipe[] {
  return HANKKI_RECIPES.filter(isEligibleBabyFoodCompletionRecipe).sort(compareRecipeId);
}

export function babyFoodFeedStageOf(recipe: Recipe): BabyFoodStage | null {
  return recipe.familyAudience.babyFood?.stage ?? null;
}
