import type {
  MealPlanningCompleteInput,
  MealPlanningEntry,
  MealPlanningRecommendInput,
  MealPlanningSaveInput,
  MealPlanningSnapshot,
} from '../../../types/mealPlanning';
import { buildMealPlanningSnapshotFromStore } from './buildMealPlanningSnapshot';
import {
  archiveMealPlanningEntry,
  completeMealPlanningEntry,
  MEAL_PLANNING_STORAGE_KEY,
  readMealPlanningStore,
  upsertSavedMeal,
  upsertRecommendedMeal,
} from './mealPlanningStorage';

export { MEAL_PLANNING_STORAGE_KEY } from './mealPlanningStorage';
export { buildMealPlanningSnapshot } from './buildMealPlanningSnapshot';

export async function getMealPlanning(): Promise<MealPlanningSnapshot> {
  const store = await readMealPlanningStore();
  return buildMealPlanningSnapshotFromStore(store);
}

export async function recordRecommendedMeal(
  input: MealPlanningRecommendInput,
): Promise<MealPlanningEntry> {
  const store = await upsertRecommendedMeal(input);
  const snapshot = buildMealPlanningSnapshotFromStore(store);
  return (
    snapshot.entries.find(
      (item) => item.mealType === input.mealType && item.status === 'recommended',
    ) ?? snapshot.entries[0]
  );
}

export async function saveMeal(input: MealPlanningSaveInput): Promise<MealPlanningEntry> {
  const store = await upsertSavedMeal(input);
  const snapshot = buildMealPlanningSnapshotFromStore(store);
  const entry = snapshot.entries.find(
    (item) => item.recipeId === input.recipeId && item.status === 'saved',
  );
  if (!entry) throw new Error('Failed to save meal');
  return entry;
}

export async function finishPlannedMeal(
  input: MealPlanningCompleteInput,
): Promise<MealPlanningEntry | null> {
  await completeMealPlanningEntry(input);
  const store = await archiveMealPlanningEntry(input);
  return (
    store.entries.find(
      (item) =>
        item.recipeId === input.recipeId &&
        item.mealType === input.mealType &&
        item.status === 'archived',
    ) ?? null
  );
}
