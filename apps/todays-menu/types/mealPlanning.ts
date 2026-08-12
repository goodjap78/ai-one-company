import type { MealMode, MealType } from './home';
import type { FoodMemoryCategory, FoodMemoryCuisine } from './foodMemory';

/**
 * Sprint 42 — internal Meal Planning Engine.
 * Users only see Eat Now / Save; horizons are not exposed.
 */

/** Recommended → Saved → Completed → Archived */
export type MealPlanningStatus =
  | 'recommended'
  | 'saved'
  | 'completed'
  | 'archived';

export type MealPlanningRecommendInput = {
  recipeId: string;
  mealType: MealType;
  mealMode: MealMode;
  recommendationId?: string;
};

export type MealPlanningSaveInput = {
  recipeId: string;
  mealType: MealType;
  mealMode: MealMode;
  recommendationId?: string;
};

export type MealPlanningCompleteInput = {
  recipeId: string;
  mealType: MealType;
};

export type MealPlanningEntry = {
  id: string;
  recipeId: string;
  mealType: MealType;
  mealMode: MealMode;
  status: MealPlanningStatus;
  category: FoodMemoryCategory;
  cuisine: FoodMemoryCuisine;
  cookingStyle: string;
  recommendedAt: string;
  savedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  recommendationId?: string;
};

export type MealPlanningTag =
  | 'saved_same_meal'
  | 'saved_same_cuisine'
  | 'saved_same_cooking_style';

export type MealPlanningAnalysis = {
  tags: MealPlanningTag[];
  /** Saved meals influence HMIE — reduces repeated recommendations. */
  savedMealIds: string[];
  savedCuisines: FoodMemoryCuisine[];
  savedCookingStyles: string[];
  recommendedCount: number;
  savedCount: number;
  completedCount: number;
  archivedCount: number;
};

/** Future: calendar UI and shopping adapters (not in Sprint 42 scope). */
export type MealPlanningExtensions = {
  calendar?: Record<string, unknown>;
  shopping?: Record<string, unknown>;
  grocery?: Record<string, unknown>;
};

export type MealPlanningStore = {
  version: 4;
  entries: MealPlanningEntry[];
  extensions: MealPlanningExtensions;
  updatedAt: string;
};

export type MealPlanningSnapshot = {
  version: 4;
  today: string;
  entries: MealPlanningEntry[];
  analysis: MealPlanningAnalysis;
  extensions: MealPlanningExtensions;
};
