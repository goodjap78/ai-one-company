/**
 * Sprint 57 / 61-B — Diversity / repeat-penalty policy (wired via smartRecommendationScore).
 */
export type MealTimeDiversityContext = {
  /** Recently shown recipe IDs in current slot session */
  currentSlotShownIds: string[];
  /** Same calendar day — any slot */
  sameDayShownIds: string[];
  /** Previous calendar day primary picks */
  previousDayPrimaryIds: string[];
  /** Global recent history (e.g. meal history service) */
  recentHistoryIds: string[];
};

export type MealTimeDiversityWeights = {
  currentSlotRepeat: number;
  sameDayRepeat: number;
  previousDayPrimary: number;
  recentHistory: number;
};

export const MEAL_TIME_DIVERSITY_WEIGHTS: MealTimeDiversityWeights = {
  currentSlotRepeat: 0.35,
  sameDayRepeat: 0.2,
  previousDayPrimary: 0.15,
  recentHistory: 0.1,
};

/**
 * Penalty subtracted from blended score (0–1 clamp after apply).
 * Recent 1–3 exposures use stepped penalties.
 */
export function mealTimeRepeatPenalty(
  recipeId: string,
  ctx: MealTimeDiversityContext,
  weights = MEAL_TIME_DIVERSITY_WEIGHTS,
): number {
  let penalty = 0;

  const slotHits = ctx.currentSlotShownIds.filter((id) => id === recipeId).length;
  if (slotHits >= 1) penalty += weights.currentSlotRepeat * Math.min(slotHits, 3);
  if (ctx.sameDayShownIds.includes(recipeId)) penalty += weights.sameDayRepeat;
  if (ctx.previousDayPrimaryIds.includes(recipeId)) penalty += weights.previousDayPrimary;
  if (ctx.recentHistoryIds.includes(recipeId)) penalty += weights.recentHistory;

  return Math.min(0.85, penalty);
}

export function applyMealTimeDiversityScore(baseScore: number, penalty: number): number {
  return Math.max(0, Math.min(1, baseScore - penalty));
}
