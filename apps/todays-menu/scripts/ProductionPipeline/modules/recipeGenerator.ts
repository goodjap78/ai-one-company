/**
 * Recipe Generator — ensure production catalog is valid & counted.
 * Does not invent recipes; orchestrates factory validation on HANKKI_RECIPES.
 */
import { HANKKI_RECIPES } from '../../../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../../../data/recipes/validateHankkiProduction';
import type { Recipe } from '../../../data/recipes/types';

export type RecipeGeneratorResult = {
  recipes: Recipe[];
  count: number;
  validationOk: boolean;
  issueCount: number;
  issues: Array<{ recipeId: string; code: string; message: string }>;
};

export function runRecipeGenerator(): RecipeGeneratorResult {
  const recipes = HANKKI_RECIPES;
  const validation = validateHankkiProductionDb(recipes);
  return {
    recipes,
    count: recipes.length,
    validationOk: validation.ok,
    issueCount: validation.issues.length,
    issues: validation.issues.map((i) => ({
      recipeId: i.recipeId,
      code: i.code,
      message: i.message,
    })),
  };
}
