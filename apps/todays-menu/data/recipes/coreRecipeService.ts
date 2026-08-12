import type { CoreRecipe } from '../../types/coreRecipe';
import type { GoldMealRecord } from '../../types/goldMeal';
import type { Recipe } from '../../types/recipe';
import { goldMealToRecipe } from '../../services/goldMeal/goldMealService';
import { CORE_RECIPES } from './coreRecipes';
import { coreRecipeToGoldMeal } from './coreRecipeMapper';

const CORE_BY_ID = new Map(CORE_RECIPES.map((recipe) => [recipe.id, recipe]));

export function getCoreRecipeById(id: string): CoreRecipe | undefined {
  return CORE_BY_ID.get(id);
}

export function listCoreRecipes(): CoreRecipe[] {
  return [...CORE_RECIPES];
}

export function getCoreGoldMealById(id: string): GoldMealRecord | undefined {
  const recipe = getCoreRecipeById(id);
  return recipe ? coreRecipeToGoldMeal(recipe) : undefined;
}

export function coreRecipeToRecipe(recipe: CoreRecipe): Recipe {
  return goldMealToRecipe(coreRecipeToGoldMeal(recipe));
}

export function getCoreRecipeDetailById(id: string): Recipe | null {
  const recipe = getCoreRecipeById(id);
  return recipe ? coreRecipeToRecipe(recipe) : null;
}

export function isCoreRecipeId(id: string): boolean {
  return CORE_BY_ID.has(id);
}

export { CORE_RECIPES };
