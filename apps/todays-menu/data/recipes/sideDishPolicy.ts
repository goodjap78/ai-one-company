import type { CollectionId } from '../content/types/contentBase';
import type { Recipe } from './types';

/** Curated side-dish recipes — reviewed against category + meal structure. */
export const SIDE_DISH_FORCE_IDS = new Set<string>([
  '018', // 감자조림
  '029', // 두부조림
  '030', // 멸치볶음
  '097', // 시금치나물
  '098', // 견과멸치볶음
  '100', // 김치볶음
  'recipe_0136', // 시금치된장무침
  'recipe_0137', // 오이무침
  'recipe_0138', // 콩나물잡채
  'recipe_0128', // 꽈리고추참치볶음
  'recipe_0141', // 콩나물무침
  'recipe_0142', // 숙주나물
  'recipe_0143', // 가지무침
  'recipe_0144', // 무생채
  'recipe_0145', // 미역초무침
  'recipe_0146', // 어묵볶음
  'recipe_0147', // 진미채볶음
  'recipe_0148', // 감자채볶음
  'recipe_0149', // 새우볶음
  'recipe_0150', // 메추리알장조림
  'recipe_0151', // 연근조림
  'recipe_0152', // 우엉조림
  'recipe_0153', // 꽈리고추감자조림
  'recipe_0154', // 계란장조림
  'recipe_0155', // 두부부침
  'recipe_0156', // 두부강정
  'recipe_0157', // 소고기장조림
  'recipe_0158', // 꽁치간장조림
  'recipe_0159', // 애호박전
  'recipe_0160', // 두부전
]);

/**
 * Recipes tagged as 반찬 but eaten as a standalone light meal.
 * Kept in HOME collection for future breakfast/snack modes.
 */
export const SIDE_DISH_MAIN_OVERRIDES = new Set<string>([
  '019', // 계란말이
]);

const SIDE_DISH_CATEGORY_MARKERS = new Set(['반찬', '밑반찬']);

const MAIN_MEAL_NAME_PATTERN =
  /덮밥|비빔밥|볶음밥|주먹밥|김밥|라면|국수|냉면|파스타|스테이크|돈까스|버거|샌드|찌개$|국$|탕$|전골|카레|우동|잔치국수|칼국수|떡볶이|순대$|만두국|칼만둣국/;

const MAIN_MEAL_CATEGORY_PATTERN = /국물|찌개|덮밥|면요리|분식|간편식/;

export type SideDishClassifyInput = Pick<
  Recipe,
  'id' | 'name' | 'category' | 'standardMetadata' | 'ingredients'
>;

function hasMainMealStructure(recipe: SideDishClassifyInput): boolean {
  const name = recipe.name;
  const categories = recipe.category;

  if (MAIN_MEAL_NAME_PATTERN.test(name)) return true;
  if (categories.some((category) => MAIN_MEAL_CATEGORY_PATTERN.test(category))) return true;

  const { dishType } = recipe.standardMetadata;
  if (dishType === 'rice' || dishType === 'rice_bowl' || dishType === 'sandwich' || dishType === 'salad') {
    return true;
  }

  if (dishType === 'noodle' || dishType === 'soup') {
    return true;
  }

  if (dishType === 'stew' && !categories.some((category) => SIDE_DISH_CATEGORY_MARKERS.has(category))) {
    return /찌개|전골|찜$/.test(name);
  }

  const hasRiceMain = recipe.ingredients.some(
    (ingredient) => ingredient.group === 'main' && ingredient.iconKey === 'rice',
  );
  if (hasRiceMain) return true;

  return false;
}

function hasSideDishCategorySignals(recipe: SideDishClassifyInput): boolean {
  if (recipe.category.some((category) => SIDE_DISH_CATEGORY_MARKERS.has(category))) {
    return true;
  }

  if (recipe.category.includes('나물') && recipe.category.includes('반찬')) {
    return true;
  }

  const name = recipe.name;
  if (/나물$|무침$/.test(name)) return true;

  return false;
}

export function isSideDishRecipe(recipe: SideDishClassifyInput): boolean {
  if (SIDE_DISH_MAIN_OVERRIDES.has(recipe.id)) return false;
  if (SIDE_DISH_FORCE_IDS.has(recipe.id)) return true;
  if (hasMainMealStructure(recipe)) return false;
  return hasSideDishCategorySignals(recipe);
}

export function recipeHasSideDishCollection(collectionIds: CollectionId[]): boolean {
  return collectionIds.includes('SIDE_DISH');
}

export function recipeHasHomeCollection(collectionIds: CollectionId[]): boolean {
  return collectionIds.includes('HOME');
}
