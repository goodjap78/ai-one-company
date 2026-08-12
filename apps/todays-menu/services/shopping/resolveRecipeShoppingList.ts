import type { PantrySnapshot } from '../../types/pantry';
import type { RecipeShoppingList } from '../../types/shopping';
import type { ShoppingListMode } from '../../constants/shoppingConfig';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import {
  buildMissingRecipeShoppingList,
  buildRecipeShoppingList,
} from './buildRecipeShoppingList';

export function resolveRecipeShoppingList(
  recipeId: string,
  mode: ShoppingListMode,
  pantry?: PantrySnapshot | null,
): RecipeShoppingList {
  if (!recipeId) return { recipeId: '', found: false, items: [] };

  if (mode === 'missing') {
    if (!pantry) return { recipeId, found: Boolean(getHankkiRecipeById(recipeId)), items: [] };
    return buildMissingRecipeShoppingList(recipeId, pantry);
  }

  return buildRecipeShoppingList(recipeId);
}
