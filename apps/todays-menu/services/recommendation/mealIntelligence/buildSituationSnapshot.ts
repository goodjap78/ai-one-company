import type { MealMode, MealType } from '../../../types/home';
import type { MealSituationBase, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import type { PreferenceSeason } from '../../../types/preference';
import type { Weekday } from '../../../types/today';
import { getUserProfile } from '../../memory';
import { getConversationMemory } from '../../memory';
import { getMockWeather } from '../../today/mockWeatherService';

function resolveSeason(date: Date): PreferenceSeason {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/** Date/time context shared across recommendation requests in a session. */
export type { MealSituationBase } from '../../../types/mealIntelligenceEngine';

export async function buildMealSituationBase(now = new Date()): Promise<MealSituationBase> {
  const date = now.toISOString().slice(0, 10);
  const weekday = now.getDay() as Weekday;
  const [conversationMemory, profile] = await Promise.all([
    getConversationMemory(),
    getUserProfile(),
  ]);

  return buildMealSituationBaseSync(now, {
    mood: conversationMemory.mood,
    cookingSkill: profile?.cookingSkill ?? 'beginner',
  }); // hourOfDay set inside buildMealSituationBaseSync
}

/** Sync snapshot for scoring when async context is unavailable. */
export function buildMealSituationBaseSync(
  now = new Date(),
  overrides: Partial<Pick<MealSituationBase, 'mood' | 'cookingSkill'>> = {},
): MealSituationBase {
  const date = now.toISOString().slice(0, 10);
  const weekday = now.getDay() as Weekday;

  return {
    weather: getMockWeather(date),
    weekday,
    isWeekend: weekday === 0 || weekday === 6,
    hourOfDay: now.getHours(),
    season: resolveSeason(now),
    mood: overrides.mood ?? null,
    cookingSkill: overrides.cookingSkill ?? 'beginner',
  };
}

export function mergeMealSituation(
  base: MealSituationBase,
  mealType: MealType,
  mealMode: MealMode,
): MealSituationSnapshot {
  return { ...base, mealType, mealMode };
}

export function resolveMealSituation(
  request: {
    mealType: MealType;
    mealMode: MealMode;
    context?: { situation?: MealSituationBase; conversationMemory?: { mood: MealSituationBase['mood'] } };
  },
  now = new Date(),
): MealSituationSnapshot {
  const base =
    request.context?.situation ??
    buildMealSituationBaseSync(now, {
      mood: request.context?.conversationMemory?.mood ?? null,
    });
  return mergeMealSituation(base, request.mealType, request.mealMode);
}
