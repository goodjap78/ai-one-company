/**
 * Display mapping for elementary dinner weekly plan screen + share card.
 */
import { ELEMENTARY_DINNER_WEEKDAY_KO } from '../../constants/elementaryDinnerWeeklyPlanCopy';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanDay, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import {
  formatWeeklyPlanIngredientHints,
  resolveWeeklyPlanMainIngredientHints,
} from './elementaryWeeklyPlanDisplayCommon';
import { buildElementaryWeeklyShareCardModel } from './elementaryWeeklyShareCardModel';

export type ElementaryDinnerSlotDisplay = {
  day: WeeklyPlanDay;
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
  ingredientHint: string;
};

export type ElementaryDinnerShareCardModel = {
  seed: string;
  rows: ElementaryDinnerSlotDisplay[];
};

export function resolveElementaryDinnerSlotDisplay(
  slot: WeeklyPlanSlot,
): ElementaryDinnerSlotDisplay {
  const recipe = getHankkiRecipeById(slot.recipeId);
  return {
    day: slot.day,
    dayLabel: ELEMENTARY_DINNER_WEEKDAY_KO[slot.day],
    recipeId: slot.recipeId,
    name: recipe?.name ?? slot.recipeName,
    timeMinutes: recipe?.time ?? slot.time,
    ingredientHint: formatWeeklyPlanIngredientHints(resolveWeeklyPlanMainIngredientHints(recipe)),
  };
}

export function buildElementaryDinnerShareCardModel(
  plan: WeeklyMealPlan,
): ElementaryDinnerShareCardModel {
  return {
    seed: plan.seed,
    rows: plan.slots.map(resolveElementaryDinnerSlotDisplay),
  };
}

/** Sprint 5 — card-news share capture model. */
export function buildElementaryDinnerWeeklyShareCardModel(plan: WeeklyMealPlan) {
  return buildElementaryWeeklyShareCardModel(plan, resolveElementaryDinnerSlotDisplay);
}
