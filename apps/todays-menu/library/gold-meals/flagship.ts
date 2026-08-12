import type { GoldMealRecord } from '../../types/goldMeal';
import { CORE_RECIPES } from '../../data/recipes/coreRecipes';
import { coreRecipeToGoldMeal } from '../../data/recipes/coreRecipeMapper';

/**
 * Legacy flagship export — Content Sprint C1 routes through the 30-recipe core DB.
 */
export const GOLD_MEALS_FLAGSHIP: GoldMealRecord[] = CORE_RECIPES.map(coreRecipeToGoldMeal);

const FLAGSHIP_BY_ID = new Map(GOLD_MEALS_FLAGSHIP.map((meal) => [meal.id, meal]));

export function getFlagshipGoldMealById(id: string): GoldMealRecord | undefined {
  return FLAGSHIP_BY_ID.get(id);
}

export function isFlagshipGoldMeal(id: string): boolean {
  return FLAGSHIP_BY_ID.has(id);
}
