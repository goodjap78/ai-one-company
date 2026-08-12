import type { FoodMemoryCategory } from './foodMemory';
import type { MealType } from './home';

export type MealSatisfaction = 'loved' | 'good' | 'okay' | 'disliked';

/**
 * Short-term meal memory — what the user selected and ate.
 */
export type MealHistoryEntry = {
  id: string;
  recipeId: string;
  recipeName?: string;
  category?: FoodMemoryCategory;
  cookedDate: string;
  mealType: MealType;
  satisfaction: MealSatisfaction | null;
  cookingTime: number;
  createdAt: string;
};

export type SaveMealInput = {
  recipeId: string;
  recipeName: string;
  category: FoodMemoryCategory;
  mealType: MealType;
  createdAt?: string;
};

/** @deprecated Use `SaveMealInput` via MealHistoryService.saveMeal */
export type AddMealHistoryInput = {
  recipeId: string;
  mealType: MealType;
  cookingTime?: number;
  satisfaction?: MealSatisfaction | null;
  cookedDate?: string;
  recipeName?: string;
  category?: FoodMemoryCategory;
};
