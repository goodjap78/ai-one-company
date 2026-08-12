/**
 * Sprint 57 — persisted "today's recommendation" for home (local date keyed).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeRecommendationDTO, MealMode, MealType } from '../../types/home';
import { getAllMenus } from '../recommendation/menuCatalog';

export const DAILY_RECOMMENDATION_STORAGE_KEY = '@hankki/daily_recommendation';

function isKnownMenuId(id: string): boolean {
  return getAllMenus().some((menu) => menu.id === id);
}

export type DailyRecommendationState = {
  dateKey: string;
  mealType: MealType;
  mealMode: MealMode;
  recipeId: string;
  recommendation: HomeRecommendationDTO;
};

export function isValidHomeRecommendationDto(
  recommendation: HomeRecommendationDTO | null | undefined,
): boolean {
  if (!recommendation?.recipe?.id?.trim()) return false;
  if (recommendation.noCandidatesAvailable) return false;
  return Boolean(isKnownMenuId(recommendation.recipe.id));
}

export async function loadDailyRecommendationState(): Promise<DailyRecommendationState | null> {
  const raw = await AsyncStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DailyRecommendationState;
    if (
      !parsed?.dateKey ||
      !parsed.mealType ||
      !parsed.mealMode ||
      !parsed.recipeId ||
      !parsed.recommendation
    ) {
      return null;
    }
    if (!isValidHomeRecommendationDto(parsed.recommendation)) {
      return null;
    }
    if (parsed.recommendation.recipe.id !== parsed.recipeId) {
      parsed.recipeId = parsed.recommendation.recipe.id;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDailyRecommendationState(
  state: DailyRecommendationState,
): Promise<void> {
  await AsyncStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify(state));
}

export async function clearDailyRecommendationState(): Promise<void> {
  await AsyncStorage.removeItem(DAILY_RECOMMENDATION_STORAGE_KEY);
}
