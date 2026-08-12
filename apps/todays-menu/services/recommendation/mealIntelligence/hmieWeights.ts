import type { MealScoreFactor } from '../../../types/mealIntelligenceEngine';

/** HMIE v1.0 — base score every meal starts from. */
export const HMIE_BASE_SCORE = 50;

/** Weighted multipliers per factor (bonuses/penalties scaled before sum). */
export const HMIE_FACTOR_WEIGHTS: Record<MealScoreFactor, number> = {
  weather: 1.0,
  temperature: 1.0,
  season: 0.85,
  timeOfDay: 0.9,
  weekdayWeekend: 0.95,
  mealTime: 1.0,
  preferenceDna: 1.1,
  recentMeals: 1.25,
  variety: 0.9,
  mealDna: 1.2,
};

export const HMIE_TOP_N = 3;
