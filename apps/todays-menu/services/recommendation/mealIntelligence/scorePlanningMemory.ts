import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import { getPrimaryArchetype, menuCuisineFromId } from './mealProfile';

export const PLANNING_SAME_MEAL_PENALTY = -14;
export const PLANNING_SAME_CUISINE_PENALTY = -9;
export const PLANNING_SAME_STYLE_PENALTY = -8;
export const PLANNING_MEMORY_WEIGHT = 0.6;

export type PlanningMemoryScoreResult = {
  rawDelta: number;
  notes: string[];
};

function emptyResult(): PlanningMemoryScoreResult {
  return { rawDelta: 0, notes: [] };
}

/** Sprint 42 — saved meals reduce repeated HMIE recommendations. */
export function scorePlanningMemory(
  menu: MenuItem,
  context?: RecommendationContext,
): PlanningMemoryScoreResult {
  const snapshot = context?.mealPlanning;
  if (!snapshot || snapshot.entries.length === 0) return emptyResult();

  const { analysis } = snapshot;
  const notes: string[] = [];
  let rawDelta = 0;

  if (analysis.savedMealIds.includes(menu.id)) {
    rawDelta += PLANNING_SAME_MEAL_PENALTY;
    notes.push('planning_same_meal');
  }

  const cuisine = menuCuisineFromId(menu.id);
  if (
    cuisine !== 'catalog' &&
    analysis.savedCuisines.includes(cuisine as (typeof analysis.savedCuisines)[number])
  ) {
    rawDelta += PLANNING_SAME_CUISINE_PENALTY;
    notes.push('planning_same_cuisine');
  }

  const cookingStyle = getPrimaryArchetype(menu);
  if (analysis.savedCookingStyles.includes(cookingStyle)) {
    rawDelta += PLANNING_SAME_STYLE_PENALTY;
    notes.push('planning_same_style');
  }

  if (rawDelta === 0) return emptyResult();

  return {
    rawDelta: Math.round(rawDelta * PLANNING_MEMORY_WEIGHT),
    notes,
  };
}
