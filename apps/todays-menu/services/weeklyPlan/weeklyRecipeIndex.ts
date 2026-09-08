/**
 * Current weekly plan for the recipe-index screen.
 * Reads live stored slots — never a snapshot of old recipeIds.
 */
import {
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
  TODDLER_BREAKFAST_WEEK_HREF,
  TODDLER_DINNER_WEEK_HREF,
  weeklyRecipesHref,
} from '../../constants/appRoutes';
import {
  WEEKLY_RECIPE_INDEX_SOURCES,
  type WeeklyRecipeIndexSource,
} from '../../constants/weeklyRecipeAccessCopy';
import type { WeeklyMealPlan, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import { loadElementaryBreakfastWeeklyPlanState } from './elementaryBreakfastWeeklyPlanStorage';
import { resolveElementaryBreakfastSlotDisplay } from './elementaryBreakfastWeeklyPlanDisplay';
import { loadElementaryDinnerWeeklyPlanState } from './elementaryDinnerWeeklyPlanStorage';
import { resolveElementaryDinnerSlotDisplay } from './elementaryDinnerWeeklyPlanDisplay';
import { resolveToddlerBfDnSlotDisplay } from './toddlerBfDnWeeklyPlanDisplay';
import { loadToddlerWeeklyPlanState } from './toddlerWeeklyPlanStorage';

export { weeklyRecipesHref };
export type { WeeklyRecipeIndexSource };

export function parseWeeklyRecipeIndexSource(
  value: string | string[] | undefined,
): WeeklyRecipeIndexSource | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return (WEEKLY_RECIPE_INDEX_SOURCES as readonly string[]).includes(raw)
    ? (raw as WeeklyRecipeIndexSource)
    : null;
}

export function weeklyRecipeIndexFallbackHref(source: WeeklyRecipeIndexSource) {
  switch (source) {
    case 'elementary-breakfast':
      return ELEMENTARY_BREAKFAST_WEEK_HREF;
    case 'elementary-dinner':
      return ELEMENTARY_DINNER_WEEK_HREF;
    case 'toddler-breakfast':
      return TODDLER_BREAKFAST_WEEK_HREF;
    case 'toddler-dinner':
      return TODDLER_DINNER_WEEK_HREF;
  }
}

export function weeklyRecipeIndexEyebrow(source: WeeklyRecipeIndexSource): string {
  switch (source) {
    case 'elementary-breakfast':
      return '초등학생 아침';
    case 'elementary-dinner':
      return '초등학생 저녁';
    case 'toddler-breakfast':
      return '유아 아침';
    case 'toddler-dinner':
      return '유아 저녁';
  }
}

export async function loadCurrentWeeklyPlanForIndex(
  source: WeeklyRecipeIndexSource,
): Promise<WeeklyMealPlan | null> {
  if (source === 'elementary-breakfast') {
    return (await loadElementaryBreakfastWeeklyPlanState())?.plan ?? null;
  }
  if (source === 'elementary-dinner') {
    return (await loadElementaryDinnerWeeklyPlanState())?.plan ?? null;
  }
  const meal = source === 'toddler-breakfast' ? 'breakfast' : 'dinner';
  return (await loadToddlerWeeklyPlanState(meal))?.plan ?? null;
}

export function recipeIdsFromWeeklyPlan(plan: WeeklyMealPlan): string[] {
  return plan.slots.map((slot) => slot.recipeId);
}

export function resolveWeeklyIndexSlotDisplay(
  source: WeeklyRecipeIndexSource,
  slot: WeeklyPlanSlot,
) {
  if (source === 'elementary-breakfast') {
    return resolveElementaryBreakfastSlotDisplay(slot);
  }
  if (source === 'elementary-dinner') {
    return resolveElementaryDinnerSlotDisplay(slot);
  }
  return resolveToddlerBfDnSlotDisplay(
    slot,
    source === 'toddler-breakfast' ? 'breakfast' : 'dinner',
  );
}
