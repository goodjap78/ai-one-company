/**
 * Shared display mapping for the weekly plan screen and share card.
 * Keep names/times identical between the two surfaces.
 */
import { ELEMENTARY_BREAKFAST_WEEKDAY_KO } from '../../constants/elementaryBreakfastWeeklyPlanCopy';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { WeeklyMealPlan, WeeklyPlanDay, WeeklyPlanSlot } from '../../data/recipes/recipeFamilyAudienceTypes';
import {
  formatWeeklyPlanIngredientHints,
  resolveWeeklyPlanMainIngredientHints,
} from './elementaryWeeklyPlanDisplayCommon';
import { buildElementaryWeeklyShareCardModel } from './elementaryWeeklyShareCardModel';

export type ElementaryBreakfastSlotDisplay = {
  day: WeeklyPlanDay;
  dayLabel: string;
  recipeId: string;
  name: string;
  timeMinutes: number;
  ingredientHint: string;
};

export type ElementaryBreakfastShareCardModel = {
  seed: string;
  rows: ElementaryBreakfastSlotDisplay[];
};

export function resolveElementaryBreakfastSlotDisplay(
  slot: WeeklyPlanSlot,
): ElementaryBreakfastSlotDisplay {
  const recipe = getHankkiRecipeById(slot.recipeId);
  return {
    day: slot.day,
    dayLabel: ELEMENTARY_BREAKFAST_WEEKDAY_KO[slot.day],
    recipeId: slot.recipeId,
    name: recipe?.name ?? slot.recipeName,
    timeMinutes: recipe?.time ?? slot.time,
    ingredientHint: formatWeeklyPlanIngredientHints(resolveWeeklyPlanMainIngredientHints(recipe)),
  };
}

export function buildElementaryBreakfastShareCardModel(
  plan: WeeklyMealPlan,
): ElementaryBreakfastShareCardModel {
  return {
    seed: plan.seed,
    rows: plan.slots.map(resolveElementaryBreakfastSlotDisplay),
  };
}

/** Sprint 5 — card-news share capture model. */
export function buildElementaryBreakfastWeeklyShareCardModel(plan: WeeklyMealPlan) {
  return buildElementaryWeeklyShareCardModel(plan, resolveElementaryBreakfastSlotDisplay);
}
