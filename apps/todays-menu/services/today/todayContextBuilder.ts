import type { PreferenceCategory } from '../../types/preference';
import type { TodayContext, Weekday } from '../../types/today';
import { getCurrentMealType } from '../../utils/mealType';
import {
  getConversationMemory,
  getMealHistory,
  getUserProfile,
} from '../memory';
import { buildPreferenceSummary } from '../favorite/preferenceSummary';
import { getFavorites } from '../favorite';
import { getDailyChallenge } from './dailyChallengeService';
import { getMockWeather } from './mockWeatherService';
import { calculateCookingStreak } from './streakCalculator';

const WEEKDAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function resolveFavoriteCategory(
  profileCategories: PreferenceCategory[],
  dnaCategories: PreferenceCategory[],
): PreferenceCategory | null {
  if (profileCategories.length > 0) return profileCategories[0];
  if (dnaCategories.length > 0) return dnaCategories[0];
  return null;
}

/**
 * Builds the single TodayContext object for briefing and future AI input.
 */
export async function buildTodayContext(nickname: string, now = new Date()): Promise<TodayContext> {
  const date = now.toISOString().slice(0, 10);
  const weekday = now.getDay() as Weekday;
  const mealTime = getCurrentMealType(now);

  const [mealHistory, conversationMemory, favorites, profile] = await Promise.all([
    getMealHistory(),
    getConversationMemory(),
    getFavorites(),
    getUserProfile(),
  ]);

  const recentMeals = mealHistory.slice(0, 5);
  const preferenceDNA = buildPreferenceSummary(favorites);
  const favoriteCategory = resolveFavoriteCategory(
    profile?.favoriteCategories ?? [],
    preferenceDNA.favoriteCategories,
  );

  return {
    date,
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday],
    mealTime,
    recentMeals,
    streak: calculateCookingStreak(mealHistory, now),
    mood: conversationMemory.mood,
    favoriteCategory,
    nickname: profile?.nickname ?? nickname,
    weather: getMockWeather(date),
    dailyChallenge: getDailyChallenge(date),
    cookingSkill: profile?.cookingSkill ?? 'beginner',
    preferenceDNA,
    favoriteRecipeIds: favorites.map((item) => item.recipeId),
  };
}

export { WEEKDAY_LABELS };
