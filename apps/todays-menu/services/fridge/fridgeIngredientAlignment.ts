import type { PantryItem } from '../../types/pantry';
import {
  expandPantryOwnedMatchKeys,
  pantryOwnsMatchKey,
  resolvePantryItemMatchKey,
} from './fridgeIngredientMatch';

export type FridgeRequiredIngredient = {
  matchKey: string;
  name: string;
  group: 'main' | 'sub' | 'seasoning';
};

export type FridgeIngredientAlignment = {
  matchedIngredients: string[];
  missingIngredients: string[];
  extraSelectedIngredients: string[];
  matchedCount: number;
  missingCount: number;
  matchRatio: number;
  selectedIngredientCount: number;
  matchedSelectedIngredients: string[];
  matchedSelectedCount: number;
  selectedCoverageRatio: number;
  unusedSelectedIngredients: string[];
};

/**
 * Seasonings previously counted toward tier/missing (pre–seasoning-exclusion policy).
 * Catalog audit reference — do not auto-reclassify to main/sub.
 */
export const FRIDGE_LEGACY_TIER_SEASONING_KEYS = new Set([
  'soy_sauce',
  'gochujang',
  'sesame_oil',
  'tonkatsu_sauce',
  'vinegar',
  'doenjang',
]);

/** Fridge recommendation / missing policy — main + sub only. */
export function isFridgeCoreIngredientGroup(
  group: FridgeRequiredIngredient['group'],
): boolean {
  return group === 'main' || group === 'sub';
}

export function isTierRequiredIngredient(ingredient: FridgeRequiredIngredient): boolean {
  return isFridgeCoreIngredientGroup(ingredient.group);
}

export function isDisplayMissingIngredient(ingredient: FridgeRequiredIngredient): boolean {
  return isFridgeCoreIngredientGroup(ingredient.group);
}

export function pantryItemUsesRecipeIngredient(
  item: PantryItem,
  required: FridgeRequiredIngredient[],
): boolean {
  const itemKey = resolvePantryItemMatchKey(item.iconKey, item.name);
  if (!itemKey) return false;
  const ownedItemKeys = expandPantryOwnedMatchKeys(new Set([itemKey]));
  return required.some((ingredient) => pantryOwnsMatchKey(ownedItemKeys, ingredient.matchKey));
}

export function alignFridgeIngredients(
  required: FridgeRequiredIngredient[],
  ownedKeys: Set<string>,
  pantryItems: PantryItem[],
): FridgeIngredientAlignment {
  const tierRequired = required.filter(isTierRequiredIngredient);

  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const ingredient of required) {
    if (!isDisplayMissingIngredient(ingredient)) continue;
    if (pantryOwnsMatchKey(ownedKeys, ingredient.matchKey)) {
      matchedIngredients.push(ingredient.name);
    } else {
      missingIngredients.push(ingredient.name);
    }
  }

  let tierMatched = 0;
  let tierMissing = 0;
  for (const ingredient of tierRequired) {
    if (pantryOwnsMatchKey(ownedKeys, ingredient.matchKey)) {
      tierMatched += 1;
    } else {
      tierMissing += 1;
    }
  }

  const matchedSelectedIngredients: string[] = [];
  const unusedSelectedIngredients: string[] = [];
  for (const item of pantryItems) {
    if (pantryItemUsesRecipeIngredient(item, required)) {
      matchedSelectedIngredients.push(item.name);
    } else {
      unusedSelectedIngredients.push(item.name);
    }
  }

  const selectedIngredientCount = pantryItems.length;
  const matchedSelectedCount = matchedSelectedIngredients.length;
  const selectedCoverageRatio =
    selectedIngredientCount > 0 ? matchedSelectedCount / selectedIngredientCount : 0;

  const denominator = tierRequired.length;
  const matchRatio = denominator > 0 ? tierMatched / denominator : 0;

  return {
    matchedIngredients,
    missingIngredients,
    extraSelectedIngredients: unusedSelectedIngredients,
    matchedCount: tierMatched,
    missingCount: tierMissing,
    matchRatio,
    selectedIngredientCount,
    matchedSelectedIngredients,
    matchedSelectedCount,
    selectedCoverageRatio,
    unusedSelectedIngredients,
  };
}
