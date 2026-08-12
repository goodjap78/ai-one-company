/**
 * Sprint 57 — Meal-time recommendation foundation types.
 * Parallel to runtime `MealTimeSlot` (BREAKFAST/LUNCH/…) in `types/mealTime.ts`.
 */

export const MEAL_TIME_SLOT_KEYS = [
  'breakfast',
  'lunch',
  'dinner',
  'lateNight',
] as const;

/** Canonical slot key for meal-time fit scoring (0–1 per slot). */
export type MealTimeSlotKey = (typeof MEAL_TIME_SLOT_KEYS)[number];

export const MEAL_TIME_SLOT_LABELS: Record<MealTimeSlotKey, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  lateNight: '야식',
};

/** Per-slot suitability scores — not boolean flags. */
export type MealTimeFit = {
  breakfast: number;
  lunch: number;
  dinner: number;
  lateNight: number;
};

export type MealTimeFitBand = 'excellent' | 'good' | 'possible' | 'low' | 'excluded';

export function mealTimeFitBand(score: number): MealTimeFitBand {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.7) return 'good';
  if (score >= 0.4) return 'possible';
  if (score >= 0.1) return 'low';
  return 'excluded';
}

export type MealTimeFitReasons = Record<MealTimeSlotKey, string[]>;

export type MealTimeFitResult = {
  recipeId: string;
  title: string;
  fit: MealTimeFit;
  primaryMealTime: MealTimeSlotKey;
  reasons: MealTimeFitReasons;
  mainCategory: string;
  cookTime: number;
  difficulty: string;
  foodTypes: string[];
};
