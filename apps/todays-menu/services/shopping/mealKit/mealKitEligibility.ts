import { MEAL_KIT_HIGH_ELIGIBILITY } from '../../../data/shopping/mealKitHighEligibility';
import {
  MEAL_KIT_VALIDATED_ELIGIBILITY,
  type MealKitValidatedEligibilityEntry,
} from '../../../data/shopping/mealKitValidatedEligibility';

const VALIDATED_BY_ID = new Map(
  MEAL_KIT_VALIDATED_ELIGIBILITY.map((entry) => [entry.recipeId, entry] as const),
);

const HIGH_CANDIDATE_IDS = new Set(MEAL_KIT_HIGH_ELIGIBILITY.map((entry) => entry.recipeId));

/** Pilot CTA — Audit HIGH AND runtime-valid product. MEDIUM never true. */
export function isMealKitEligible(recipeId: string | null | undefined): boolean {
  if (!recipeId) return false;
  return VALIDATED_BY_ID.has(recipeId);
}

export function getMealKitEligibility(
  recipeId: string | null | undefined,
): MealKitValidatedEligibilityEntry | null {
  if (!recipeId) return null;
  return VALIDATED_BY_ID.get(recipeId) ?? null;
}

export function getMealKitSearchKeyword(recipeId: string | null | undefined): string | null {
  return getMealKitEligibility(recipeId)?.searchKeyword ?? null;
}

export function listMealKitValidatedRecipeIds(): string[] {
  return MEAL_KIT_VALIDATED_ELIGIBILITY.map((entry) => entry.recipeId);
}

export function listMealKitHighRecipeIds(): string[] {
  return MEAL_KIT_HIGH_ELIGIBILITY.map((entry) => entry.recipeId);
}

export function isAuditHighCandidate(recipeId: string | null | undefined): boolean {
  if (!recipeId) return false;
  return HIGH_CANDIDATE_IDS.has(recipeId);
}
