import type { PreferenceSeason } from '../../../types/preference';
import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type {
  MealScoreBreakdown,
  MealSituationSnapshot,
  SmartScoreReasonHit,
} from '../../../types/mealIntelligenceEngine';
import type { CookingSkill } from '../../../types/userProfile';
import type { FoodMemoryCategory } from '../../../types/foodMemory';
import { menuMatchesMealType } from '../../../data/recipes/constants';
import { RECENT_MEAL_WINDOW_DAYS } from '../../MealHistoryService';
import { getRecipeById } from '../../recipe/mockRecipeDetails';
import { menuToFoodMemoryCategory } from '../../memory/foodMemory';
import { resolveMealFoodMeta } from '../../memory/foodMemory';
import { resolveMealDna } from './mealDna';
import { classifyMealArchetypes } from './mealProfile';
import { menuCuisineFromId } from './mealProfile';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from './mealKnowledge';
import { cookTimeFits } from '../cookTimePreference';
import { evaluateAiRecommendationExclusions } from './aiRecommendationExclusions';
import {
  scoreMetadataPreferences,
  METADATA_SCORE_POINTS,
} from './aiRecommendationMetadataScoring';
import { resolveMenuAiRecipeContext } from './resolveMenuStandardMetadata';

/** Sprint 21.5 — HANKKI AI Recommendation Engine v1 point table. */
export const SMART_SCORE_POINTS = {
  mealTime: 20,
  weather: 20,
  season: 15,
  favorite: 15,
  notEatenRecently: 20,
  cookTimeFit: 10,
  difficulty: 5,
  balancedNutrition: 10,
  sameRecipePenalty: -40,
  sameCuisinePenalty: -20,
  sameIngredientPenalty: -15,
} as const;

const HEAVY_FOOD_CATEGORIES: FoodMemoryCategory[] = ['meat', 'stew'];

function clampScore(value: number): number {
  return Math.max(0, Math.round(value));
}

function recentInWindow(context?: RecommendationContext) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_MEAL_WINDOW_DAYS);
  return (context?.recentMeals ?? []).filter(
    (entry) => new Date(entry.cookedDate) >= cutoff,
  );
}

function primaryIngredientName(menu: MenuItem): string | null {
  const recipe = getRecipeById(menu.id);
  const ingredient = recipe?.ingredients.find((item) => !item.optional) ?? recipe?.ingredients[0];
  if (!ingredient) return null;
  return (ingredient.canonicalName ?? ingredient.name).trim().toLowerCase();
}

function normalizeIngredient(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function difficultyFits(menu: MenuItem, skill: CookingSkill): boolean {
  if (skill === 'beginner') return menu.difficulty === 'easy';
  if (skill === 'intermediate') return menu.difficulty === 'easy' || menu.difficulty === 'normal';
  return true;
}

function resolveMenuCuisineForScoring(menu: MenuItem): string | null {
  const { metadata } = resolveMenuAiRecipeContext(menu);
  if (metadata?.cuisine) return metadata.cuisine;

  if (menu.tags.includes('healthy') || menu.id.includes('core_h_')) return 'healthy';
  if (menu.id.includes('core_quick')) return 'snack';

  const raw = menuCuisineFromId(menu.id);
  if (raw === 'korean' || raw === 'western' || raw === 'chinese' || raw === 'japanese') {
    return raw;
  }
  return null;
}

function matchesBalancedNutrition(menu: MenuItem, context?: RecommendationContext): boolean {
  const dna = menu.mealDna ?? resolveMealDna(menu);
  const nutritionFriendly =
    dna.health === 'balanced' ||
    dna.health === 'light' ||
    menu.badges.some((badge) => badge.type === 'nutrition') ||
    menu.tags.includes('healthy');

  if (!nutritionFriendly) return false;

  const recent = recentInWindow(context);
  if (recent.length === 0) return true;

  const recentHadHeavy = recent.some((entry) => {
    const { category } = resolveMealFoodMeta(entry.recipeId);
    return HEAVY_FOOD_CATEGORIES.includes(category);
  });

  const menuCategory = menuToFoodMemoryCategory(menu);
  if (recentHadHeavy && (menuCategory === 'salad' || dna.health === 'light')) return true;
  if (recentHadHeavy) return true;

  const recentCategory = resolveMealFoodMeta(recent[0].recipeId).category;
  return menuCategory !== recentCategory;
}

function matchesWeather(menu: MenuItem, situation: MealSituationSnapshot): boolean {
  const { weather } = situation;
  const archetypes = classifyMealArchetypes(menu);
  const tags = menu.weatherTags ?? [];

  if (isRainy(weather)) {
    return tags.includes('rain') || archetypes.includes('stew') || archetypes.includes('soup');
  }
  if (isVeryHot(weather) || isTemperatureFatigue(weather)) {
    return (
      tags.includes('hot') ||
      archetypes.includes('cold_meal') ||
      archetypes.includes('salad') ||
      menu.title.includes('비빔')
    );
  }
  if (isCold(weather)) {
    return (
      tags.includes('cold') ||
      archetypes.includes('stew') ||
      archetypes.includes('soup') ||
      archetypes.includes('grill')
    );
  }
  return tags.length === 0 || tags.includes('hot') || tags.includes('cold') || tags.includes('rain');
}

function matchesSeason(menu: MenuItem, season: PreferenceSeason): boolean {
  const dna = menu.mealDna ?? resolveMealDna(menu);
  return dna.season.includes(season);
}

function buildWeatherLabel(situation: MealSituationSnapshot): string {
  const { weather } = situation;
  if (isRainy(weather)) return '비 오는 날에 잘 어울려요';
  if (isVeryHot(weather) || isTemperatureFatigue(weather)) return '오늘 날씨에 잘 어울려요';
  if (isCold(weather)) return '쌀쌀한 날씨에 잘 어울려요';
  return '오늘 날씨에 잘 어울려요';
}

function buildCookTimeLabel(menu: MenuItem): string {
  return `${menu.cookTime}분이면 완성돼요`;
}

export function scoreSmartRecommendation(
  menu: MenuItem,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): MealScoreBreakdown {
  const exclusion = evaluateAiRecommendationExclusions(menu, context);
  const hits: SmartScoreReasonHit[] = [];
  const notes: string[] = [];
  let total = 0;

  const factors: MealScoreBreakdown['factors'] = {};
  const recent = recentInWindow(context);
  const cuisine = menuCuisineFromId(menu.id);
  const primaryIngredient = primaryIngredientName(menu);

  if (exclusion.excluded) {
    notes.push('smart_ai_excluded');
    return {
      baseScore: 0,
      total: 0,
      factors,
      notes,
      smartReasons: [],
      excluded: true,
      exclusionReasons: exclusion.reasons,
    };
  }

  if (menuMatchesMealType(menu.mealTime, situation.mealType)) {
    total += SMART_SCORE_POINTS.mealTime;
    factors.mealTime = SMART_SCORE_POINTS.mealTime;
    notes.push('smart_meal_time');
  }

  if (matchesWeather(menu, situation)) {
    total += SMART_SCORE_POINTS.weather;
    factors.weather = SMART_SCORE_POINTS.weather;
    hits.push({
      key: 'weather',
      points: SMART_SCORE_POINTS.weather,
      category: 'weather',
      label: buildWeatherLabel(situation),
    });
    notes.push('smart_weather');
  }

  if (matchesSeason(menu, situation.season)) {
    total += SMART_SCORE_POINTS.season;
    factors.season = SMART_SCORE_POINTS.season;
    notes.push('smart_season');
  }

  const favoriteIds = context?.favoriteRecipeIds ?? [];
  if (favoriteIds.includes(menu.id)) {
    total += SMART_SCORE_POINTS.favorite;
    factors.preferenceDna = SMART_SCORE_POINTS.favorite;
    hits.push({
      key: 'favorite',
      points: SMART_SCORE_POINTS.favorite,
      category: 'recentMeals',
      label: '마음에 두신 메뉴예요',
    });
    notes.push('smart_favorite');
  }

  const ateRecently = recent.some((entry) => entry.recipeId === menu.id);
  if (ateRecently) {
    total += SMART_SCORE_POINTS.sameRecipePenalty;
    factors.recentMeals = SMART_SCORE_POINTS.sameRecipePenalty;
    notes.push('smart_same_recipe');
  } else if (recent.length > 0) {
    total += SMART_SCORE_POINTS.notEatenRecently;
    factors.variety = SMART_SCORE_POINTS.notEatenRecently;
    hits.push({
      key: 'recent_balance',
      points: SMART_SCORE_POINTS.notEatenRecently,
      category: 'recentMeals',
      label: '최근 식사와 균형이 좋아요',
    });
    notes.push('smart_not_recent');
  } else {
    total += SMART_SCORE_POINTS.notEatenRecently;
    factors.variety = SMART_SCORE_POINTS.notEatenRecently;
    hits.push({
      key: 'recent_balance',
      points: SMART_SCORE_POINTS.notEatenRecently,
      category: 'recentMeals',
      label: '최근 식사와 균형이 좋아요',
    });
    notes.push('smart_fresh_pick');
  }

  const recentCuisines = recent.map((entry) => menuCuisineFromId(entry.recipeId));
  if (cuisine !== 'catalog' && recentCuisines.includes(cuisine)) {
    total += SMART_SCORE_POINTS.sameCuisinePenalty;
    factors.recentMeals = (factors.recentMeals ?? 0) + SMART_SCORE_POINTS.sameCuisinePenalty;
    notes.push('smart_same_cuisine');
  }

  if (primaryIngredient && recent.length > 0) {
    const repeatedIngredient = recent.some((entry) => {
      const recentMenu = getRecipeById(entry.recipeId);
      const recentPrimary = recentMenu?.ingredients.find((item) => !item.optional)
        ?? recentMenu?.ingredients[0];
      if (!recentPrimary) return false;
      const recentName = normalizeIngredient(recentPrimary.canonicalName ?? recentPrimary.name);
      return recentName === normalizeIngredient(primaryIngredient);
    });

    if (repeatedIngredient) {
      total += SMART_SCORE_POINTS.sameIngredientPenalty;
      factors.recentMeals = (factors.recentMeals ?? 0) + SMART_SCORE_POINTS.sameIngredientPenalty;
      notes.push('smart_same_ingredient');
    }
  }

  if (cookTimeFits(menu, situation, context)) {
    total += SMART_SCORE_POINTS.cookTimeFit;
    factors.timeOfDay = SMART_SCORE_POINTS.cookTimeFit;
    hits.push({
      key: 'cook_time',
      points: SMART_SCORE_POINTS.cookTimeFit,
      category: 'time',
      label: buildCookTimeLabel(menu),
    });
    notes.push('smart_cook_time');
  }

  if (difficultyFits(menu, situation.cookingSkill)) {
    total += SMART_SCORE_POINTS.difficulty;
    factors.mealDna = (factors.mealDna ?? 0) + SMART_SCORE_POINTS.difficulty;
    notes.push('smart_difficulty');
  }

  if (matchesBalancedNutrition(menu, context)) {
    total += SMART_SCORE_POINTS.balancedNutrition;
    factors.mealDna = (factors.mealDna ?? 0) + SMART_SCORE_POINTS.balancedNutrition;
    notes.push('smart_balanced_nutrition');
  }

  const metadataScore = scoreMetadataPreferences(menu, situation.mealType, context);
  if (metadataScore.total !== 0) {
    total += metadataScore.total;
    factors.preferenceDna = (factors.preferenceDna ?? 0) + metadataScore.total;
    notes.push(...metadataScore.notes);
  }

  for (const hit of metadataScore.hits) {
    if (hit.points <= 0) continue;
    hits.push({
      key: hit.key,
      points: hit.points,
      category: 'personalization',
      label: hit.label,
    });
  }

  const preferredCuisines = context?.aiRecommendationSettings?.preferredCuisines ?? [];
  const menuCuisine = resolveMenuCuisineForScoring(menu);
  if (
    menuCuisine &&
    preferredCuisines.some((pref) => pref === menuCuisine || (pref === 'healthy' && menuCuisine === 'healthy'))
  ) {
    notes.push('smart_ai_preferred_cuisine');
  }

  const sortedHits = [...hits].sort((a, b) => b.points - a.points || a.key.localeCompare(b.key));

  return {
    baseScore: 0,
    total: clampScore(total),
    factors,
    notes,
    smartReasons: sortedHits,
    metadataHits: metadataScore.hits,
    excluded: false,
    exclusionReasons: [],
    metadataDebug: {
      usedSettings: metadataScore.usedSettings,
      usedMetadata: metadataScore.usedMetadata,
    },
  };
}

export function pickTopSmartReasons(
  breakdown: MealScoreBreakdown,
  limit = 3,
): SmartScoreReasonHit[] {
  return (breakdown.smartReasons ?? []).slice(0, limit);
}

export { METADATA_SCORE_POINTS };
