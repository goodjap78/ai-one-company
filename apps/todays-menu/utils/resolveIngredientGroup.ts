import type { RecipeIngredient, RecipeIngredientGroup } from '../types/recipe';
import { resolveIngredient } from '../services/ingredient/resolveIngredient';
import { resolveIngredientIconKey as resolveIconKeyFromName } from '../services/images/resolveIngredientIcon';

/**
 * Sprint R2/R3 — resolve ingredient group without mutating recipe data.
 * Uses explicit `group` when present; otherwise tags / IIE category.
 */
export function resolveIngredientGroup(item: RecipeIngredient): RecipeIngredientGroup {
  if (item.group === 'main' || item.group === 'sub' || item.group === 'seasoning') {
    return item.group;
  }

  const tags = (item.tags ?? []).join(' ');
  if (/양념|시즈닝|seasoning/i.test(tags)) return 'seasoning';
  if (/주재료|main/i.test(tags)) return 'main';
  if (/부재료|sub/i.test(tags)) return 'sub';

  const resolved = resolveIngredient(item.canonicalName ?? item.name);
  if (resolved.category === 'seasonings') return 'seasoning';

  const isMain =
    resolved.mealTags.includes('protein_main') ||
    resolved.mealTags.includes('staple') ||
    resolved.category === 'meat' ||
    resolved.category === 'seafood' ||
    resolved.category === 'eggs' ||
    resolved.category === 'grains' ||
    resolved.category === 'dairy';

  return isMain ? 'main' : 'sub';
}

/** Prefer stored iconKey; otherwise map from name / alias (Sprint R5-2). */
export function resolveIngredientIconKey(item: RecipeIngredient): string {
  return resolveIconKeyFromName(item);
}
