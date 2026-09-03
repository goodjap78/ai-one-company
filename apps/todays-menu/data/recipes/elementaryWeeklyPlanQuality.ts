/**
 * Sprint 7 — soft quality boost for elementary weekly plan candidate scoring.
 * Does not hard-filter pools; diversity + hard rules remain primary gates.
 */
import { hashWeeklyPlanSeed } from './elementaryWeeklyPlanCommon';
import type { Recipe } from './types';

/** Sprint 6.2 verified core set — used for QA metrics only, not pool filtering. */
export function isWeeklyPlanQualityGradeA(recipe: Recipe): boolean {
  return recipe.elementaryQuality?.recipeQualityGrade === 'A';
}

export function isWeeklyPlanReviewed(recipe: Recipe): boolean {
  const status = recipe.elementaryQuality?.contentVerificationStatus;
  return status === 'reviewed' || status === 'verified';
}

/**
 * Soft ranking boost applied inside existing scoreCandidate().
 * Order of precedence in scoring: grade A > reviewed > recommendationPriority tail.
 * Kept modest so diversity + hard rules can still win slots.
 */
export function weeklyPlanQualityScoreBoost(recipe: Recipe): number {
  let boost = 0;
  if (isWeeklyPlanQualityGradeA(recipe)) {
    boost += 6;
  } else if (isWeeklyPlanReviewed(recipe)) {
    boost += 3;
  }

  const priority = recipe.recommendationPriority ?? 75;
  boost += Math.max(-2, Math.min(4, Math.floor((priority - 75) / 5)));

  return boost;
}

/** Deterministic per-seed tie spread so different seeds explore different valid weeks. */
export function weeklyPlanSeedSelectionJitter(
  planSeed: string,
  slotIndex: number,
  recipeId: string,
): number {
  const h = hashWeeklyPlanSeed(`${planSeed}:slot${slotIndex}:${recipeId}`);
  return (h % 7) - 3;
}

/** Discourage A-only weeks while keeping A recipes preferred early in the week. */
export function weeklyPlanQualityWeekPenalty(
  chosenRecipes: readonly Recipe[],
  candidate: Recipe,
): number {
  if (!isWeeklyPlanQualityGradeA(candidate)) return 0;
  const aCount = chosenRecipes.filter((recipe) => isWeeklyPlanQualityGradeA(recipe)).length;
  if (aCount >= 5) return -12;
  if (aCount >= 4) return -6;
  if (aCount >= 3) return -2;
  return 0;
}

/** Weekday school-morning emphasis (MON–FRI). false/null get no boost. */
export function weeklyPlanSchoolMorningScoreBoost(
  day: import('./recipeFamilyAudienceTypes').WeeklyPlanDay,
  schoolMorningFriendly: boolean | null,
): number {
  if (schoolMorningFriendly !== true) return 0;
  if (day === 'SAT' || day === 'SUN') return 0;
  return 5;
}
