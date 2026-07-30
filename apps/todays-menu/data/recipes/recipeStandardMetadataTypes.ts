/**
 * Sprint 25 — Standardized recommendation metadata for HANKKI recipes (001–100).
 * Parallel to legacy `tags` / `situation` / `decisionTags`; does not replace them.
 */

export const STANDARD_CUISINES = [
  'korean',
  'chinese',
  'japanese',
  'western',
  'snack',
  'asian',
  'fusion',
  'other',
] as const;
export type StandardCuisine = (typeof STANDARD_CUISINES)[number];

export const STANDARD_DISH_TYPES = [
  'rice',
  'rice_bowl',
  'soup',
  'stew',
  'noodle',
  'stir_fry',
  'grilled',
  'fried',
  'steamed',
  'salad',
  'sandwich',
  'snack',
  'dessert',
  'other',
] as const;
export type StandardDishType = (typeof STANDARD_DISH_TYPES)[number];

export const STANDARD_TASTE_PROFILES = [
  'mild',
  'spicy',
  'savory',
  'sweet',
  'salty',
  'nutty',
  'refreshing',
  'rich',
  'light',
  'sour',
] as const;
export type StandardTasteProfile = (typeof STANDARD_TASTE_PROFILES)[number];

export const STANDARD_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'late_night',
  'snack',
] as const;
export type StandardMealType = (typeof STANDARD_MEAL_TYPES)[number];

export const STANDARD_SITUATION_TAGS = [
  'solo_meal',
  'family_meal',
  'kids_meal',
  'quick_meal',
  'guest_meal',
  'hangover',
  'drinking_snack',
  'diet_meal',
  'comfort_food',
  'cold_day',
  'hot_day',
] as const;
export type StandardSituationTag = (typeof STANDARD_SITUATION_TAGS)[number];

export const STANDARD_COOKING_METHODS = [
  'microwave',
  'air_fryer',
  'frying_pan',
  'pot',
  'oven',
  'no_cook',
  'boiling',
  'grilling',
  'steaming',
] as const;
export type StandardCookingMethod = (typeof STANDARD_COOKING_METHODS)[number];

export const STANDARD_DIETARY_TAGS = [
  'high_protein',
  'low_carb',
  'vegetarian',
  'light_meal',
  'filling_meal',
] as const;
export type StandardDietaryTag = (typeof STANDARD_DIETARY_TAGS)[number];

export const STANDARD_ALLERGY_TAGS = [
  'egg',
  'milk',
  'peanut',
  'nuts',
  'wheat',
  'soy',
  'fish',
  'shellfish',
  'pork',
  'beef',
  'chicken',
] as const;
export type StandardAllergyTag = (typeof STANDARD_ALLERGY_TAGS)[number];

export const STANDARD_SPICE_LEVELS = ['mild', 'medium', 'spicy'] as const;
export type StandardSpiceLevel = (typeof STANDARD_SPICE_LEVELS)[number];

export const STANDARD_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type StandardDifficulty = (typeof STANDARD_DIFFICULTIES)[number];

/** Normalized recommendation metadata attached to each production recipe. */
export type RecipeStandardMetadata = {
  cuisine: StandardCuisine;
  dishType: StandardDishType;
  tasteProfile: StandardTasteProfile[];
  mealTypes: StandardMealType[];
  situationTags: StandardSituationTag[];
  cookingMethods: StandardCookingMethod[];
  dietaryTags: StandardDietaryTag[];
  /** Main-ingredient icon keys from `ingredients` (group === main). */
  mainIngredients: string[];
  allergyTags: StandardAllergyTag[];
  spiceLevel: StandardSpiceLevel;
  cookingTime: number;
  servings: number;
  difficulty: StandardDifficulty;
  reviewNeeded: boolean;
  /** Why manual review is suggested (empty when reviewNeeded is false). */
  reviewNotes: string[];
};

export type RecipeStandardMetadataOverride = Partial<
  Omit<RecipeStandardMetadata, 'reviewNotes'>
> & {
  reviewNotes?: string[];
  /** When true, keeps auto-derived review notes and appends overrides. */
  appendReviewNotes?: boolean;
};
