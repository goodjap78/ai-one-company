/**
 * Sprint 12 — toddler breakfast/dinner weekly display + share model.
 * Reuses elementary Sprint 5.3 share card model builder (no new design system).
 */
import { TODDLER_BREAKFAST_WEEKDAY_KO } from '../../constants/toddlerBreakfastWeeklyPlanCopy';
import { TODDLER_DINNER_WEEKDAY_KO } from '../../constants/toddlerDinnerWeeklyPlanCopy';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanDay, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import {
  formatWeeklyPlanIngredientHints,
  resolveWeeklyPlanMainIngredientHints,
} from './elementaryWeeklyPlanDisplayCommon';
import { buildElementaryWeeklyShareCardModel } from './elementaryWeeklyShareCardModel';

export type ToddlerBfDnSlotDisplay = {
  day: WeeklyPlanDay;
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
  ingredientHint: string;
};

function weekdayKo(mealType: 'breakfast' | 'dinner', day: WeeklyPlanDay): string {
  return mealType === 'breakfast'
    ? TODDLER_BREAKFAST_WEEKDAY_KO[day]
    : TODDLER_DINNER_WEEKDAY_KO[day];
}

export function resolveToddlerBfDnSlotDisplay(
  slot: WeeklyPlanSlot,
  mealType: 'breakfast' | 'dinner',
): ToddlerBfDnSlotDisplay {
  const recipe = getHankkiRecipeById(slot.recipeId);
  return {
    day: slot.day,
    dayLabel: weekdayKo(mealType, slot.day),
    recipeId: slot.recipeId,
    name: recipe?.name ?? slot.recipeName,
    timeMinutes: recipe?.time ?? slot.time,
    ingredientHint: formatWeeklyPlanIngredientHints(resolveWeeklyPlanMainIngredientHints(recipe)),
  };
}

/** Sprint 5.3 photo-first share capture model. */
export function buildToddlerBreakfastWeeklyShareCardModel(plan: WeeklyMealPlan) {
  return buildElementaryWeeklyShareCardModel(plan, (slot) =>
    resolveToddlerBfDnSlotDisplay(slot, 'breakfast'),
  );
}

export function buildToddlerDinnerWeeklyShareCardModel(plan: WeeklyMealPlan) {
  return buildElementaryWeeklyShareCardModel(plan, (slot) =>
    resolveToddlerBfDnSlotDisplay(slot, 'dinner'),
  );
}
