/**
 * @deprecated Prefer `data/recipes/recipeImageMap.ts` (Sprint H7 source of truth).
 * Kept as a thin re-export for existing image-service imports.
 */
export type { RecipeImageMapEntry as KnownRecipeImage } from '../../data/recipes/recipeImageMap';
export {
  getRecipeImageMapEntry as getKnownRecipeImage,
  normalizeRecipeImageId,
  RECIPE_IMAGE_MAP,
} from '../../data/recipes/recipeImageMap';
