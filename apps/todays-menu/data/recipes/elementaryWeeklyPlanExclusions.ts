/**
 * Sprint v1.1 #3 — weekly-plan-only exclusions (browse/feed unchanged).
 *
 * recipe_0512 vs recipe_0445: identical ingredients/steps (참치또띠아).
 * Keep recipe_0445 as canonical browse entry; hide 0512 from weekly rotation only.
 */
export const ELEMENTARY_WEEKLY_EXCLUDED_RECIPE_IDS = ['recipe_0512'] as const;

export type ElementaryWeeklyExcludedRecipeId =
  (typeof ELEMENTARY_WEEKLY_EXCLUDED_RECIPE_IDS)[number];

export function isElementaryWeeklyExcluded(recipeId: string): boolean {
  return (ELEMENTARY_WEEKLY_EXCLUDED_RECIPE_IDS as readonly string[]).includes(recipeId);
}
