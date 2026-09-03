/**
 * Derive family-audience metadata from existing recipe fields.
 * Never assigns baby / toddler / elementary unless an explicit override does.
 */
import { isSideDishRecipe } from './sideDishPolicy';
import { RECIPE_FAMILY_AUDIENCE_OVERRIDES } from './recipeFamilyAudienceOverrides';
import { isToddlerCandidateReviewId, TODDLER_CANDIDATE_REVIEWS } from './toddlerCandidateReviews';
import {
  normalizeBabyFoodMonthRange,
  officialMonthRangeForStage,
} from './babyFoodPolicyTypes';
import type {
  AudienceReviewStatus,
  BabyFoodMetadata,
  BabySafetyReview,
  ChildFeedCollisionFlag,
  ChildMealMetadata,
  RecipeAudience,
  RecipeCautionCode,
  RecipeFamilyAudienceMetadata,
  RecipeFamilyAudienceOverride,
  RecipeSafetySignals,
} from './recipeFamilyAudienceTypes';
import { hasChildAudience, RECIPE_AUDIENCES } from './recipeFamilyAudienceTypes';
import type { RecipeStandardMetadata } from './recipeStandardMetadataTypes';
import type { ToddlerSafetyReview } from './toddlerSafetyPolicyTypes';
import type { RecipeIngredient } from './types';

const PROTEIN_ICON_KEYS = new Set([
  'pork',
  'beef',
  'chicken',
  'ham',
  'egg',
  'tofu',
  'fried_tofu',
  'fish',
  'fish_generic',
  'tuna',
  'salmon',
  'mackerel',
  'anchovy',
  'fish_cake',
  'squid',
  'shrimp',
  'octopus',
]);

const VEGETABLE_ICON_KEYS = new Set([
  'onion',
  'green_onion',
  'carrot',
  'potato',
  'cabbage',
  'spinach',
  'mushroom',
  'zucchini',
  'cucumber',
  'lettuce',
  'broccoli',
  'pepper',
  'garlic',
  'kimchi',
  'bean_sprout',
  'seaweed',
]);

const FISH_BONE_ICON_KEYS = new Set(['mackerel', 'fish', 'fish_generic', 'anchovy', 'salmon']);

export type FamilyAudienceDeriveSource = {
  id: string;
  name: string;
  category: string[];
  ingredients: RecipeIngredient[];
  standardMetadata: RecipeStandardMetadata;
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function listedInIngredients(ingredients: RecipeIngredient[], pattern: RegExp): boolean {
  return ingredients.some((item) => pattern.test(item.name));
}

function deriveSafetySignals(source: FamilyAudienceDeriveSource): RecipeSafetySignals {
  const { ingredients, standardMetadata } = source;
  const honeyListed = listedInIngredients(ingredients, /꿀/);
  const saltListed = listedInIngredients(ingredients, /소금/);
  const sugarListed = listedInIngredients(ingredients, /설탕/);
  const cautionCodes: RecipeCautionCode[] = [];
  if (honeyListed) cautionCodes.push('honey_listed');
  if (ingredients.some((item) => FISH_BONE_ICON_KEYS.has(item.iconKey))) {
    cautionCodes.push('fish_bones_possible');
  }

  const isSideDish = isSideDishRecipe(source);
  return {
    honeyListed,
    saltListed,
    sugarListed,
    spiceLevel: standardMetadata.spiceLevel,
    allergyTags: [...standardMetadata.allergyTags],
    cautionCodes,
    isMainDish: !isSideDish,
    isSideDish,
    vegetableListed: ingredients.some((item) => VEGETABLE_ICON_KEYS.has(item.iconKey)),
    proteinListed: ingredients.some((item) => PROTEIN_ICON_KEYS.has(item.iconKey)),
  };
}

function deriveCollisionFlags(input: {
  kidsMealTag: boolean;
  reviewStatus: AudienceReviewStatus;
  audiences: RecipeAudience[];
  standardMetadata: RecipeStandardMetadata;
  isSideDish: boolean;
}): ChildFeedCollisionFlag[] {
  const flags: ChildFeedCollisionFlag[] = [];
  const { standardMetadata } = input;
  if (standardMetadata.situationTags.includes('hangover')) flags.push('hangover');
  if (standardMetadata.situationTags.includes('drinking_snack')) flags.push('drinking_snack');
  if (standardMetadata.mealTypes.includes('late_night')) flags.push('late_night');
  if (input.isSideDish) flags.push('side_dish');
  if (standardMetadata.spiceLevel === 'spicy') flags.push('spicy');
  if (input.kidsMealTag && input.reviewStatus === 'unclassified' && !hasChildAudience(input.audiences)) {
    flags.push('unclassified_kids_meal');
  }
  return unique(flags);
}

function normalizeAudiences(audiences: RecipeAudience[] | undefined): RecipeAudience[] {
  const next = unique((audiences ?? []).filter((item) => RECIPE_AUDIENCES.includes(item)));
  return next.length > 0 ? next : (['general'] as RecipeAudience[]);
}

function mergeBabyFood(
  audiences: RecipeAudience[],
  override: RecipeFamilyAudienceOverride | undefined,
): BabyFoodMetadata | null {
  if (!audiences.includes('baby')) return null;
  const baby = override?.babyFood;
  if (!baby || !baby.stage) return null;
  return {
    stage: baby.stage,
    monthRange: baby.monthRange
      ? normalizeBabyFoodMonthRange(baby.monthRange)
      : officialMonthRangeForStage(baby.stage),
    texture: baby.texture ?? null,
    saltListed: baby.saltListed ?? null,
    sugarListed: baby.sugarListed ?? null,
    honeyListed: baby.honeyListed ?? null,
  };
}

function mergeBabySafetyReview(
  override: RecipeFamilyAudienceOverride | undefined,
): BabySafetyReview | null {
  return override?.babySafetyReview ?? null;
}

function mergeChildMeal(
  audiences: RecipeAudience[],
  override: RecipeFamilyAudienceOverride | undefined,
): ChildMealMetadata | null {
  if (!audiences.includes('toddler') && !audiences.includes('elementary')) return null;
  return {
    schoolMorningFriendly: override?.childMeal?.schoolMorningFriendly ?? null,
    pickyEatingFriendly: override?.childMeal?.pickyEatingFriendly ?? null,
  };
}

function mergeToddlerSafetyReview(
  sourceId: string,
  override: RecipeFamilyAudienceOverride | undefined,
): ToddlerSafetyReview | null {
  if (override?.toddlerSafetyReview !== undefined) {
    return override.toddlerSafetyReview;
  }
  if (isToddlerCandidateReviewId(sourceId)) {
    return TODDLER_CANDIDATE_REVIEWS[sourceId];
  }
  return null;
}

export function deriveRecipeFamilyAudience(
  source: FamilyAudienceDeriveSource,
  override: RecipeFamilyAudienceOverride = RECIPE_FAMILY_AUDIENCE_OVERRIDES[source.id] ?? {},
): RecipeFamilyAudienceMetadata {
  const kidsMealTag = source.standardMetadata.situationTags.includes('kids_meal');
  const authoredChild =
    hasChildAudience(override.audiences ?? []) ||
    Boolean(override.babyFood) ||
    Boolean(override.childMeal) ||
    override.reviewStatus === 'explicit';
  const audiences = normalizeAudiences(override.audiences);

  let reviewStatus: AudienceReviewStatus;
  if (override.reviewStatus) {
    reviewStatus = override.reviewStatus;
  } else if (authoredChild) {
    reviewStatus = 'explicit';
  } else if (kidsMealTag) {
    reviewStatus = 'unclassified';
  } else {
    reviewStatus = 'defaulted';
  }

  const safetySignals = deriveSafetySignals(source);
  return {
    audiences,
    reviewStatus,
    kidsMealTag,
    babyFood: mergeBabyFood(audiences, override),
    childMeal: mergeChildMeal(audiences, override),
    safetySignals,
    collisionFlags: deriveCollisionFlags({
      kidsMealTag,
      reviewStatus,
      audiences,
      standardMetadata: source.standardMetadata,
      isSideDish: safetySignals.isSideDish,
    }),
    toddlerSafetyReview: mergeToddlerSafetyReview(source.id, override),
    babySafetyReview: mergeBabySafetyReview(override),
  };
}
