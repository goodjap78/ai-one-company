import { isInternalQaEnabled } from './isInternalQaEnabled';

/** Canonical homemade detail for weekly child recipes (skips /recipe/[id] hop). */
export function weeklyRecipeDetailHref(recipeId: string): `/ingredients/${string}` {
  return `/ingredients/${recipeId}`;
}

export type WeeklyRecipeQaAudience = 'elementary' | 'toddler';
export type WeeklyRecipeQaMealType = 'breakfast' | 'dinner';

/** Preview/QA only. Never render this in production UI. */
export function logWeeklyRecipePressQa(info: {
  recipeId: string;
  audience: WeeklyRecipeQaAudience;
  mealType: WeeklyRecipeQaMealType;
  targetRoute: string;
}): void {
  if (!isInternalQaEnabled()) return;
  console.log('[Weekly Recipe QA]', {
    recipeId: info.recipeId,
    audience: info.audience,
    mealType: info.mealType,
    targetRoute: info.targetRoute,
  });
}

/** Preview/QA only. Never render this in production UI. */
export function logWeeklyRecipeResolveFailedQa(info: {
  recipeId: string;
  getMenuById: boolean;
  getHankkiRecipeById: boolean;
  fetchRecipe: boolean;
}): void {
  if (!isInternalQaEnabled()) return;
  console.log('[Weekly Recipe QA] recipe resolve failed', {
    recipeId: info.recipeId,
    getMenuById: info.getMenuById,
    getHankkiRecipeById: info.getHankkiRecipeById,
    fetchRecipe: info.fetchRecipe,
  });
}
