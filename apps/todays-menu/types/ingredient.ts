/**
 * Sprint 45.5 — Ingredient Intelligence Engine (IIE).
 * Canonical ingredient model — single source of truth for HANKKI.
 */

export type IngredientCategory =
  | 'vegetables'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'grains'
  | 'seasonings'
  | 'others';

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetables: 'Vegetables',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  eggs: 'Eggs',
  grains: 'Grains',
  seasonings: 'Seasonings',
  others: 'Others',
};

export type NutritionGroup =
  | 'protein'
  | 'carbohydrate'
  | 'fat'
  | 'fiber'
  | 'vitamin'
  | 'mineral'
  | 'other';

export const NUTRITION_GROUP_LABELS: Record<NutritionGroup, string> = {
  protein: 'Protein',
  carbohydrate: 'Carbohydrate',
  fat: 'Fat',
  fiber: 'Fiber',
  vitamin: 'Vitamin',
  mineral: 'Mineral',
  other: 'Other',
};

export type IngredientMealTag =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'side'
  | 'staple'
  | 'protein_main'
  | 'soup_base'
  | 'fermented'
  | 'pantry_staple';

export type Ingredient = {
  id: string;
  canonicalName: string;
  aliases: string[];
  category: IngredientCategory;
  nutritionGroup: NutritionGroup;
  searchableTokens: string[];
  mealTags: IngredientMealTag[];
};

/** Future: Recipe Import, AI Chef, Nutrition, Shopping, Meal Kit, Pantry. */
export type IngredientExtensions = {
  recipeImport?: Record<string, unknown>;
  aiChef?: Record<string, unknown>;
  nutrition?: Record<string, unknown>;
  shopping?: Record<string, unknown>;
  mealKit?: Record<string, unknown>;
  pantry?: Record<string, unknown>;
};

export type ResolvedIngredient = {
  ingredientId: string | null;
  canonicalName: string;
  displayName: string;
  category: IngredientCategory;
  nutritionGroup: NutritionGroup;
  mealTags: IngredientMealTag[];
  matchedAlias?: string;
  known: boolean;
};

export type IngredientLookupResult = ResolvedIngredient;
