import type { Recipe } from '../../data/recipes/types';

/** Up to two main ingredient names for weekly plan day cards. */
export function resolveWeeklyPlanMainIngredientHints(recipe: Recipe | null | undefined): string[] {
  if (!recipe) return [];
  const fromIngredients = recipe.ingredients
    .filter((item) => item.group === 'main')
    .map((item) => item.name)
    .filter(Boolean);
  if (fromIngredients.length > 0) {
    return fromIngredients.slice(0, 2);
  }
  const fromMetadata = recipe.standardMetadata?.mainIngredients ?? [];
  return fromMetadata.slice(0, 2);
}

export function formatWeeklyPlanIngredientHints(names: readonly string[]): string {
  if (names.length === 0) return '';
  return names.join(' · ');
}
