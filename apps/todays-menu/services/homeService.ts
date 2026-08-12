import type {
  AcceptRecommendationResponse,
  HomeRecommendationDTO,
  MealMode,
  MealType,
  SaveTasteResponse,
} from '../types/home';
import { getHankkiRecommendationMessage } from '../constants/HankkiMessages';
import { addFavorite, removeFavorite } from './favorite';
import { regenerateGroceryList } from './grocery';
import {
  addMealHistory,
  finishPlannedMeal,
  recordFoodMemoryEvent,
  recordRecommendation,
  recordRecommendedMeal,
  saveMeal,
} from './memory';
import {
  resolveMealTimeSlotRecommendation,
  refreshMealTimeSlotRecommendation,
  promoteMealTimeAlternative,
  saveMealTimeSlotRecommendationState,
} from './recommendation/mealTime/mealTimeSlotRecommendationService';
import {
  mealTimeSlotToMealType,
  resolveClockPrimarySlot,
} from './recommendation/mealTime/mealTimeSlotMapping';
import type { MealTimeSlotKey } from '../types/mealTimeRecommendation';
import { getSessionHeroIds } from './recommendationSession';
import { recommendMenuWithContext, refreshMenu } from './recommendation';
import { getFlagshipMenuById } from './recommendation/goldMealCatalog';
import { withSeedRecommendationMessage } from './recommendation/seedRecommendationMessage';
import {
  saveDailyRecommendationState,
  type DailyRecommendationState,
} from './recommendation/dailyRecommendationStorage';
import { getLocalDateKey, getNow } from '../utils/dateProvider';

async function trackRecommendedMeal(
  recommendation: HomeRecommendationDTO,
  mealType: MealType,
): Promise<void> {
  await recordRecommendedMeal({
    recipeId: recommendation.recipe.id,
    mealType,
    mealMode: recommendation.mealMode,
    recommendationId: recommendation.recommendationId,
  });
}

export async function completeHomeMeal(
  recipeId: string,
  mealType: MealType,
  options?: { cookingTimeMinutes?: number },
): Promise<void> {
  await finishPlannedMeal({ recipeId, mealType });
  await recordFoodMemoryEvent({ mealId: recipeId, outcome: 'accepted' });
  await addMealHistory({
    recipeId,
    mealType,
    cookingTime: options?.cookingTimeMinutes,
  });
  await regenerateGroceryList();
}

/**
 * =============================================================================
 * TEMPORARY DEV OVERRIDE — Sprint IMG-5 visual verification
 * =============================================================================
 * Forces Home recommendation to recipe 003 김치찌개 so the bundled
 * `assets/meals/kimchi_stew.jpg` hero can be checked on Home + Detail.
 *
 * - Disabled 2026-08 — forced 003 locked hero image/title on refresh while seed
 *   messages rotated (looked like a stale Image bug in dev).
 * - Set DEV_FORCE_HOME_RECIPE_ID to re-enable for one-off hero QA only.
 * =============================================================================
 */
const DEV_FORCE_HOME_RECIPE_ID: string | null = null;

function applyDevForceHomeRecipeOverride(
  recommendation: HomeRecommendationDTO,
  mealType: MealType,
  mealMode: MealMode,
): HomeRecommendationDTO {
  // TEMP IMG-5 — remove after visual QA
  if (!DEV_FORCE_HOME_RECIPE_ID || mealMode !== 'homemade') {
    return recommendation;
  }

  const menu = getFlagshipMenuById(DEV_FORCE_HOME_RECIPE_ID);
  if (!menu) {
    return recommendation;
  }

  if (recommendation.recipe.id === DEV_FORCE_HOME_RECIPE_ID) {
    return recommendation;
  }

  return {
    ...recommendation,
    chefMessage: getHankkiRecommendationMessage(mealType, menu.title),
    badges: menu.badges,
    honeyTip: menu.honeyTip,
    recipe: {
      id: menu.id,
      title: menu.title,
      subtitle: menu.subtitle,
      // null → Home/Detail resolve local bundled kimchi_stew.jpg
      imageUrl: null,
      cookingTimeMinutes: menu.cookTime,
      difficulty: menu.difficulty,
    },
  };
}

async function persistDailyRecommendation(
  mealType: MealType,
  mealMode: MealMode,
  recommendation: HomeRecommendationDTO,
): Promise<void> {
  const state: DailyRecommendationState = {
    dateKey: getLocalDateKey(getNow()),
    mealType,
    mealMode,
    recipeId: recommendation.recipe.id,
    recommendation,
  };
  await saveDailyRecommendationState(state);
}

export async function getHomeRecommendation(
  mealType: MealType,
  mealMode: MealMode,
  options: { dailyExcludeRecipeId?: string } = {},
): Promise<HomeRecommendationDTO> {
  const recommendation = await withSeedRecommendationMessage(
    applyDevForceHomeRecipeOverride(
      await recommendMenuWithContext(
        { mealType, mealMode },
        { dailyExcludeRecipeId: options.dailyExcludeRecipeId },
      ),
      mealType,
      mealMode,
    ),
    mealType,
  );
  await recordRecommendation(recommendation.recipe.id);
  await trackRecommendedMeal(recommendation, mealType);
  await persistDailyRecommendation(mealType, mealMode, recommendation);
  return recommendation;
}

export async function refreshHomeRecommendation(
  mealType: MealType,
  mealMode: MealMode,
  previousRecipeId: string,
): Promise<HomeRecommendationDTO> {
  await recordFoodMemoryEvent({ mealId: previousRecipeId, outcome: 'skipped' });
  const recommendation = await withSeedRecommendationMessage(
    applyDevForceHomeRecipeOverride(
      await refreshMenu(mealType, mealMode, previousRecipeId),
      mealType,
      mealMode,
    ),
    mealType,
  );
  await recordRecommendation(recommendation.recipe.id);
  await trackRecommendedMeal(recommendation, mealType);
  await persistDailyRecommendation(mealType, mealMode, recommendation);
  return recommendation;
}

/**
 * Open recipe from Home ("레시피 보기").
 * Does not mark the meal as eaten — that happens via Detail "오늘 먹었어요".
 */
export async function acceptHomeRecommendation(
  recommendationId: string,
  recipeId: string,
  mealType: MealType,
  mealMode: MealMode,
  _recipeName?: string,
): Promise<AcceptRecommendationResponse> {
  await saveMeal({
    recipeId,
    mealType,
    mealMode,
    recommendationId,
  });
  await regenerateGroceryList();

  return {
    mealHistoryId: '',
    recipeId,
    nextRoute: mealMode === 'delivery' ? `/delivery/${recipeId}` : `/ingredients/${recipeId}`,
  };
}

/** Save — HANKKI remembers this meal as a planning candidate. */
export async function saveHomeRecommendation(
  recommendationId: string,
  recipeId: string,
  mealType: MealType,
  mealMode: MealMode,
): Promise<void> {
  await saveMeal({
    recipeId,
    mealType,
    mealMode,
    recommendationId,
  });
  await regenerateGroceryList();
}

export async function recordHomeCookingComplete(
  recipeId: string,
  mealType: MealType,
  cookingTimeMinutes: number,
  satisfaction: 'loved' | 'good' | 'okay' | 'disliked' = 'good',
): Promise<void> {
  await completeHomeMeal(recipeId, mealType, { cookingTimeMinutes });
  void satisfaction;
}

export async function recordHomeDeliveryComplete(
  recipeId: string,
  mealType: MealType,
): Promise<void> {
  await completeHomeMeal(recipeId, mealType);
}

export async function saveHomeTastePreference(
  recipeId: string,
  mealType: MealType,
): Promise<SaveTasteResponse> {
  const result = await addFavorite({ recipeId, mealType });
  return {
    recipeId,
    saved: result.added,
    alreadySaved: !result.added,
  };
}

export async function removeHomeTastePreference(recipeId: string): Promise<boolean> {
  return removeFavorite(recipeId);
}

export async function simulateErrorRecommendation(
  mealType: MealType,
  mealMode: MealMode,
): Promise<HomeRecommendationDTO> {
  const recommendation = await withSeedRecommendationMessage(
    await recommendMenuWithContext({ mealType, mealMode }),
    mealType,
  );
  await trackRecommendedMeal(recommendation, mealType);
  return recommendation;
}

/** Sprint 59 — meal-time slot recommendation for home (date+slot cache). */
export async function getMealTimeSlotHomeRecommendation(
  slot: MealTimeSlotKey,
  mealMode: MealMode,
  options: { useClockWeights?: boolean; forceGenerate?: boolean } = {},
): Promise<HomeRecommendationDTO> {
  const mealType = mealTimeSlotToMealType(slot);
  const recommendation = await withSeedRecommendationMessage(
    applyDevForceHomeRecipeOverride(
      await resolveMealTimeSlotRecommendation(slot, mealMode, {
        useClockWeights: options.useClockWeights ?? slot === resolveClockPrimarySlot(getNow()),
        forceGenerate: options.forceGenerate,
        sessionShownIds: getSessionHeroIds(),
      }),
      mealType,
      mealMode,
    ),
    mealType,
  );
  await recordRecommendation(recommendation.recipe.id);
  await trackRecommendedMeal(recommendation, mealType);
  return recommendation;
}

export async function refreshMealTimeSlotHomeRecommendation(
  slot: MealTimeSlotKey,
  mealMode: MealMode,
  previousRecipeIds: string[],
): Promise<HomeRecommendationDTO> {
  const mealType = mealTimeSlotToMealType(slot);
  if (previousRecipeIds[0]) {
    await recordFoodMemoryEvent({ mealId: previousRecipeIds[0], outcome: 'skipped' });
  }
  const recommendation = await withSeedRecommendationMessage(
    applyDevForceHomeRecipeOverride(
      await refreshMealTimeSlotRecommendation(slot, mealMode, {
        useClockWeights: slot === resolveClockPrimarySlot(getNow()),
        previousRecipeIds,
        sessionShownIds: getSessionHeroIds(),
      }),
      mealType,
      mealMode,
    ),
    mealType,
  );
  await recordRecommendation(recommendation.recipe.id);
  await trackRecommendedMeal(recommendation, mealType);
  return recommendation;
}

export function promoteMealTimeSlotAlternative(
  current: HomeRecommendationDTO,
  alternativeId: string,
): HomeRecommendationDTO | null {
  return promoteMealTimeAlternative(current, alternativeId);
}

export async function persistMealTimeSlotHomeRecommendation(
  slot: MealTimeSlotKey,
  recommendation: HomeRecommendationDTO,
): Promise<void> {
  await saveMealTimeSlotRecommendationState(slot, recommendation);
}
