import type { GoldMealRecord } from '../../types/goldMeal';
import { GOLD_MEALS_CHINESE } from '../gold-meals/chinese';

/**
 * Sprint 29 — Delivery Meal Library (MVP flagship set).
 * Source content lives in `library/gold-meals/chinese.ts` and `content/gold-meals/gold_c_*.md`.
 */
export const DELIVERY_MEALS_FLAGSHIP: GoldMealRecord[] = GOLD_MEALS_CHINESE.filter(
  (meal) => meal.mode === 'delivery',
);

const DELIVERY_MEALS_BY_ID = new Map(
  DELIVERY_MEALS_FLAGSHIP.map((meal) => [meal.id, meal]),
);

export function getDeliveryMealById(id: string): GoldMealRecord | undefined {
  return DELIVERY_MEALS_BY_ID.get(id);
}

export function isDeliveryMealId(id: string): boolean {
  return DELIVERY_MEALS_BY_ID.has(id);
}

export function listDeliveryMeals(): GoldMealRecord[] {
  return [...DELIVERY_MEALS_FLAGSHIP];
}
