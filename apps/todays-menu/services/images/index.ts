export {
  getDefaultMealImageSource,
  getLocalMealImageSource,
  MEAL_LOCAL_IMAGES,
} from './mealImageAssets';
export {
  getIngredientImageSource,
  INGREDIENT_IMAGE_ASSETS,
  INGREDIENT_ID_TO_ICON_KEY,
  INGREDIENT_NAME_TO_ICON_KEY,
  listRegisteredIngredientImageKeys,
  isKnownIngredientImageKey,
} from './ingredientImageAssets';
export type { IngredientImageKey } from './ingredientImageAssets';
export {
  resolveIngredientIcon,
  resolveIngredientIconKey,
  resolveIngredientIconMeta,
} from './resolveIngredientIcon';
export type {
  ResolveIngredientIconInput,
  ResolvedIngredientIconMeta,
} from './resolveIngredientIcon';
export {
  getRecipeStepImageSource,
  RECIPE_STEP_IMAGE_ASSETS,
  listRegisteredRecipeStepImageKeys,
} from './recipeStepImageAssets';
export type { RecipeStepImageKey } from './recipeStepImageAssets';
export {
  getKnownRecipeImage,
  normalizeRecipeImageId,
  RECIPE_IMAGE_MAP,
} from './knownRecipeImageMap';
export {
  getMealImageRegistryEntry,
  GOLD_MEAL_IMAGE_REGISTRY,
  isGoldMealImageId,
} from './mealImageRegistry';
export {
  resolveMealImage,
  resolveMealImageAsRecipe,
  toRecipeImage,
} from './resolveMealImage';
export {
  CONVENIENCE_ILLUSTRATION_ICON_ASSETS,
  getConvenienceIllustrationIconSource,
  isKnownConvenienceIllustrationIconKey,
  listConvenienceIllustrationIconKeys,
} from './convenienceIllustrationIconAssets';
export {
  resolveConvenienceIllustrationIcon,
  resolveConvenienceIllustrationIconForLabel,
} from './resolveConvenienceIllustrationIcon';
export type {
  MealImageRegistryEntry,
  MealImageSourceType,
  MealLocalAssetKey,
  ResolvedMealImage,
} from './mealImageTypes';
