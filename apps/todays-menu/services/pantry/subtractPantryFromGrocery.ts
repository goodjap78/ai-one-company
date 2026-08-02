import type { GroceryListItem } from '../../types/grocery';
import type { PantrySnapshot } from '../../types/pantry';
import { pantryHasNormalizedIngredient } from './buildPantrySnapshot';

/** Exclude grocery items already in the pantry — missing ingredients only. */
export function subtractPantryFromGrocery(
  items: GroceryListItem[],
  pantry: PantrySnapshot,
): GroceryListItem[] {
  if (pantry.items.length === 0) return items;

  return items.filter(
    (item) => !pantryHasNormalizedIngredient(item.normalizedName, pantry),
  );
}
