/**
 * Future child-feed eligibility.
 *
 * Home / AI recommendation still ignores familyAudience for feed switching.
 * Toddler-approved and baby-approved rows are excluded from the adult Home
 * and Fridge Raid pools only. kids_meal alone is never enough.
 */
import type { StandardMealType } from './recipeStandardMetadataTypes';
import type {
  ChildRecipeAudience,
  RecipeFamilyAudienceMetadata,
} from './recipeFamilyAudienceTypes';
import { hasChildAudience } from './recipeFamilyAudienceTypes';

export type ChildFeedRequest = {
  audience: ChildRecipeAudience;
  mealType?: StandardMealType;
  allowSideDish?: boolean;
};

export type ChildFeedEligibility = {
  ok: boolean;
  reasons: string[];
};

export function isEligibleForChildFeed(
  metadata: RecipeFamilyAudienceMetadata,
  request: ChildFeedRequest,
): ChildFeedEligibility {
  const reasons: string[] = [];

  if (!metadata.audiences.includes(request.audience)) {
    reasons.push(`missing_audience:${request.audience}`);
  }

  if (metadata.reviewStatus === 'unclassified' || metadata.collisionFlags.includes('unclassified_kids_meal')) {
    reasons.push('unclassified_kids_meal');
  }

  if (!hasChildAudience(metadata.audiences) && metadata.kidsMealTag) {
    reasons.push('kids_meal_is_not_an_age');
  }

  if (metadata.collisionFlags.includes('hangover')) reasons.push('hangover');
  if (metadata.collisionFlags.includes('drinking_snack')) reasons.push('drinking_snack');
  if (metadata.collisionFlags.includes('late_night')) reasons.push('late_night');
  if (metadata.collisionFlags.includes('spicy')) reasons.push('spicy');

  if (metadata.collisionFlags.includes('side_dish') && !request.allowSideDish) {
    reasons.push('side_dish');
  }

  if (request.audience === 'toddler') {
    if (metadata.toddlerSafetyReview?.reviewStatus !== 'approved') {
      reasons.push('toddler_not_approved');
    }
  }

  if (request.audience === 'baby') {
    if (!metadata.babyFood) reasons.push('missing_baby_food_metadata');
    if (metadata.babySafetyReview?.reviewStatus !== 'approved') {
      reasons.push('baby_not_approved');
    }
    if (metadata.safetySignals.honeyListed) reasons.push('honey_listed');
  }

  if (request.mealType && request.audience === 'baby' && request.mealType === 'late_night') {
    reasons.push('late_night');
  }

  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}

/**
 * Home / general feed still ignores familyAudience for feed switching
 * (elementary, kids_meal, baby). Do not use this flag to drop `general`.
 */
export function shouldIgnoreFamilyAudienceForHomeFeed(): true {
  return true;
}

/**
 * Toddler-approved and baby-approved recipes keep `general` in audiences but
 * must not enter the adult Home / Fridge Raid auto-discovery pool.
 * Direct route, recent, favorite, and dedicated child feeds are separate.
 */
export function isExcludedFromGeneralHomeFeed(metadata: RecipeFamilyAudienceMetadata): boolean {
  const toddlerApproved =
    metadata.audiences.includes('toddler') &&
    metadata.toddlerSafetyReview?.reviewStatus === 'approved';
  const babyApproved =
    metadata.audiences.includes('baby') &&
    metadata.babySafetyReview?.reviewStatus === 'approved';
  return toddlerApproved || babyApproved;
}
