import type { AddMealHistoryInput, MealHistoryEntry } from '../../types/mealHistory';
import { resolveMealFoodMeta } from './foodMemory';
import {
  clearHistory,
  getHistory,
  getRecentMealRecipeIds,
  getRecentMeals,
  getYesterdayMeals,
  RECENT_MEAL_WINDOW_DAYS,
  saveMeal,
} from '../MealHistoryService';

export {
  clearHistory,
  getHistory,
  getRecentMealRecipeIds,
  getRecentMeals,
  getYesterdayMeals,
  RECENT_MEAL_WINDOW_DAYS,
  saveMeal,
} from '../MealHistoryService';

/** @deprecated Use `getHistory` from MealHistoryService */
export async function getMealHistory(): Promise<MealHistoryEntry[]> {
  return getHistory();
}

export async function getLatestMeal(): Promise<MealHistoryEntry | null> {
  const entries = await getHistory();
  return entries[0] ?? null;
}

export async function getYesterdayMeal(): Promise<MealHistoryEntry | null> {
  const meals = await getYesterdayMeals();
  return meals[0] ?? null;
}

/** @deprecated Use `saveMeal` from MealHistoryService */
export async function addMealHistory(input: AddMealHistoryInput): Promise<MealHistoryEntry> {
  const meta = resolveMealFoodMeta(input.recipeId);
  const result = await saveMeal({
    recipeId: input.recipeId,
    recipeName: input.recipeName ?? meta.mealName,
    category: input.category ?? meta.category,
    mealType: input.mealType,
    createdAt: input.cookedDate ? `${input.cookedDate}T12:00:00.000Z` : undefined,
  });
  return result.entry;
}
