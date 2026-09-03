/**
 * Structural checks only. Does not encode medical or nutrition cutoffs.
 */
import type { Recipe } from './types';
import {
  BABY_FOOD_MONTH_RANGE_BOUNDS,
  BABY_FOOD_STAGES,
  BABY_FOOD_TEXTURES,
  RECIPE_AUDIENCES,
} from './recipeFamilyAudienceTypes';
import { isOfficialBabyMonthRangeForStage } from './babyFoodPolicyTypes';
import { TODDLER_REVIEW_STATUSES } from './toddlerSafetyPolicyTypes';
import { validateBabyApprovedRecipe } from './validateBabyFoodProduction';

export type FamilyAudienceIssue = {
  recipeId: string;
  recipeName: string;
  code: string;
  message: string;
};

export function validateRecipeFamilyAudience(recipe: Recipe): FamilyAudienceIssue[] {
  const issues: FamilyAudienceIssue[] = [];
  const meta = recipe.familyAudience;
  const push = (code: string, message: string) => {
    issues.push({ recipeId: recipe.id, recipeName: recipe.name, code, message });
  };

  if (!meta) {
    push('missing', 'familyAudience is required on production recipes');
    return issues;
  }

  if (!meta.audiences.length) {
    push('audiences', 'audiences must not be empty');
  }
  for (const audience of meta.audiences) {
    if (!(RECIPE_AUDIENCES as readonly string[]).includes(audience)) {
      push('audiences', `unknown audience: ${audience}`);
    }
  }

  if (meta.audiences.includes('baby')) {
    if (!meta.babyFood) {
      push('babyFood', 'baby audience requires babyFood metadata');
    } else {
      if (!(BABY_FOOD_STAGES as readonly string[]).includes(meta.babyFood.stage)) {
        push('babyFood.stage', `invalid stage: ${meta.babyFood.stage}`);
      }
      const range = meta.babyFood.monthRange;
      if (!range || !(BABY_FOOD_MONTH_RANGE_BOUNDS as readonly string[]).includes(range.bound)) {
        push('babyFood.monthRange', 'monthRange.bound is required');
      } else if (!isOfficialBabyMonthRangeForStage(meta.babyFood.stage, range)) {
        push('babyFood.monthRange', 'monthRange must match official stage bound');
      }
      if (
        meta.babyFood.texture !== null &&
        !(BABY_FOOD_TEXTURES as readonly string[]).includes(meta.babyFood.texture)
      ) {
        push('babyFood.texture', `invalid texture: ${meta.babyFood.texture}`);
      }
    }
  } else if (meta.babyFood) {
    push('babyFood', 'babyFood should be null unless audience includes baby');
  }

  if (meta.audiences.includes('toddler') || meta.audiences.includes('elementary')) {
    if (!meta.childMeal) {
      push('childMeal', 'toddler/elementary audience requires childMeal metadata');
    }
  }

  const toddlerReview = meta.toddlerSafetyReview;
  if (toddlerReview) {
    if (!(TODDLER_REVIEW_STATUSES as readonly string[]).includes(toddlerReview.reviewStatus)) {
      push('toddlerSafetyReview.reviewStatus', `invalid status: ${toddlerReview.reviewStatus}`);
    }
    if (toddlerReview.reviewStatus === 'approved' && !meta.audiences.includes('toddler')) {
      push('toddlerSafetyReview', 'approved toddler review requires toddler audience');
    }
    if (toddlerReview.reviewStatus !== 'approved' && meta.audiences.includes('toddler')) {
      push('toddlerSafetyReview', 'toddler audience requires approved toddlerSafetyReview');
    }
    if (toddlerReview.reviewStatus === 'unreviewed') {
      push('toddlerSafetyReview', 'authored review must not stay unreviewed');
    }
  } else if (meta.audiences.includes('toddler')) {
    push('toddlerSafetyReview', 'toddler audience requires an authored toddlerSafetyReview');
  }

  if (meta.babySafetyReview && !meta.audiences.includes('baby')) {
    push('babySafetyReview', 'babySafetyReview requires baby audience');
  }

  return [...issues, ...validateBabyApprovedRecipe(recipe)];
}

export function validateAllRecipeFamilyAudience(recipes: Recipe[]): FamilyAudienceIssue[] {
  return recipes.flatMap(validateRecipeFamilyAudience);
}
