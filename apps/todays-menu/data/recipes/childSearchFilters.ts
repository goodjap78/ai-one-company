/**
 * Child-context search filters — runtime derivation only (no recipe edits).
 * User-facing labels only; internal enums never shown in UI.
 */
import {
  classifyBabyBatchCooking,
  classifyBabyPortionScaling,
} from './babyPortionScaling';
import { classifyWeeklyPlanDiversity } from './elementaryBreakfastWeeklyPlan';
import type { StandardAllergyTag } from './recipeStandardMetadataTypes';
import type { Recipe } from './types';

export type BabyMainIngredientFilter =
  | 'beef'
  | 'chicken'
  | 'tofu'
  | 'egg'
  | 'fish'
  | 'vegetable'
  | 'fruit';

export type BabyTextureFilter =
  | 'thin_puree'
  | 'thick_puree'
  | 'porridge'
  | 'mashed_rice'
  | 'family_transition'
  | 'finger_food';

export type ToddlerMainIngredientFilter = 'beef' | 'chicken' | 'tofu' | 'egg' | 'fish';

export type ToddlerFormFilter = 'soup' | 'fried_rice' | 'rice_bowl';

export type ElementaryMealSlotFilter =
  | 'breakfast'
  | 'lunch_box'
  | 'dinner'
  | 'after_school_snack';

export type ElementaryMainIngredientFilter =
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'tuna'
  | 'tofu';

export type ElementaryFormFilter =
  | 'rice_ball'
  | 'kimbap'
  | 'toast'
  | 'rice_bowl'
  | 'fried_rice'
  | 'tortilla'
  | 'snack';

export type BabySearchFilterState = {
  mainIngredient: BabyMainIngredientFilter | null;
  texture: BabyTextureFilter | null;
  batchFriendly: boolean;
  scalableOnly: boolean;
  excludeAllergy: StandardAllergyTag | null;
};

export type ToddlerSearchFilterState = {
  maxMinutes: 10 | 15 | 20 | null;
  mainIngredient: ToddlerMainIngredientFilter | null;
  excludeAllergy: StandardAllergyTag | null;
  form: ToddlerFormFilter | null;
};

export type ElementarySearchFilterState = {
  mealSlot: ElementaryMealSlotFilter | null;
  maxMinutes: 10 | 15 | 20 | null;
  mainIngredient: ElementaryMainIngredientFilter | null;
  form: ElementaryFormFilter | null;
};

export const EMPTY_BABY_FILTERS: BabySearchFilterState = {
  mainIngredient: null,
  texture: null,
  batchFriendly: false,
  scalableOnly: false,
  excludeAllergy: null,
};

export const EMPTY_TODDLER_FILTERS: ToddlerSearchFilterState = {
  maxMinutes: null,
  mainIngredient: null,
  excludeAllergy: null,
  form: null,
};

export const EMPTY_ELEMENTARY_FILTERS: ElementarySearchFilterState = {
  mealSlot: null,
  maxMinutes: null,
  mainIngredient: null,
  form: null,
};

const BEEF = /소고기|쇠고기/;
const CHICKEN = /닭|닭고기/;
const TOFU = /두부/;
const EGG = /계란|달걀|에그/;
const FISH = /생선|연어|고등어|명태|대구|참치/;
const TUNA = /참치|캔참치/;
const VEG =
  /브로콜리|당근|시금치|애호박|호박|감자|양파|채소|시금|부추|콩나물|버섯|가지|오이|배추/;
const FRUIT = /사과|바나나|배|과일|블루베리|딸기|키위|포도/;

function recipeTextBlob(recipe: Recipe): string {
  const seasoningNames = recipe.ingredients
    .filter((item) => item.group === 'seasoning')
    .map((item) => item.name);
  const subNames = recipe.ingredients.filter((item) => item.group === 'sub').map((item) => item.name);
  const mainNames = recipe.ingredients.filter((item) => item.group === 'main').map((item) => item.name);
  return [
    recipe.name,
    ...recipe.category,
    ...recipe.searchTags,
    ...mainNames,
    ...subNames,
    ...seasoningNames,
    ...recipe.standardMetadata.mealTypes,
  ].join(' ');
}

function textHas(pattern: RegExp, recipe: Recipe): boolean {
  return pattern.test(recipeTextBlob(recipe));
}

function matchesMainIngredient(
  filter: BabyMainIngredientFilter | ToddlerMainIngredientFilter | ElementaryMainIngredientFilter,
  recipe: Recipe,
): boolean {
  switch (filter) {
    case 'beef':
      return textHas(BEEF, recipe);
    case 'chicken':
      return textHas(CHICKEN, recipe);
    case 'tofu':
      return textHas(TOFU, recipe);
    case 'egg':
      return textHas(EGG, recipe);
    case 'fish':
      return textHas(FISH, recipe) && !textHas(TUNA, recipe);
    case 'tuna':
      return textHas(TUNA, recipe);
    case 'vegetable':
      return textHas(VEG, recipe);
    case 'fruit':
      return textHas(FRUIT, recipe);
    default:
      return false;
  }
}

export function matchesBabyTextureFilter(recipe: Recipe, filter: BabyTextureFilter): boolean {
  const texture = recipe.familyAudience.babyFood?.texture;
  const name = recipe.name;
  switch (filter) {
    case 'thin_puree':
      return texture === 'thin_puree' || texture === 'liquid' || /미음/.test(name);
    case 'thick_puree':
      return texture === 'thick_puree' || /퓌레/.test(name);
    case 'porridge':
      return /죽/.test(name) && texture !== 'family_transition';
    case 'mashed_rice':
      return texture === 'mashed' || /무른밥/.test(name);
    case 'family_transition':
      return texture === 'family_transition' || /진밥|국밥/.test(name);
    case 'finger_food':
      return texture === 'finger_food' || /핑거|손가락/.test(name);
    default:
      return false;
  }
}

export function matchesToddlerFormFilter(recipe: Recipe, filter: ToddlerFormFilter): boolean {
  const text = recipeTextBlob(recipe);
  switch (filter) {
    case 'soup':
      return /국$|국밥|탕$|찌개/.test(text);
    case 'fried_rice':
      return /볶음밥/.test(text);
    case 'rice_bowl':
      return /덮밥/.test(text);
    default:
      return false;
  }
}

export function matchesElementaryMealSlot(
  recipe: Recipe,
  slot: ElementaryMealSlotFilter,
): boolean {
  const mealTypes = recipe.standardMetadata.mealTypes;
  const text = recipeTextBlob(recipe);
  switch (slot) {
    case 'breakfast':
      return mealTypes.includes('breakfast');
    case 'lunch_box':
      return (
        mealTypes.includes('lunch') ||
        /도시락|김밥|샌드위치|주먹밥/.test(text)
      );
    case 'dinner':
      return mealTypes.includes('dinner');
    case 'after_school_snack':
      return mealTypes.includes('snack') || /간식|방과후/.test(text);
    default:
      return false;
  }
}

export function matchesElementaryFormFilter(
  recipe: Recipe,
  filter: ElementaryFormFilter,
): boolean {
  const text = recipeTextBlob(recipe);
  const { formGroup } = classifyWeeklyPlanDiversity(recipe);
  switch (filter) {
    case 'rice_ball':
      return formGroup === 'rice_ball' || /주먹밥|밥버거/.test(text);
    case 'kimbap':
      return /김밥/.test(text);
    case 'toast':
      return formGroup === 'sandwich_toast' || /토스트|샌드위치|프렌치토스트/.test(text);
    case 'rice_bowl':
      return /덮밥/.test(text);
    case 'fried_rice':
      return /볶음밥/.test(text);
    case 'tortilla':
      return /또띠아|토르티야|랩/.test(text);
    case 'snack':
      return recipe.standardMetadata.mealTypes.includes('snack') || /간식/.test(text);
    default:
      return false;
  }
}

export function applyBabyFilters(
  recipe: Recipe,
  filters: BabySearchFilterState,
): boolean {
  if (filters.mainIngredient && !matchesMainIngredient(filters.mainIngredient, recipe)) {
    return false;
  }
  if (filters.texture && !matchesBabyTextureFilter(recipe, filters.texture)) {
    return false;
  }
  if (filters.batchFriendly && classifyBabyBatchCooking(recipe) !== 'friendly') {
    return false;
  }
  if (filters.scalableOnly && classifyBabyPortionScaling(recipe) !== 'scalable') {
    return false;
  }
  if (
    filters.excludeAllergy &&
    recipe.standardMetadata.allergyTags.includes(filters.excludeAllergy)
  ) {
    return false;
  }
  return true;
}

export function applyToddlerFilters(
  recipe: Recipe,
  filters: ToddlerSearchFilterState,
): boolean {
  if (filters.maxMinutes != null && recipe.time > filters.maxMinutes) {
    return false;
  }
  if (filters.mainIngredient && !matchesMainIngredient(filters.mainIngredient, recipe)) {
    return false;
  }
  if (
    filters.excludeAllergy &&
    recipe.standardMetadata.allergyTags.includes(filters.excludeAllergy)
  ) {
    return false;
  }
  if (filters.form && !matchesToddlerFormFilter(recipe, filters.form)) {
    return false;
  }
  return true;
}

export function applyElementaryFilters(
  recipe: Recipe,
  filters: ElementarySearchFilterState,
): boolean {
  if (filters.mealSlot && !matchesElementaryMealSlot(recipe, filters.mealSlot)) {
    return false;
  }
  if (filters.maxMinutes != null && recipe.time > filters.maxMinutes) {
    return false;
  }
  if (filters.mainIngredient && !matchesMainIngredient(filters.mainIngredient, recipe)) {
    return false;
  }
  if (filters.form && !matchesElementaryFormFilter(recipe, filters.form)) {
    return false;
  }
  return true;
}

export function countActiveBabyFilters(filters: BabySearchFilterState): number {
  let count = 0;
  if (filters.mainIngredient) count += 1;
  if (filters.texture) count += 1;
  if (filters.batchFriendly) count += 1;
  if (filters.scalableOnly) count += 1;
  if (filters.excludeAllergy) count += 1;
  return count;
}

export function countActiveToddlerFilters(filters: ToddlerSearchFilterState): number {
  let count = 0;
  if (filters.maxMinutes) count += 1;
  if (filters.mainIngredient) count += 1;
  if (filters.excludeAllergy) count += 1;
  if (filters.form) count += 1;
  return count;
}

export function countActiveElementaryFilters(filters: ElementarySearchFilterState): number {
  let count = 0;
  if (filters.mealSlot) count += 1;
  if (filters.maxMinutes) count += 1;
  if (filters.mainIngredient) count += 1;
  if (filters.form) count += 1;
  return count;
}

export function babyFilterTypeKeys(filters: BabySearchFilterState): string[] {
  const keys: string[] = [];
  if (filters.mainIngredient) keys.push('main_ingredient');
  if (filters.texture) keys.push('texture');
  if (filters.batchFriendly) keys.push('batch');
  if (filters.scalableOnly) keys.push('scalable');
  if (filters.excludeAllergy) keys.push('allergy');
  return keys;
}

export function toddlerFilterTypeKeys(filters: ToddlerSearchFilterState): string[] {
  const keys: string[] = [];
  if (filters.maxMinutes) keys.push('time');
  if (filters.mainIngredient) keys.push('main_ingredient');
  if (filters.excludeAllergy) keys.push('allergy');
  if (filters.form) keys.push('form');
  return keys;
}

export function elementaryFilterTypeKeys(filters: ElementarySearchFilterState): string[] {
  const keys: string[] = [];
  if (filters.mealSlot) keys.push('meal_slot');
  if (filters.maxMinutes) keys.push('time');
  if (filters.mainIngredient) keys.push('main_ingredient');
  if (filters.form) keys.push('form');
  return keys;
}

export function buildChildSearchBlob(recipe: Recipe): string {
  return recipeTextBlob(recipe);
}

export function matchesChildSearchQuery(recipe: Recipe, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return buildChildSearchBlob(recipe).toLowerCase().includes(trimmed.toLowerCase());
}
