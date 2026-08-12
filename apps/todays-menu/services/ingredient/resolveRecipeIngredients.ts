import type { RecipeIngredient } from '../../types/recipe';
import { resolveIngredient } from './resolveIngredient';

/** Recipe Import — resolve aliases to canonical ingredient names. */
export function resolveRecipeIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
  return ingredients.map((item) => {
    const resolved = resolveIngredient(item.name);
    return {
      ...item,
      canonicalName: resolved.canonicalName,
      ingredientId: resolved.ingredientId,
    };
  });
}
