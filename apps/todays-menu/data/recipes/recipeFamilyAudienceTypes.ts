/**
 * Sprint v1.1 #1 — Family / child audience layer (parallel to standardMetadata).
 *
 * Does not replace `kids_meal`, `kidFriendly`, mealType, spiceLevel, or allergyTags.
 * Home recommendation must keep using the existing fields until a child feed is wired.
 *
 * Medical age cutoffs are intentionally absent. This layer only stores structure
 * and observed signals so later official guidelines can be applied.
 */

import type { StandardAllergyTag, StandardMealType, StandardSpiceLevel } from './recipeStandardMetadataTypes';
import type {
  BabyChokingCautionCode,
  BabyCookingSafetyFlag,
  BabyReviewStatus,
} from './babyFoodPolicyTypes';
import type { ToddlerSafetyReview } from './toddlerSafetyPolicyTypes';

export const RECIPE_AUDIENCES = ['general', 'baby', 'toddler', 'elementary'] as const;
export type RecipeAudience = (typeof RECIPE_AUDIENCES)[number];

export const CHILD_AUDIENCES = ['baby', 'toddler', 'elementary'] as const;
export type ChildRecipeAudience = (typeof CHILD_AUDIENCES)[number];

/**
 * Internal keys only — never show these enums in UI.
 * Official KDCA labels, month-range honesty, and stage↔texture rules live in
 * `babyFoodPolicyTypes.ts`. Do not invent a closed month band for `early`.
 */
export const BABY_FOOD_STAGES = ['early', 'middle', 'late', 'completion'] as const;
export type BabyFoodStage = (typeof BABY_FOOD_STAGES)[number];

/**
 * Catalog textures for babyFood / babySafetyReview only.
 * `family_transition` is 전환기 가족식 형태. Existing recipes do not set this field.
 */
export const BABY_FOOD_TEXTURES = [
  'liquid',
  'thin_puree',
  'thick_puree',
  'mashed',
  'soft_chunks',
  'finger_food',
  'family_transition',
] as const;
export type BabyFoodTexture = (typeof BABY_FOOD_TEXTURES)[number];

/**
 * defaulted: existing general catalog, no kids_meal tag.
 * unclassified: kids_meal (or similar) is present but age was not authored.
 * explicit: a content author set audience / babyFood / childMeal.
 */
export const AUDIENCE_REVIEW_STATUSES = ['defaulted', 'unclassified', 'explicit'] as const;
export type AudienceReviewStatus = (typeof AUDIENCE_REVIEW_STATUSES)[number];

export const CHILD_FEED_COLLISION_FLAGS = [
  'hangover',
  'drinking_snack',
  'late_night',
  'side_dish',
  'spicy',
  'unclassified_kids_meal',
] as const;
export type ChildFeedCollisionFlag = (typeof CHILD_FEED_COLLISION_FLAGS)[number];

/** Observed caution codes — not age rules. */
export const RECIPE_CAUTION_CODES = ['honey_listed', 'fish_bones_possible'] as const;
export type RecipeCautionCode = (typeof RECIPE_CAUTION_CODES)[number];

export const BABY_FOOD_MONTH_RANGE_BOUNDS = ['unspecified', 'around', 'from', 'range'] as const;
export type BabyFoodMonthRangeBound = (typeof BABY_FOOD_MONTH_RANGE_BOUNDS)[number];

/**
 * Honest month-range storage. min/max are optional so 시작기 is not forced
 * into a closed interval and 전환기 can be open-ended.
 * Legacy `{ minMonths, maxMonths }` without `bound` still normalizes to `range`.
 */
export type BabyFoodMonthRange = {
  bound: BabyFoodMonthRangeBound;
  minMonths?: number;
  maxMonths?: number;
};

export type BabyFoodMetadata = {
  stage: BabyFoodStage;
  monthRange: BabyFoodMonthRange;
  texture: BabyFoodTexture | null;
  saltListed: boolean | null;
  sugarListed: boolean | null;
  honeyListed: boolean | null;
};

/**
 * Authored baby safety review. Machines must not write approved/excluded.
 * approved is the only status that may add RecipeAudience baby.
 */
export type BabySafetyReview = {
  reviewStatus: BabyReviewStatus;
  stage: BabyFoodStage;
  monthRange: BabyFoodMonthRange;
  texture: BabyFoodTexture;
  chokingCautions: BabyChokingCautionCode[];
  honeyListed: boolean;
  allergyTagsNoted: string[];
  cookingSafetyFlags: BabyCookingSafetyFlag[];
  requiredChanges: string[];
};

export type ChildMealMetadata = {
  /** Null until an author sets it. Do not infer school-commute rules. */
  schoolMorningFriendly: boolean | null;
  pickyEatingFriendly: boolean | null;
};

export type RecipeSafetySignals = {
  honeyListed: boolean;
  saltListed: boolean;
  sugarListed: boolean;
  spiceLevel: StandardSpiceLevel;
  allergyTags: StandardAllergyTag[];
  cautionCodes: RecipeCautionCode[];
  isMainDish: boolean;
  isSideDish: boolean;
  vegetableListed: boolean;
  proteinListed: boolean;
};

export type RecipeFamilyAudienceMetadata = {
  /** Multiple values allowed, e.g. general + elementary. */
  audiences: RecipeAudience[];
  reviewStatus: AudienceReviewStatus;
  /** True when legacy `kids_meal` situation tag is present. Not an age. */
  kidsMealTag: boolean;
  babyFood: BabyFoodMetadata | null;
  childMeal: ChildMealMetadata | null;
  safetySignals: RecipeSafetySignals;
  collisionFlags: ChildFeedCollisionFlag[];
  /** Authored toddler review. Null = unreviewed. */
  toddlerSafetyReview: ToddlerSafetyReview | null;
  /** Authored baby review. Null = unreviewed. Machines never write approved. */
  babySafetyReview: BabySafetyReview | null;
};

export type RecipeFamilyAudienceOverride = Partial<
  Omit<RecipeFamilyAudienceMetadata, 'safetySignals' | 'collisionFlags' | 'kidsMealTag'>
> & {
  babyFood?: Partial<BabyFoodMetadata> | null;
  childMeal?: Partial<ChildMealMetadata> | null;
};

/** Future weekly-plan records. Not stored on Recipe in this sprint. */
export type WeeklyPlanAudience = RecipeAudience | 'family';

export const WEEKLY_PLAN_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type WeeklyPlanDay = (typeof WEEKLY_PLAN_DAYS)[number];

/**
 * Staple mix for weekly breakfast planning.
 * Derived for weekly-plan only — does not rewrite standardMetadata.dishType.
 */
export const WEEKLY_PLAN_DIVERSITY_CATEGORIES = [
  'rice',
  'bread',
  'oatmeal_cereal',
  'other',
] as const;
export type WeeklyPlanDiversityCategory = (typeof WEEKLY_PLAN_DIVERSITY_CATEGORIES)[number];

export type WeeklyPlanSlot = {
  day: WeeklyPlanDay;
  mealType: StandardMealType;
  recipeId: string;
  recipeName: string;
  time: number;
  schoolMorningFriendly: boolean | null;
  diversityCategory: WeeklyPlanDiversityCategory;
  babyStage?: BabyFoodStage;
};

export type WeeklyMealPlan = {
  id: string;
  audience: WeeklyPlanAudience;
  mealType: StandardMealType;
  seed: string;
  babyStage?: BabyFoodStage;
  slots: WeeklyPlanSlot[];
};

export function isRecipeAudience(value: string): value is RecipeAudience {
  return (RECIPE_AUDIENCES as readonly string[]).includes(value);
}

export function hasChildAudience(audiences: readonly RecipeAudience[]): boolean {
  return audiences.some((audience) => (CHILD_AUDIENCES as readonly string[]).includes(audience));
}
