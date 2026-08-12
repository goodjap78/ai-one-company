import type { MasterRecipe, RecipeCategory } from './types';

import bulgogi from './korean/bulgogi.json';
import kimchiFriedRice from './korean/kimchi-fried-rice.json';
import tunaMayoRiceBowl from './korean/tuna-mayo-rice-bowl.json';

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  'korean',
  'japanese',
  'chinese',
  'western',
  'dessert',
  'healthy',
  'baby',
  'snacks',
  'drinks',
];

/** Published master recipes in the official database. */
export const MASTER_RECIPES: MasterRecipe[] = [
  bulgogi as MasterRecipe,
  tunaMayoRiceBowl as MasterRecipe,
  kimchiFriedRice as MasterRecipe,
];

const RECIPES_BY_ID = new Map(MASTER_RECIPES.map((recipe) => [recipe.id, recipe]));

const RECIPES_BY_CATEGORY = MASTER_RECIPES.reduce(
  (acc, recipe) => {
    const list = acc.get(recipe.category) ?? [];
    list.push(recipe);
    acc.set(recipe.category, list);
    return acc;
  },
  new Map<RecipeCategory, MasterRecipe[]>(),
);

export function getMasterRecipeById(id: string): MasterRecipe | undefined {
  return RECIPES_BY_ID.get(id);
}

export function getMasterRecipeBySlug(slug: string): MasterRecipe | undefined {
  return MASTER_RECIPES.find((recipe) => recipe.slug === slug);
}

export function listMasterRecipesByCategory(category: RecipeCategory): MasterRecipe[] {
  return RECIPES_BY_CATEGORY.get(category) ?? [];
}

export function listAllMasterRecipes(): MasterRecipe[] {
  return [...MASTER_RECIPES];
}

export { RECIPE_EMOTIONS, getRecipeEmotion, getRecipeEmotionLabel } from './emotions/emotions';
export { RECIPE_TAGS, getRecipeTag, getRecipeTagLabel } from './tags/tags';
export type {
  HankkiMessage,
  HankkiMessageContext,
  HankkiMessageLocale,
  LocalizedText,
  MasterRecipe,
  MasterRecipeImage,
  MasterRecipeIngredient,
  MasterRecipeMeta,
  MasterRecipeStep,
  RecipeCategory,
  RecipeEmotionId,
  RecipeTagId,
} from './types';
export { createHankkiMessage } from './types';
