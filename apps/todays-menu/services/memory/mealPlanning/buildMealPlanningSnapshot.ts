import type { MealPlanningSnapshot, MealPlanningStore } from '../../../types/mealPlanning';
import { analyzeSavedMeals } from './analyzeSavedMeals';
import { getActivePlanningEntries } from './mealPlanningStorage';
import { todayKey } from './mealPlanningDates';

export function buildMealPlanningSnapshotFromStore(
  store: MealPlanningStore,
  now = new Date(),
): MealPlanningSnapshot {
  const entries = getActivePlanningEntries(store, now);
  const analysis = analyzeSavedMeals(entries);

  return {
    version: 4,
    today: todayKey(now),
    entries,
    analysis,
    extensions: store.extensions,
  };
}

export async function buildMealPlanningSnapshot(
  store: MealPlanningStore,
  now = new Date(),
): Promise<MealPlanningSnapshot> {
  return buildMealPlanningSnapshotFromStore(store, now);
}
