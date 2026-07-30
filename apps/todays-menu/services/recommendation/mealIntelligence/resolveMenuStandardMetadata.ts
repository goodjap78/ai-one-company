import { getHankkiRecipeById } from '../../../data/recipes/hankkiRecipes';
import type { RecipeStandardMetadata } from '../../../data/recipes/recipeStandardMetadataTypes';
import type { Recipe } from '../../../data/recipes/types';
import type { MenuItem } from '../../../types/recommendation';

export type MenuAiRecipeContext = {
  recipe: Recipe | null;
  metadata: RecipeStandardMetadata | null;
};

/** Resolve HANKKI recipe + standard metadata for a catalog menu id (001–100). */
export function resolveMenuAiRecipeContext(menu: MenuItem): MenuAiRecipeContext {
  const recipe = getHankkiRecipeById(menu.id) ?? null;
  return {
    recipe,
    metadata: recipe?.standardMetadata ?? null,
  };
}
