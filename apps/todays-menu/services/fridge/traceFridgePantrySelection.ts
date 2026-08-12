import type { PantrySnapshot } from '../../types/pantry';
import { resolvePantryItemMatchKey } from './fridgeIngredientMatch';

export type FridgePantrySelectionTrace = {
  selectedCount: number;
  rawNames: string[];
  selectedIngredientIds: string[];
  selectedIngredientNames: string[];
  normalizedNames: string[];
  iconKeys: string[];
  matchKeys: string[];
  snapshotMatchKeys: string[];
  duplicateMatchKeys: string[];
};

export function traceFridgePantrySelection(pantry: PantrySnapshot): FridgePantrySelectionTrace {
  const matchKeys = pantry.items.map((item) => resolvePantryItemMatchKey(item.iconKey, item.name));
  const seen = new Set<string>();
  const duplicateMatchKeys: string[] = [];
  for (const key of matchKeys) {
    if (!key) continue;
    if (seen.has(key)) duplicateMatchKeys.push(key);
    seen.add(key);
  }

  return {
    selectedCount: pantry.items.length,
    rawNames: pantry.items.map((item) => item.name),
    selectedIngredientIds: pantry.items.map((item) => item.id),
    selectedIngredientNames: pantry.items.map((item) => item.name),
    normalizedNames: pantry.items.map((item) => item.normalizedName),
    iconKeys: pantry.items.map((item) => item.iconKey),
    matchKeys,
    snapshotMatchKeys: pantry.matchKeys,
    duplicateMatchKeys,
  };
}
