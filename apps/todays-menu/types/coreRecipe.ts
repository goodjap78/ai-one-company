import type { PreferenceSeason } from './preference';
import type { RecipeIngredient, RecipeStep } from './recipe';
import type { RecipeTagId } from '../recipes/types';
import type { WeatherTag } from './mealIntelligence';

export type CoreRecipeCategory =
  | 'korean'
  | 'quick'
  | 'western'
  | 'japanese'
  | 'chinese'
  | 'healthy';

export type CoreCuisine = 'Korean' | 'Japanese' | 'Chinese' | 'Western';

export type CoreMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Estimated nutrition per serving. */
export type CoreNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Content Sprint C1-1 — HANKKI Gold Recipe (premium quality standard).
 * Source of truth for the first 30 recipes powering homemade recommendations.
 */
export type CoreRecipe = {
  id: string;
  name: string;
  category: CoreRecipeCategory;
  cuisine: CoreCuisine;
  mealTypes: CoreMealType[];
  /** Primary emoji for cards / placeholders */
  emoji: string;
  cookTimeMinutes: number;
  difficulty: 'easy' | 'normal' | 'hard';
  servings: number;
  /** Calories per serving (also mirrored in nutrition.calories) */
  calories: number;
  ingredients: RecipeIngredient[];
  seasonings: RecipeIngredient[];
  cookingSteps: RecipeStep[];
  pairingFoods: string[];
  nutrition: CoreNutrition;
  weatherTags: WeatherTag[];
  seasonTags: PreferenceSeason[];
  /** Natural AI recommendation reason templates (1–3) */
  aiReasonTemplates: string[];
  /** HANKKI tip shown on recipe / home honey tip */
  tip: string;
  tags: RecipeTagId[];
};
