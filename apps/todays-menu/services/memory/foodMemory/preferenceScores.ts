import type { FoodMemoryOutcome } from '../../../types/foodMemory';

/** Sprint 39 — accepted/skipped only. Liked/disliked reserved for future. */
export const FOOD_PREFERENCE_DELTAS: Record<FoodMemoryOutcome, number> = {
  accepted: 15,
  skipped: -8,
};

export const FOOD_PREFERENCE_SCORE_MIN = -100;
export const FOOD_PREFERENCE_SCORE_MAX = 100;

function clampScore(score: number): number {
  return Math.min(FOOD_PREFERENCE_SCORE_MAX, Math.max(FOOD_PREFERENCE_SCORE_MIN, score));
}

export function createPreferenceScore(
  mealId: string,
  mealName: string,
): import('../../../types/foodMemory').FoodPreferenceScore {
  return {
    mealId,
    mealName,
    score: 0,
    accepted: 0,
    skipped: 0,
    liked: 0,
    disliked: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Reserved — preference scores stored but not used in Sprint 39 HMIE. */
export function applyPreferenceDelta(
  current: import('../../../types/foodMemory').FoodPreferenceScore,
  outcome: FoodMemoryOutcome,
  mealName: string,
): import('../../../types/foodMemory').FoodPreferenceScore {
  const next = { ...current, mealName, updatedAt: new Date().toISOString() };

  if (outcome === 'accepted') next.accepted += 1;
  if (outcome === 'skipped') next.skipped += 1;

  next.score = clampScore(next.score + FOOD_PREFERENCE_DELTAS[outcome]);
  return next;
}

/** Map a stored preference score to an HMIE bonus/penalty band. */
export function preferenceScoreToHmieDelta(score: number): number {
  if (score >= 40) return 18;
  if (score >= 20) return 12;
  if (score >= 8) return 6;
  if (score <= -40) return -50;
  if (score <= -20) return -30;
  if (score <= -8) return -15;
  return 0;
}
