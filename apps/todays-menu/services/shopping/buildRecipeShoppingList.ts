import type { Recipe } from '../../data/recipes/types';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { RecipeIngredient } from '../../data/recipes/types';
import type { PantrySnapshot } from '../../types/pantry';
import type { RecipeShoppingList, ShoppingIngredientItem } from '../../types/shopping';
import { alignFridgeIngredients } from '../fridge/fridgeIngredientAlignment';
import {
  buildPantryMatchKeySet,
  resolveRecipeIngredientMatchKey,
} from '../fridge/fridgeIngredientMatch';
import { getFridgeRecipeIndexEntry } from '../fridge/fridgeRecipeIndex';
import { getShoppingKeyword, normalizeShoppingWhitespace } from './shoppingKeyword';
import { mapRecipeGroup, mergeShoppingItems } from './mergeShoppingItems';

function mapIngredientLine(recipeId: string, ingredient: RecipeIngredient): ShoppingIngredientItem {
  const ingredientName = normalizeShoppingWhitespace(ingredient.name);
  const shoppingKeyword = getShoppingKeyword(ingredient.name);

  return {
    recipeId,
    ingredientName,
    shoppingKeyword,
    amountText: ingredient.amount.trim(),
    group: mapRecipeGroup(ingredient.group),
    matchKey: resolveRecipeIngredientMatchKey(ingredient),
    iconKey: ingredient.iconKey,
  };
}

function buildLinesFromRecipe(recipe: Recipe): ShoppingIngredientItem[] {
  return recipe.ingredients.map((ingredient) => mapIngredientLine(recipe.id, ingredient));
}

function emptyList(recipeId: string, found = false): RecipeShoppingList {
  return { recipeId, found, items: [] };
}

/** Full shopping list for a recipe (all ingredient groups, merged). */
export function buildRecipeShoppingList(recipeId: string): RecipeShoppingList {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return emptyList(recipeId, false);

  const lines = buildLinesFromRecipe(recipe);
  const items = mergeShoppingItems(lines);

  return {
    recipeId,
    found: true,
    items,
  };
}

/**
 * Missing ingredients only — uses fridge matchKey alignment (same as Fridge Raid).
 */
export function buildMissingRecipeShoppingList(
  recipeId: string,
  pantry: PantrySnapshot,
): RecipeShoppingList {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return emptyList(recipeId, false);

  const indexEntry = getFridgeRecipeIndexEntry(recipe);
  const ownedKeys = buildPantryMatchKeySet(pantry);
  const alignment = alignFridgeIngredients(
    indexEntry.requiredIngredients,
    ownedKeys,
    pantry.items,
  );

  const missingNames = new Set(alignment.missingIngredients);
  const full = buildRecipeShoppingList(recipeId);

  const items = full.items
    .filter((item) => missingNames.has(item.ingredientName))
    .map((item) => ({ ...item, isMissing: true }));

  return {
    recipeId,
    found: true,
    items,
  };
}

/** Optional seasoning lines for fridge shopping (user opt-in, no auto-search). */
export function buildRecipeSeasoningShoppingItems(recipeId: string): ShoppingIngredientItem[] {
  const full = buildRecipeShoppingList(recipeId);
  if (!full.found) return [];
  return full.items.filter((item) => item.group === 'seasoning');
}

/** Bridge helper — map fridge candidate missing names to shopping items. */
export function buildMissingShoppingListFromNames(
  recipeId: string,
  missingNames: string[],
): RecipeShoppingList {
  const full = buildRecipeShoppingList(recipeId);
  if (!full.found) return emptyList(recipeId, false);

  const missingSet = new Set(missingNames);
  const items = full.items
    .filter((item) => missingSet.has(item.ingredientName))
    .map((item) => ({ ...item, isMissing: true }));

  return { recipeId, found: true, items };
}
