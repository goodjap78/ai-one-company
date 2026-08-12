/**
 * Sprint 43 — Smart Grocery Engine (internal only, no shopping UI).
 *
 * Pipeline:
 * Meal Planning → Ingredient Extraction → IIE Normalizer → Duplicate Merge
 * → Category Grouping → Final Grocery List
 */

import type { IngredientCategory } from './ingredient';
import { INGREDIENT_CATEGORY_LABELS } from './ingredient';

export type GroceryCategory = IngredientCategory;

export const GROCERY_CATEGORY_ORDER: GroceryCategory[] = [
  'vegetables',
  'meat',
  'seafood',
  'dairy',
  'eggs',
  'grains',
  'seasonings',
  'others',
];

export const GROCERY_CATEGORY_LABELS = INGREDIENT_CATEGORY_LABELS;

export type GroceryListItem = {
  id: string;
  name: string;
  normalizedName: string;
  category: GroceryCategory;
  /** User-facing line — e.g. "계란 ×4", "양파 ×2" */
  displayLine: string;
  quantity: number;
  unit: string;
  optional: boolean;
  sourceRecipeIds: string[];
};

export type GroceryCategoryGroup = {
  category: GroceryCategory;
  label: string;
  items: GroceryListItem[];
};

export type GrocerySourceSummary = {
  savedMealIds: string[];
  completedMealIds: string[];
};

/** Future: Pantry, Shopping Adapter, Meal Kit, Delivery (provider-independent). */
export type GroceryExtensions = {
  pantry?: {
    pantryItemCount?: number;
    suppressedItemCount?: number;
  };
  shoppingAdapter?: Record<string, unknown>;
  mealKit?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
};

export type GroceryListStore = {
  version: 2;
  generatedAt: string;
  sources: GrocerySourceSummary;
  groups: GroceryCategoryGroup[];
  items: GroceryListItem[];
  extensions: GroceryExtensions;
};

export type GroceryListSnapshot = {
  version: 2;
  generatedAt: string;
  sources: GrocerySourceSummary;
  groups: GroceryCategoryGroup[];
  items: GroceryListItem[];
  extensions: GroceryExtensions;
};

export type ParsedIngredientAmount = {
  quantity: number;
  unit: string;
  raw: string;
};

export type GroceryIngredientLine = {
  name: string;
  amount: string;
  optional?: boolean;
  recipeId: string;
};

export type NormalizedIngredientLine = GroceryIngredientLine & {
  normalizedName: string;
  displayName: string;
  category: GroceryCategory;
};
