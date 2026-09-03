import type { Recipe } from '../../data/recipes/types';
import { validateRecipeFamilyAudience } from '../../data/recipes/validateRecipeFamilyAudience';
import { isExcludedFromGeneralHomeByRecipeId } from '../../data/recipes/generalHomeFeedExclusion';
import { isExcludedFromGeneralHomeFeed } from '../../data/recipes/recipeFamilyAudiencePolicy';

export type AudienceSafetyResult = {
  babyChecked: number;
  toddlerChecked: number;
  elementaryChecked: number;
  blockers: string[];
  warnings: string[];
};

function isBabyApproved(recipe: Recipe): boolean {
  const meta = recipe.familyAudience;
  return (
    meta.audiences.includes('baby') &&
    meta.babySafetyReview?.reviewStatus === 'approved'
  );
}

function isToddlerApproved(recipe: Recipe): boolean {
  const meta = recipe.familyAudience;
  return (
    meta.audiences.includes('toddler') &&
    meta.toddlerSafetyReview?.reviewStatus === 'approved'
  );
}

export function runAudienceSafety(recipes: Recipe[]): AudienceSafetyResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  let babyChecked = 0;
  let toddlerChecked = 0;
  let elementaryChecked = 0;

  for (const recipe of recipes) {
    const audiences = recipe.familyAudience.audiences;
    if (audiences.includes('baby')) babyChecked += 1;
    if (audiences.includes('toddler')) toddlerChecked += 1;
    if (audiences.includes('elementary')) elementaryChecked += 1;

    const issues = validateRecipeFamilyAudience(recipe);
    for (const issue of issues) {
      blockers.push(`[${issue.recipeId}] ${issue.code}: ${issue.message}`);
    }

    if (audiences.includes('elementary') && recipe.familyAudience.reviewStatus !== 'explicit') {
      blockers.push(
        `[${recipe.id}] elementary.reviewStatus: elementary audience requires explicit reviewStatus`,
      );
    }
  }

  return { babyChecked, toddlerChecked, elementaryChecked, blockers, warnings };
}

export function runAutoDiscoveryPolicy(recipes: Recipe[]): string[] {
  const blockers: string[] = [];

  for (const recipe of recipes) {
    const meta = recipe.familyAudience;
    const babyApproved = isBabyApproved(recipe);
    const toddlerApproved = isToddlerApproved(recipe);

    if (!babyApproved && !toddlerApproved) continue;

    if (!isExcludedFromGeneralHomeFeed(meta)) {
      blockers.push(
        `[${recipe.id}] auto-discovery: baby/toddler approved must be excluded from general Home/Fridge auto pool`,
      );
    }
    if (!isExcludedFromGeneralHomeByRecipeId(recipe.id)) {
      blockers.push(
        `[${recipe.id}] auto-discovery: recipe id missing from general home exclusion set`,
      );
    }
  }

  return blockers;
}
