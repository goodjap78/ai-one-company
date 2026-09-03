import { TODDLER_WEEKLY_PLAN_WEEKDAY_KO } from '../../constants/toddlerWeeklyPlanCopy';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';

export type ToddlerWeeklySlotDisplay = {
  day: WeeklyPlanSlot['day'];
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
};

export type ToddlerWeeklyShareCardModel = {
  seed: string;
  mealLabel: string;
  rows: ToddlerWeeklySlotDisplay[];
};

export function resolveToddlerWeeklySlotDisplay(slot: WeeklyPlanSlot): ToddlerWeeklySlotDisplay {
  const recipe = getHankkiRecipeById(slot.recipeId);
  return {
    day: slot.day,
    dayLabel: TODDLER_WEEKLY_PLAN_WEEKDAY_KO[slot.day],
    recipeId: slot.recipeId,
    name: recipe?.name ?? slot.recipeName,
    timeMinutes: recipe?.time ?? slot.time,
  };
}

export function buildToddlerWeeklyShareCardModel(
  plan: WeeklyMealPlan,
  mealLabel: string,
): ToddlerWeeklyShareCardModel {
  return {
    seed: plan.seed,
    mealLabel,
    rows: plan.slots.map(resolveToddlerWeeklySlotDisplay),
  };
}
