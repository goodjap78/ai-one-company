import type {
  FoodMemoryAnalysis,
  FoodMemoryRecord,
  FoodMemoryTag,
} from '../../../types/foodMemory';

export const FOOD_MEMORY_ANALYSIS_WINDOW = 5;

function countBy<T extends string>(items: T[]): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}

function hasConsecutiveCategory(meals: FoodMemoryRecord[]): boolean {
  for (let i = 0; i < meals.length - 1; i += 1) {
    if (meals[i].category === meals[i + 1].category) return true;
  }
  return false;
}

/**
 * Sprint 39 — analyze accepted meals for repetition patterns only.
 * Health-balance tags (noodle-heavy, etc.) belong in extensions.healthBalance later.
 */
export function analyzeRecentMeals(
  meals: FoodMemoryRecord[],
  windowSize = FOOD_MEMORY_ANALYSIS_WINDOW,
): FoodMemoryAnalysis {
  const window = meals.slice(0, windowSize);
  const tags = new Set<FoodMemoryTag>();
  const categoryCounts = countBy(window.map((meal) => meal.category));
  const cuisineCounts = countBy(window.map((meal) => meal.cuisine));

  if (window.length === 0) {
    return { tags: [], categoryCounts, cuisineCounts };
  }

  const mealIdCounts = countBy(window.map((meal) => meal.mealId));
  if (Object.values(mealIdCounts).some((count) => (count ?? 0) >= 2)) {
    tags.add('recent_same_meal');
  }

  const recentCuisines = window.slice(0, 3).map((meal) => meal.cuisine);
  const cuisineInLastThree = countBy(recentCuisines);
  if (Object.values(cuisineInLastThree).some((count) => (count ?? 0) >= 2)) {
    tags.add('recent_same_cuisine');
  }

  if (hasConsecutiveCategory(window)) {
    tags.add('recent_same_category');
  }

  return { tags: [...tags], categoryCounts, cuisineCounts };
}
