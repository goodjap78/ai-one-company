/**
 * Sprint 57 — Manual meal-time fit overrides (minimal).
 * Use only when deterministic rules cannot express author intent.
 */
import type { MealTimeFit } from '../../types/mealTimeRecommendation';

export type MealTimeOverride = Partial<MealTimeFit> & {
  reason: string;
};

/**
 * Sparse overrides — empty by design for Sprint 57 baseline.
 * Add entries only when deriveMealTimeFit needs correction.
 */
export const MEAL_TIME_OVERRIDES: Record<string, MealTimeOverride> = {
  // Example (disabled):
  // '042': { breakfast: 0.85, reason: 'author_intent:아침 전용 메뉴' },
};
