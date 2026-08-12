/**
 * Sprint 57 — Date + slot recommendation cache key design (not wired to production).
 */
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';

export type MealTimeCacheKey = `${string}:${MealTimeSlotKey}`;

export type MealTimeRecommendationSet = {
  recipeIds: string[];
  generatedAt: string;
  slot: MealTimeSlotKey;
  dateKey: string;
  refreshGeneration: number;
};

export const MEAL_TIME_CACHE_NAMESPACE = '@hankki/meal_time_recommendation';

/**
 * Cache key: local calendar date + explicit slot (not clock band).
 * Same date + same slot → stable recommendation set until manual refresh.
 */
export function buildMealTimeCacheKey(dateKey: string, slot: MealTimeSlotKey): MealTimeCacheKey {
  return `${dateKey}:${slot}`;
}

export function parseMealTimeCacheKey(key: MealTimeCacheKey): { dateKey: string; slot: MealTimeSlotKey } {
  const [dateKey, slot] = key.split(':') as [string, MealTimeSlotKey];
  return { dateKey, slot };
}

export type MealTimeCachePolicy = {
  /** Same local date + slot → keep set */
  stableWithinSlot: true;
  /** Slot change on same day → new pool / new set */
  refreshOnSlotChange: true;
  /** Midnight rollover → new date key → new sets */
  refreshOnDateChange: true;
  /** "다른 메뉴 보기" increments generation within same date+slot */
  manualRefreshIncrementsGeneration: true;
};

export const MEAL_TIME_CACHE_POLICY: MealTimeCachePolicy = {
  stableWithinSlot: true,
  refreshOnSlotChange: true,
  refreshOnDateChange: true,
  manualRefreshIncrementsGeneration: true,
};

export function nextRefreshGeneration(current: number): number {
  return current + 1;
}
