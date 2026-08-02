import type { MenuItem } from '../../types/recommendation';
import type { PantryMatchIndex, PantrySnapshot } from '../../types/pantry';
import { getRecipeById } from '../recipe/mockRecipeDetails';
import { matchRecipeIngredientsToPantry } from './matchPantryIngredients';

/** Precompute pantry overlap per menu for synchronous HMIE scoring. */
export function buildPantryMatchIndex(
  menus: MenuItem[],
  pantry: PantrySnapshot,
): PantryMatchIndex {
  if (pantry.items.length === 0) return {};

  const index: PantryMatchIndex = {};

  for (const menu of menus) {
    if (menu.mode === 'delivery') continue;

    const recipe = getRecipeById(menu.id);
    if (!recipe || recipe.mode === 'delivery') continue;

    index[menu.id] = matchRecipeIngredientsToPantry(recipe.ingredients, pantry);
  }

  return index;
}
