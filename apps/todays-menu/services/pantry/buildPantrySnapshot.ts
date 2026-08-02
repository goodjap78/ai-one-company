import type { PantrySnapshot, PantryStore } from '../../types/pantry';
import { resolvePantryItemMatchKey } from '../fridge/fridgeIngredientMatch';

export function buildPantrySnapshotFromStore(store: PantryStore): PantrySnapshot {
  const ingredientNames = [...new Set(store.items.map((item) => item.normalizedName))];
  const matchKeys = [
    ...new Set(
      store.items
        .map((item) => resolvePantryItemMatchKey(item.iconKey, item.name))
        .filter((key) => key.length > 0),
    ),
  ];

  return {
    version: 2,
    items: store.items,
    ingredientNames,
    matchKeys,
    updatedAt: store.updatedAt,
    extensions: store.extensions,
  };
}

export function pantryHasNormalizedIngredient(
  normalizedName: string,
  pantry: PantrySnapshot,
): boolean {
  return pantry.ingredientNames.includes(normalizedName);
}
