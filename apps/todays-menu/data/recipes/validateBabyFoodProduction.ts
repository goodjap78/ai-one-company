/**
 * Production rules for baby-approved complementary-food recipes.
 * Does not invent nutrition cutoffs. Authored baby recipes must pass these checks.
 */
import type { Recipe } from './types';
import type { BabySafetyReview } from './recipeFamilyAudienceTypes';
import { BABY_FOOD_STAGES, BABY_FOOD_TEXTURES } from './recipeFamilyAudienceTypes';
import {
  BABY_CHOKING_CAUTION_CODES,
  BABY_COOKING_SAFETY_FLAGS,
  BABY_REVIEW_STATUSES,
  isOfficialBabyMonthRangeForStage,
} from './babyFoodPolicyTypes';

export type BabyProductionIssue = {
  recipeId: string;
  recipeName: string;
  code: string;
  message: string;
};

function isUnder12MonthsStage(stage: BabySafetyReview['stage']): boolean {
  return stage === 'early' || stage === 'middle' || stage === 'late';
}

export function babySafetyReviewBlocksApproval(review: BabySafetyReview): string[] {
  const reasons: string[] = [];
  if (review.reviewStatus === 'unreviewed') {
    reasons.push('authored_review_must_not_stay_unreviewed');
  }
  if (review.honeyListed && isUnder12MonthsStage(review.stage)) {
    reasons.push('honey_listed_under_12_months');
  }
  if (review.chokingCautions.length > 0) {
    reasons.push('unresolved_choking_cautions');
  }
  if (!review.texture) {
    reasons.push('missing_texture');
  }
  if (!isOfficialBabyMonthRangeForStage(review.stage, review.monthRange)) {
    reasons.push('month_range_not_official_for_stage');
  }
  return reasons;
}

export function validateBabyApprovedRecipe(recipe: Recipe): BabyProductionIssue[] {
  const issues: BabyProductionIssue[] = [];
  const meta = recipe.familyAudience;
  if (!meta?.audiences.includes('baby')) return issues;

  const push = (code: string, message: string) => {
    issues.push({ recipeId: recipe.id, recipeName: recipe.name, code, message });
  };

  if (meta.reviewStatus !== 'explicit') {
    push('baby.reviewStatus', 'baby audience requires explicit reviewStatus');
  }
  if (!meta.babyFood) {
    push('babyFood', 'baby audience requires babyFood metadata');
    return issues;
  }
  if (!meta.babySafetyReview) {
    push('babySafetyReview', 'baby audience requires an authored babySafetyReview');
    return issues;
  }

  const review = meta.babySafetyReview;
  if (!(BABY_REVIEW_STATUSES as readonly string[]).includes(review.reviewStatus)) {
    push('babySafetyReview.reviewStatus', `invalid status: ${review.reviewStatus}`);
  }
  if (review.reviewStatus === 'approved' && !meta.audiences.includes('baby')) {
    push('babySafetyReview', 'approved baby review requires baby audience');
  }
  if (review.reviewStatus !== 'approved') {
    push('babySafetyReview', 'baby audience requires approved babySafetyReview');
  }
  if (review.reviewStatus === 'unreviewed') {
    push('babySafetyReview', 'authored review must not stay unreviewed');
  }

  if (!(BABY_FOOD_STAGES as readonly string[]).includes(review.stage)) {
    push('babySafetyReview.stage', `invalid stage: ${review.stage}`);
  }
  if (meta.babyFood.stage !== review.stage) {
    push('babySafetyReview.stage', 'babyFood.stage must match babySafetyReview.stage');
  }
  if (!isOfficialBabyMonthRangeForStage(review.stage, review.monthRange)) {
    push('babySafetyReview.monthRange', 'monthRange must match official stage bound');
  }
  if (!(BABY_FOOD_TEXTURES as readonly string[]).includes(review.texture)) {
    push('babySafetyReview.texture', `invalid texture: ${review.texture}`);
  }
  if (!meta.babyFood.texture) {
    push('babyFood.texture', 'approved baby recipe requires texture');
  } else if (meta.babyFood.texture !== review.texture) {
    push('babySafetyReview.texture', 'babyFood.texture must match babySafetyReview.texture');
  }

  for (const code of review.chokingCautions) {
    if (!(BABY_CHOKING_CAUTION_CODES as readonly string[]).includes(code)) {
      push('babySafetyReview.chokingCautions', `unknown choking code: ${code}`);
    }
  }
  for (const flag of review.cookingSafetyFlags) {
    if (!(BABY_COOKING_SAFETY_FLAGS as readonly string[]).includes(flag)) {
      push('babySafetyReview.cookingSafetyFlags', `unknown cooking flag: ${flag}`);
    }
  }

  if (review.reviewStatus === 'approved') {
    for (const reason of babySafetyReviewBlocksApproval(review)) {
      push('babySafetyReview.approved', `cannot approve: ${reason}`);
    }
    if (meta.safetySignals.honeyListed && isUnder12MonthsStage(review.stage)) {
      push('babySafetyReview.approved', 'cannot approve: honeyListed under 12 months');
    }
  }

  if (!recipe.ingredients?.length) {
    push('baby.ingredients', 'baby recipe requires ingredients');
  }
  if (!recipe.recipe?.steps?.length) {
    push('baby.steps', 'baby recipe requires steps');
  }

  return issues;
}
