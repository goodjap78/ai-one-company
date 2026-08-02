import type { Recipe } from '../../data/recipes/types';
import type { MealTimeSlot } from '../../types/mealTime';
import type { MenuItem } from '../../types/recommendation';

const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  간식: 'LATE_NIGHT',
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'LATE_NIGHT',
  late_night: 'LATE_NIGHT',
};

/**
 * Minimal Recipe → MenuItem adapter for AI exclusion checks only.
 * Keeps fridge scoring independent of gold-meal catalog / image registries.
 */
export function recipeToFridgeMenuItem(recipe: Recipe): MenuItem {
  const mealTime = [
    ...new Set(
      recipe.mealType
        .map((label) => MEAL_TYPE_KO_TO_SLOT[label])
        .filter((slot): slot is MealTimeSlot => Boolean(slot)),
    ),
  ];

  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: recipe.time <= 15 ? 'instant' : 'recipe',
    title: recipe.name,
    subtitle: recipe.situation[0] ?? recipe.name,
    mealTime: mealTime.length > 0 ? mealTime : ['DINNER'],
    cookTime: recipe.time,
    difficulty:
      recipe.difficulty === '쉬움' ? 'easy' : recipe.difficulty === '어려움' ? 'hard' : 'normal',
    aiReason: recipe.situation[0] ?? recipe.name,
    tags: [],
    badges: [],
  };
}
