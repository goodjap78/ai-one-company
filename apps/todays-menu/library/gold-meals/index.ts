import type { GoldMealRecord } from '../../types/goldMeal';
import { GOLD_MEALS_CHINESE } from './chinese';
import { GOLD_MEALS_JAPANESE } from './japanese';
import { GOLD_MEALS_KOREAN } from './korean';
import { GOLD_MEALS_WESTERN } from './western';

/** HANKKI Gold Meal Library v1.0 — 20 canonical meals. */
export const GOLD_MEAL_LIBRARY: GoldMealRecord[] = [
  ...GOLD_MEALS_KOREAN,
  ...GOLD_MEALS_WESTERN,
  ...GOLD_MEALS_JAPANESE,
  ...GOLD_MEALS_CHINESE,
];

const GOLD_MEALS_BY_ID = new Map(GOLD_MEAL_LIBRARY.map((meal) => [meal.id, meal]));

export function getGoldMealById(id: string): GoldMealRecord | undefined {
  return GOLD_MEALS_BY_ID.get(id);
}

export function listGoldMeals(): GoldMealRecord[] {
  return [...GOLD_MEAL_LIBRARY];
}

export function listGoldMealsByCuisine(
  cuisine: GoldMealRecord['cuisine'],
): GoldMealRecord[] {
  return GOLD_MEAL_LIBRARY.filter((meal) => meal.cuisine === cuisine);
}

export function listGoldMealsByStyle(
  mealStyle: GoldMealRecord['mealStyle'],
): GoldMealRecord[] {
  return GOLD_MEAL_LIBRARY.filter((meal) => meal.mealStyle === mealStyle);
}

export {
  getFlagshipGoldMealById,
  GOLD_MEALS_FLAGSHIP,
  isFlagshipGoldMeal,
} from './flagship';

export { GOLD_MEALS_CHINESE, GOLD_MEALS_JAPANESE, GOLD_MEALS_KOREAN, GOLD_MEALS_WESTERN };
