import type { GroceryCategory, GroceryIngredientLine } from '../../types/grocery';
import { resolveIngredient } from '../ingredient';

/** @deprecated Use `resolveIngredient` from services/ingredient. */
export function normalizeIngredient(rawName: string): {
  normalizedName: string;
  displayName: string;
} {
  const resolved = resolveIngredient(rawName);
  return {
    normalizedName: resolved.canonicalName,
    displayName: resolved.displayName,
  };
}

export function categorizeIngredient(canonicalName: string): GroceryCategory {
  const known = resolveIngredient(canonicalName);
  return known.category;
}

export function normalizeIngredientLine(
  line: GroceryIngredientLine,
): {
  normalizedName: string;
  displayName: string;
  category: GroceryCategory;
} {
  const resolved = resolveIngredient(line.name);
  return {
    normalizedName: resolved.canonicalName,
    displayName: resolved.displayName,
    category: resolved.category,
  };
}
