import type { PantryMatchResult, PantrySnapshot } from '../../types/pantry';
import { resolveIngredient } from '../ingredient';
import { pantryHasNormalizedIngredient } from './buildPantrySnapshot';

type RecipeIngredientRef = {
  name: string;
  amount: string;
  optional?: boolean;
};

/** Presence-based matching — pantry has the ingredient or it does not. */
export function matchRecipeIngredientsToPantry(
  ingredients: RecipeIngredientRef[],
  pantry: PantrySnapshot,
): PantryMatchResult {
  const required = ingredients.filter((ingredient) => !ingredient.optional);
  if (required.length === 0 || pantry.items.length === 0) {
    return { matchedCount: 0, requiredCount: required.length, overlapRatio: 0, matchedNames: [] };
  }

  const matchedNames: string[] = [];

  for (const ingredient of required) {
    const { canonicalName } = resolveIngredient(ingredient.name);
    if (pantryHasNormalizedIngredient(canonicalName, pantry)) {
      matchedNames.push(ingredient.name);
    }
  }

  return {
    matchedCount: matchedNames.length,
    requiredCount: required.length,
    overlapRatio: required.length > 0 ? matchedNames.length / required.length : 0,
    matchedNames,
  };
}
