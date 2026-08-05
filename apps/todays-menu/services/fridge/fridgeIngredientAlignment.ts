import type { PantryItem } from '../../types/pantry';
import {
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

/** Seasoning lines that affect tier / card messaging (pantry staples excluded). */
const TIER_SEASONING_KEYS = new Set([
  'soy_sauce',
  'gochujang',
  'sesame_oil',
  'tonkatsu_sauce',
  'vinegar',
  'doenjang',
]);

export function isTierRequiredIngredient(ingredient: FridgeRequiredIngredient): boolean {
  if (ingredient.group === 'main' || ingredient.group === 'sub') return true;
  return ingredient.group === 'seasoning' && TIER_SEASONING_KEYS.has(ingredient.matchKey);
}

export function isDisplayMissingIngredient(ingredient: FridgeRequiredIngredient): boolean {
  return isTierRequiredIngredient(ingredient);
}

export function alignFridgeIngredients(
  required: FridgeRequiredIngredient[],
  ownedKeys: Set<string>,
  pantryItems: PantryItem[],
): FridgeIngredientAlignment {
  const tierRequired = required.filter(isTierRequiredIngredient);
  const requiredKeys = new Set(required.map((item) => item.matchKey));

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
    const matchKey = resolvePantryItemMatchKey(item.iconKey, item.name);
    if (requiredKeys.has(matchKey)) {
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
