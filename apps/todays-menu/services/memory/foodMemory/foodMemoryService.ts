import type {
  FoodMemoryEvent,
  FoodMemoryRecord,
  FoodMemorySnapshot,
  RecordFoodMemoryInput,
} from '../../../types/foodMemory';
import { buildFoodMemorySnapshot } from './buildFoodMemorySnapshot';
import {
  getFoodMemoryEvents,
  getFoodMemoryRecords,
  saveFoodMemoryEvent,
  saveFoodMemoryRecord,
} from './foodMemoryStorage';

export { buildFoodMemorySnapshot } from './buildFoodMemorySnapshot';
export { analyzeRecentMeals, FOOD_MEMORY_ANALYSIS_WINDOW } from './analyzeRecentMeals';
export {
  FOOD_MEMORY_MAX_ACCEPTED,
  FOOD_MEMORY_MAX_EVENTS,
  FOOD_MEMORY_STORAGE_KEY,
  getFoodMemoryEvents,
  getFoodMemoryRecords,
  readFoodMemoryStore,
  saveFoodMemoryEvent,
  saveFoodMemoryRecord,
} from './foodMemoryStorage';
export { menuToFoodMemoryCategory, resolveMealFoodMeta } from './resolveMealFoodMeta';
export { preferenceScoreToHmieDelta } from './preferenceScores';

/** Record accepted or skipped meal interaction (separate from recommendation session history). */
export async function recordFoodMemoryEvent(input: RecordFoodMemoryInput): Promise<FoodMemoryEvent> {
  return saveFoodMemoryEvent(input);
}

/** @deprecated Use recordFoodMemoryEvent({ outcome: 'accepted' }). */
export async function recordFoodMeal(input: { mealId: string }): Promise<FoodMemoryRecord> {
  return saveFoodMemoryRecord(input);
}

export async function getFoodMemory(): Promise<FoodMemorySnapshot> {
  return buildFoodMemorySnapshot();
}
