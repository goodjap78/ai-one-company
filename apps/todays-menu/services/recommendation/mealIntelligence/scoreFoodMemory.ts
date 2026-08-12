import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { FoodMemorySnapshot } from '../../../types/foodMemory';
import { menuToFoodMemoryCategory, preferenceScoreToHmieDelta } from '../../memory/foodMemory';
import { menuCuisineFromId } from './mealProfile';
import {
  FOOD_MEMORY_SAME_CATEGORY_PENALTY,
  FOOD_MEMORY_SKIPPED_PENALTY,
  FOOD_MEMORY_VARIETY_BONUS,
  RECENT_SAME_CUISINE_PENALTY,
  RECENT_SAME_MEAL_PENALTY,
} from './mealScoreRules';

type FoodMemoryScore = {
  rawDelta: number;
  notes: string[];
};

const SKIPPED_LOOKBACK_MS = 48 * 60 * 60 * 1000;

function wasRecentlySkipped(mealId: string, snapshot: FoodMemorySnapshot): boolean {
  const cutoff = Date.now() - SKIPPED_LOOKBACK_MS;
  return snapshot.recentEvents.some(
    (event) =>
      event.mealId === mealId &&
      event.outcome === 'skipped' &&
      new Date(event.timestamp).getTime() >= cutoff,
  );
}

/**
 * Sprint 39 — Food Memory HMIE scoring (foundation only).
 * Penalties: same meal, same cuisine, same category, recently skipped.
 * Bonus: variety when category differs from last accepted meal.
 */
export function scoreFoodMemory(
  menu: MenuItem,
  context?: RecommendationContext,
): FoodMemoryScore {
  const snapshot = context?.foodMemory;
  if (!snapshot) return { rawDelta: 0, notes: [] };

  const notes: string[] = [];
  let rawDelta = 0;

  if (wasRecentlySkipped(menu.id, snapshot)) {
    rawDelta += FOOD_MEMORY_SKIPPED_PENALTY;
    notes.push('memory_skipped');
  }

  const foodMemoryPreference = snapshot.preferenceScores?.[menu.id];
  if (foodMemoryPreference) {
    const prefDelta = preferenceScoreToHmieDelta(foodMemoryPreference.score);
    if (prefDelta !== 0) {
      rawDelta += prefDelta;
      if (prefDelta > 0) notes.push('memory_preference_high');
      if (prefDelta < 0) notes.push('memory_preference_low');
    }
  }

  if (snapshot.meals.length === 0) {
    return { rawDelta, notes };
  }

  const window = snapshot.meals.slice(0, snapshot.analysisWindow);
  const menuCategory = menuToFoodMemoryCategory(menu);
  const menuCuisine = menuCuisineFromId(menu.id);
  const lastCategory = window[0]?.category;

  if (window.some((meal) => meal.mealId === menu.id)) {
    rawDelta += RECENT_SAME_MEAL_PENALTY;
    notes.push('recent_same_meal');
  }

  const recentCuisines = window.slice(0, 3).map((meal) => meal.cuisine);
  if (
    menuCuisine !== 'catalog' &&
    recentCuisines.includes(menuCuisine as (typeof recentCuisines)[number])
  ) {
    rawDelta += RECENT_SAME_CUISINE_PENALTY;
    notes.push('recent_same_cuisine');
  }

  if (
    lastCategory &&
    lastCategory === menuCategory &&
    snapshot.analysis.tags.includes('recent_same_category')
  ) {
    rawDelta += FOOD_MEMORY_SAME_CATEGORY_PENALTY;
    notes.push('memory_category_repeat');
  }

  if (lastCategory && menuCategory !== lastCategory) {
    rawDelta += FOOD_MEMORY_VARIETY_BONUS;
    notes.push('memory_variety');
  }

  return { rawDelta, notes };
}
