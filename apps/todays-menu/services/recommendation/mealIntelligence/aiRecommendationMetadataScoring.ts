import type {
  RecipeStandardMetadata,
  StandardCuisine,
  StandardDishType,
  StandardMealType,
  StandardSituationTag,
} from '../../../data/recipes/recipeStandardMetadataTypes';
import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type {
  AiRecommendationSettings,
  HouseholdSize,
  PreferredCuisine,
  SpicyTolerance,
} from '../../../types/aiRecommendationSettings';
import type { MealType } from '../../../types/home';
import type { MetadataScoreHit } from '../../../types/mealIntelligenceEngine';
import { explicitCookTimeLimitMinutes } from '../cookTimePreference';
import { resolveMenuAiRecipeContext } from './resolveMenuStandardMetadata';
import {
  buildFavoriteIngredientReason,
  buildFavoriteTokens,
  findFavoriteIngredientMatches,
} from './aiRecommendationIngredientMatch';

/** Metadata preference weights — capped so legacy HMIE signals still matter. */
export const METADATA_SCORE_POINTS = {
  cuisine: 10,
  dishType: 8,
  tasteProfile: 6,
  spiceLevel: 5,
  cookTimeUnder: 6,
  cookTimeOver: -5,
  servings: 6,
  mealType: 5,
  situation: 6,
  dietary: 5,
  favoriteIngredient: 8,
} as const;

export type MetadataScoreResult = {
  total: number;
  hits: MetadataScoreHit[];
  notes: string[];
  usedSettings: Partial<AiRecommendationSettings>;
  usedMetadata: Partial<RecipeStandardMetadata> | null;
};

const CUISINE_LABELS: Record<StandardCuisine, string> = {
  korean: '한식',
  chinese: '중식',
  japanese: '일식',
  western: '양식',
  snack: '분식',
  asian: '아시안',
  fusion: '퓨전',
  other: '이 메뉴',
};

const DISH_TYPE_LABELS: Record<StandardDishType, string> = {
  rice: '밥 요리',
  rice_bowl: '덮밥',
  soup: '국물 요리',
  stew: '찌개·탕',
  noodle: '면 요리',
  stir_fry: '볶음 요리',
  grilled: '구이',
  fried: '튀김',
  steamed: '찜 요리',
  salad: '샐러드',
  sandwich: '샌드위치',
  snack: '간식',
  dessert: '디저트',
  other: '한 끼',
};

const SITUATION_LABELS: Record<StandardSituationTag, string> = {
  solo_meal: '혼자 먹기 좋은',
  family_meal: '가족이 함께 먹기 좋은',
  kids_meal: '아이 식단에 어울리는',
  quick_meal: '빠르게 만들 수 있는',
  guest_meal: '손님 초대용',
  hangover: '해장에 어울리는',
  drinking_snack: '안주로 좋은',
  diet_meal: '가벼운 식사',
  comfort_food: '든든한 집밥',
  cold_day: '쌀쌀한 날에 어울리는',
  hot_day: '더운 날에 어울리는',
};

function hasAnySettings(settings: AiRecommendationSettings): boolean {
  return (
    settings.spicyLevel !== null ||
    settings.preferredCuisines.length > 0 ||
    settings.avoidedFoods.length > 0 ||
    settings.customAvoidedFood.trim().length > 0 ||
    settings.customFavoriteFood.trim().length > 0 ||
    settings.householdSize !== null ||
    settings.maxCookTime !== null
  );
}

function mapMealTypeToStandard(mealType: MealType): StandardMealType {
  if (mealType === 'late_night') return 'late_night';
  return mealType;
}

function targetServings(household: HouseholdSize): number {
  switch (household) {
    case 'solo':
      return 1;
    case 'two':
      return 2;
    case 'three_four':
      return 3;
    case 'family':
      return 4;
    default:
      return 2;
  }
}

function situationTagsForHousehold(household: HouseholdSize): StandardSituationTag[] {
  switch (household) {
    case 'solo':
      return ['solo_meal', 'quick_meal'];
    case 'family':
      return ['family_meal'];
    case 'three_four':
      return ['family_meal'];
    default:
      return [];
  }
}

function scoreCuisine(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  let points = 0;
  const preferred = settings.preferredCuisines;
  if (preferred.length === 0) return 0;

  for (const cuisine of preferred) {
    if (cuisine === 'healthy') {
      if (
        metadata.dietaryTags.includes('light_meal') ||
        metadata.dietaryTags.includes('vegetarian') ||
        metadata.dietaryTags.includes('low_carb')
      ) {
        points = Math.max(points, METADATA_SCORE_POINTS.dietary);
        hits.push({
          key: 'cuisine_healthy',
          points: METADATA_SCORE_POINTS.dietary,
          dimension: 'dietary',
          label: '가벼운 식사 취향에 맞는 메뉴예요.',
        });
        notes.push('metadata_cuisine_healthy');
      }
      continue;
    }

    if (metadata.cuisine === cuisine) {
      points = Math.max(points, METADATA_SCORE_POINTS.cuisine);
      hits.push({
        key: `cuisine_${cuisine}`,
        points: METADATA_SCORE_POINTS.cuisine,
        dimension: 'cuisine',
        label: `선호하는 ${CUISINE_LABELS[cuisine]} 메뉴로 골라봤어요.`,
      });
      notes.push(`metadata_cuisine_${cuisine}`);
    }
  }

  return points;
}

function scoreDishType(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  if (!settings.preferredCuisines.includes('snack')) return 0;
  if (metadata.dishType !== 'snack' && metadata.cuisine !== 'snack') return 0;

  hits.push({
    key: 'dish_snack',
    points: METADATA_SCORE_POINTS.dishType,
    dimension: 'dishType',
    label: '분식·간식 취향에 맞는 메뉴예요.',
  });
  notes.push('metadata_dish_snack');
  return METADATA_SCORE_POINTS.dishType;
}

function scoreTasteAndSpice(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  let points = 0;

  if (settings.spicyLevel === 'like') {
    if (metadata.spiceLevel === 'spicy' || metadata.tasteProfile.includes('spicy')) {
      points += METADATA_SCORE_POINTS.spiceLevel;
      hits.push({
        key: 'spice_like',
        points: METADATA_SCORE_POINTS.spiceLevel,
        dimension: 'spiceLevel',
        label: '매운맛을 좋아하셔서 골라봤어요.',
      });
      notes.push('metadata_spice_like');
    }
  }

  if (settings.spicyLevel === 'dislike') {
    if (metadata.spiceLevel === 'mild' || metadata.tasteProfile.includes('mild')) {
      points += METADATA_SCORE_POINTS.tasteProfile;
      hits.push({
        key: 'taste_mild',
        points: METADATA_SCORE_POINTS.tasteProfile,
        dimension: 'tasteProfile',
        label: '담백한 맛을 선호해서 골라봤어요.',
      });
      notes.push('metadata_taste_mild');
    }
  }

  if (settings.spicyLevel === 'normal' && metadata.spiceLevel === 'medium') {
    points += METADATA_SCORE_POINTS.spiceLevel;
    hits.push({
      key: 'spice_normal',
      points: METADATA_SCORE_POINTS.spiceLevel,
      dimension: 'spiceLevel',
      label: '적당한 매운맛의 메뉴예요.',
    });
    notes.push('metadata_spice_normal');
  }

  return points;
}

function scoreCookTime(
  menu: MenuItem,
  context: RecommendationContext | undefined,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  const limit = explicitCookTimeLimitMinutes(context);
  const cookTime = metadata.cookingTime || menu.cookTime;
  if (limit === null) return 0;

  if (cookTime <= limit) {
    hits.push({
      key: 'cook_time_under',
      points: METADATA_SCORE_POINTS.cookTimeUnder,
      dimension: 'cookTimeUnder',
      label: `${limit}분 안에 만들 수 있는 간단한 메뉴예요.`,
    });
    notes.push('metadata_cook_time_under');
    return METADATA_SCORE_POINTS.cookTimeUnder;
  }

  hits.push({
    key: 'cook_time_over',
    points: METADATA_SCORE_POINTS.cookTimeOver,
    dimension: 'cookTimeOver',
    label: `${limit}분보다 조금 더 걸릴 수 있어요.`,
  });
  notes.push('metadata_cook_time_over');
  return METADATA_SCORE_POINTS.cookTimeOver;
}

function scoreServings(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  if (!settings.householdSize) return 0;

  const target = targetServings(settings.householdSize);
  const diff = Math.abs(metadata.servings - target);
  if (diff === 0) {
    const label =
      target === 1
        ? '혼자 먹기 좋은 1인분 메뉴예요.'
        : `${target}인분에 맞는 메뉴예요.`;
    hits.push({
      key: 'servings_exact',
      points: METADATA_SCORE_POINTS.servings,
      dimension: 'servings',
      label,
    });
    notes.push('metadata_servings_exact');
    return METADATA_SCORE_POINTS.servings;
  }

  if (diff === 1) {
    hits.push({
      key: 'servings_close',
      points: Math.round(METADATA_SCORE_POINTS.servings / 2),
      dimension: 'servings',
      label: '식사 인원에 가까운 분량이에요.',
    });
    notes.push('metadata_servings_close');
    return Math.round(METADATA_SCORE_POINTS.servings / 2);
  }

  return 0;
}

function scoreMealType(
  metadata: RecipeStandardMetadata,
  mealType: MealType,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  const standard = mapMealTypeToStandard(mealType);
  if (!metadata.mealTypes.includes(standard)) return 0;

  const slotLabel =
    mealType === 'breakfast'
      ? '아침'
      : mealType === 'lunch'
        ? '점심'
        : mealType === 'dinner'
          ? '저녁'
          : '야식';

  hits.push({
    key: `meal_type_${standard}`,
    points: METADATA_SCORE_POINTS.mealType,
    dimension: 'mealType',
    label: `${slotLabel} 시간에 잘 맞는 메뉴예요.`,
  });
  notes.push(`metadata_meal_type_${standard}`);
  return METADATA_SCORE_POINTS.mealType;
}

function scoreSituation(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  if (!settings.householdSize) return 0;

  const targets = situationTagsForHousehold(settings.householdSize);
  const matched = targets.find((tag) => metadata.situationTags.includes(tag));
  if (!matched) return 0;

  hits.push({
    key: `situation_${matched}`,
    points: METADATA_SCORE_POINTS.situation,
    dimension: 'situation',
    label: `${SITUATION_LABELS[matched]} 메뉴예요.`,
  });
  notes.push(`metadata_situation_${matched}`);
  return METADATA_SCORE_POINTS.situation;
}

function scoreDishTypeFromCuisine(
  settings: AiRecommendationSettings,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  const cuisinePrefs = settings.preferredCuisines.filter(
    (item): item is Exclude<PreferredCuisine, 'healthy'> => item !== 'healthy',
  );
  if (cuisinePrefs.length === 0) return 0;

  const noodleCuisines: StandardCuisine[] = ['japanese', 'chinese'];
  const wantsNoodle = cuisinePrefs.some((c) => noodleCuisines.includes(c as StandardCuisine));
  if (wantsNoodle && metadata.dishType === 'noodle') {
    hits.push({
      key: 'dish_noodle',
      points: METADATA_SCORE_POINTS.dishType,
      dimension: 'dishType',
      label: '좋아하는 면 요리 중에서 추천했어요.',
    });
    notes.push('metadata_dish_noodle');
    return METADATA_SCORE_POINTS.dishType;
  }

  const wantsRice = cuisinePrefs.includes('korean');
  if (wantsRice && (metadata.dishType === 'rice' || metadata.dishType === 'rice_bowl')) {
    hits.push({
      key: 'dish_rice',
      points: METADATA_SCORE_POINTS.dishType,
      dimension: 'dishType',
      label: '밥 메뉴 취향에 맞춰 골라봤어요.',
    });
    notes.push('metadata_dish_rice');
    return METADATA_SCORE_POINTS.dishType;
  }

  return 0;
}

function scoreFavoriteIngredients(
  settings: AiRecommendationSettings,
  recipe: NonNullable<ReturnType<typeof resolveMenuAiRecipeContext>['recipe']>,
  metadata: RecipeStandardMetadata,
  hits: MetadataScoreHit[],
  notes: string[],
): number {
  const favoriteTokens = buildFavoriteTokens(settings);
  if (favoriteTokens.length === 0) return 0;

  const matches = findFavoriteIngredientMatches(recipe, metadata, favoriteTokens);
  if (matches.length === 0) return 0;

  const match = matches[0];
  hits.push({
    key: `favorite_ingredient_${match.iconKey}`,
    points: METADATA_SCORE_POINTS.favoriteIngredient,
    dimension: 'mainIngredients',
    label: buildFavoriteIngredientReason(match),
  });
  notes.push(`metadata_favorite_ingredient_${match.iconKey}`);
  return METADATA_SCORE_POINTS.favoriteIngredient;
}

export function scoreMetadataPreferences(
  menu: MenuItem,
  mealType: MealType,
  context?: RecommendationContext,
): MetadataScoreResult {
  const settings = context?.aiRecommendationSettings;
  const empty: MetadataScoreResult = {
    total: 0,
    hits: [],
    notes: [],
    usedSettings: {},
    usedMetadata: null,
  };

  if (!settings || !hasAnySettings(settings)) return empty;

  const { recipe, metadata } = resolveMenuAiRecipeContext(menu);
  if (!metadata) {
    return {
      ...empty,
      usedSettings: settings,
      usedMetadata: null,
    };
  }

  const hits: MetadataScoreHit[] = [];
  const notes: string[] = [];
  let total = 0;

  total += scoreCuisine(settings, metadata, hits, notes);
  total += scoreDishType(settings, metadata, hits, notes);
  total += scoreDishTypeFromCuisine(settings, metadata, hits, notes);
  total += scoreTasteAndSpice(settings, metadata, hits, notes);
  total += scoreCookTime(menu, context, metadata, hits, notes);
  total += scoreServings(settings, metadata, hits, notes);
  total += scoreMealType(metadata, mealType, hits, notes);
  total += scoreSituation(settings, metadata, hits, notes);
  if (recipe) {
    total += scoreFavoriteIngredients(settings, recipe, metadata, hits, notes);
  }

  if (settings.preferredCuisines.includes('healthy')) {
    if (metadata.dietaryTags.includes('light_meal')) {
      total += METADATA_SCORE_POINTS.dietary;
      if (!hits.some((hit) => hit.key === 'cuisine_healthy')) {
        hits.push({
          key: 'dietary_light',
          points: METADATA_SCORE_POINTS.dietary,
          dimension: 'dietary',
          label: '가벼운 식사에 어울리는 메뉴예요.',
        });
        notes.push('metadata_dietary_light');
      }
    }
    if (metadata.dietaryTags.includes('filling_meal')) {
      total -= Math.round(METADATA_SCORE_POINTS.dietary / 2);
      notes.push('metadata_dietary_heavy_penalty');
    }
  }

  return {
    total,
    hits: hits.sort((a, b) => b.points - a.points || a.key.localeCompare(b.key)),
    notes,
    usedSettings: settings,
    usedMetadata: metadata,
  };
}

export function pickPrimaryMetadataReason(
  hits: MetadataScoreHit[],
  menuId: string,
): MetadataScoreHit | null {
  const positive = hits.filter((hit) => hit.points > 0);
  if (positive.length === 0) return null;

  const seed = menuId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = seed % positive.length;
  return positive[index] ?? positive[0];
}
