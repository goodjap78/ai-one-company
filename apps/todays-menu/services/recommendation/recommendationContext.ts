import { getAiRecommendationSettings } from '../aiRecommendationSettings';
import { getFavorites } from '../favorite';
import { buildPreferenceSummary } from '../favorite/preferenceSummary';
import { buildHealthMemorySnapshot } from '../healthMemory';
import { getContextMemory } from '../memory/contextMemory';
import { getConversationMemory, getFoodMemory } from '../memory';
import { getMealPlanning } from '../memory/mealPlanning';
import { getPantry } from '../pantry';
import { getHistory } from '../MealHistoryService';
import { buildMealSituationBase } from './mealIntelligence';
import type { RecommendationContext } from '../../types/preference';

export type { RecommendationContext };

export async function loadRecommendationContext(): Promise<RecommendationContext> {
  const [favorites, mealHistory, conversationMemory, foodMemory, contextMemory, mealPlanning, pantry, aiRecommendationSettings] =
    await Promise.all([
      getFavorites(),
      getHistory(),
      getConversationMemory(),
      getFoodMemory(),
      getContextMemory(),
      getMealPlanning(),
      getPantry(),
      getAiRecommendationSettings(),
    ]);

  const preferenceDNA = buildPreferenceSummary(favorites);

  const situation = await buildMealSituationBase();
  const healthMemory = buildHealthMemorySnapshot(foodMemory);

  return {
    recentMeals: mealHistory,
    foodMemory,
    healthMemory,
    favorites,
    favoriteRecipeIds: favorites.map((item) => item.recipeId),
    preferenceDNA,
    conversationMemory,
    contextMemory,
    mealPlanning,
    pantry,
    situation,
    aiRecommendationSettings,
  };
}

/** @deprecated Use `loadRecommendationContext`. */
export async function loadRecommendationPreferenceContext(): Promise<RecommendationContext> {
  return loadRecommendationContext();
}

export async function loadPreferenceSummary() {
  const favorites = await getFavorites();
  return buildPreferenceSummary(favorites);
}
