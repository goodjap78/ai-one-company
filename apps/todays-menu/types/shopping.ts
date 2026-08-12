/**
 * Sprint 63-B — Shopping list foundation (no product API / affiliate links).
 */

export type ShoppingIngredientGroup = 'main' | 'sub' | 'seasoning';

export type ShoppingIngredientItem = {
  recipeId: string;
  ingredientName: string;
  shoppingKeyword: string;
  amountText: string;
  group: ShoppingIngredientGroup;
  matchKey: string;
  iconKey: string;
  /** Set when built from missing-only flows (fridge / pantry diff). */
  isMissing?: boolean;
};

export type RecipeShoppingList = {
  recipeId: string;
  found: boolean;
  items: ShoppingIngredientItem[];
};
