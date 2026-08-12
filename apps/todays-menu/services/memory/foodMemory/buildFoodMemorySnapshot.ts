import type { FoodMemoryEvent, FoodMemorySnapshot } from '../../../types/foodMemory';
import { analyzeRecentMeals, FOOD_MEMORY_ANALYSIS_WINDOW } from './analyzeRecentMeals';
import {
  acceptedMealsFromEvents,
  FOOD_MEMORY_MAX_ACCEPTED,
  readFoodMemoryStore,
} from './foodMemoryStorage';

const RECENT_EVENT_WINDOW = 30;

function skippedMealIds(events: FoodMemoryEvent[]): string[] {
  return [...new Set(events.filter((event) => event.outcome === 'skipped').map((event) => event.mealId))];
}

/** Build the unified Food Memory read model for HMIE. */
export async function buildFoodMemorySnapshot(): Promise<FoodMemorySnapshot> {
  const store = await readFoodMemoryStore();
  const acceptedEvents = store.events.filter((event) => event.outcome === 'accepted');
  const meals = acceptedMealsFromEvents(store.events);
  const recentEvents = store.events.slice(0, RECENT_EVENT_WINDOW);
  const analysis = analyzeRecentMeals(meals, FOOD_MEMORY_ANALYSIS_WINDOW);

  return {
    version: 2,
    meals,
    recentEvents,
    analysis,
    skippedMealIds: skippedMealIds(store.events),
    analysisWindow: FOOD_MEMORY_ANALYSIS_WINDOW,
    extensions: store.extensions,
    preferenceScores: store.preferenceScores,
  };
}

export { FOOD_MEMORY_MAX_ACCEPTED };
