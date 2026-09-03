import { BABY_WEEKLY_PLAN_WEEKDAY_KO } from '../../constants/babyWeeklyPlanCopy';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';

export type BabyWeeklySlotDisplay = {
  day: WeeklyPlanSlot['day'];
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
};

export type BabyWeeklyShareCardModel = {
  seed: string;
  stageLabel: string;
  rows: BabyWeeklySlotDisplay[];
};

export function resolveBabyWeeklySlotDisplay(slot: WeeklyPlanSlot): BabyWeeklySlotDisplay {
  const recipe = getHankkiRecipeById(slot.recipeId);
  return {
    day: slot.day,
    dayLabel: BABY_WEEKLY_PLAN_WEEKDAY_KO[slot.day],
    recipeId: slot.recipeId,
    name: recipe?.name ?? slot.recipeName,
    timeMinutes: recipe?.time ?? slot.time,
  };
}

export function buildBabyWeeklyShareCardModel(
  plan: WeeklyMealPlan,
  stageLabel: string,
): BabyWeeklyShareCardModel {
  return {
    seed: plan.seed,
    stageLabel,
    rows: plan.slots.map(resolveBabyWeeklySlotDisplay),
  };
}
