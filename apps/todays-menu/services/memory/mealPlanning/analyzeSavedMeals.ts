import type {
  MealPlanningAnalysis,
  MealPlanningEntry,
  MealPlanningStatus,
  MealPlanningTag,
} from '../../../types/mealPlanning';

const SAVED_STATUSES: MealPlanningStatus[] = ['saved'];

export function analyzeSavedMeals(entries: MealPlanningEntry[]): MealPlanningAnalysis {
  const savedEntries = entries.filter((entry) => SAVED_STATUSES.includes(entry.status));
  const savedMealIds = savedEntries.map((entry) => entry.recipeId);
  const savedCuisines = savedEntries.map((entry) => entry.cuisine);
  const savedCookingStyles = savedEntries.map((entry) => entry.cookingStyle);
  const tags = new Set<MealPlanningTag>();

  const mealCounts = countBy(savedMealIds);
  if (Object.values(mealCounts).some((count) => (count ?? 0) >= 2)) {
    tags.add('saved_same_meal');
  }

  const cuisineCounts = countBy(savedCuisines);
  if (Object.values(cuisineCounts).some((count) => (count ?? 0) >= 2)) {
    tags.add('saved_same_cuisine');
  }

  const styleCounts = countBy(savedCookingStyles);
  if (Object.values(styleCounts).some((count) => (count ?? 0) >= 2)) {
    tags.add('saved_same_cooking_style');
  }

  return {
    tags: [...tags],
    savedMealIds,
    savedCuisines,
    savedCookingStyles,
    recommendedCount: entries.filter((entry) => entry.status === 'recommended').length,
    savedCount: savedEntries.length,
    completedCount: entries.filter((entry) => entry.status === 'completed').length,
    archivedCount: entries.filter((entry) => entry.status === 'archived').length,
  };
}

function countBy<T extends string>(items: T[]): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}
