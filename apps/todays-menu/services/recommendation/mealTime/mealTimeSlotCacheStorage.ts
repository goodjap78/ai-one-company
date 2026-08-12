import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeRecommendationDTO } from '../../../types/home';
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';
import { getHankkiRecipeById } from '../../../data/recipes/hankkiRecipes';
import { getAllMenus } from '../menuCatalog';
import {
  buildMealTimeCacheKey,
  MEAL_TIME_CACHE_NAMESPACE,
  type MealTimeCacheKey,
} from './mealTimeCachePolicy';

function isKnownMenuId(id: string): boolean {
  if (getHankkiRecipeById(id)) return true;
  return getAllMenus().some((menu) => menu.id === id);
}

export type MealTimeSlotCacheEntry = {
  dateKey: string;
  slot: MealTimeSlotKey;
  recipeIds: string[];
  refreshGeneration: number;
  createdAt: string;
  recommendation: HomeRecommendationDTO;
};

type MealTimeSlotCacheStore = Record<MealTimeCacheKey, MealTimeSlotCacheEntry>;

export function isValidMealTimeSlotCacheEntry(
  entry: MealTimeSlotCacheEntry | null | undefined,
): boolean {
  if (!entry?.dateKey || !entry.slot || !entry.recommendation) return false;
  if (!entry.recommendation.recipe?.id?.trim()) return false;
  if (entry.recommendation.noCandidatesAvailable) return false;

  const ids = entry.recipeIds?.length
    ? entry.recipeIds
    : [
        entry.recommendation.recipe.id,
        ...(entry.recommendation.alternatives?.map((alt) => alt.recipe.id) ?? []),
      ];

  return ids.every((id) => isKnownMenuId(id));
}

async function loadStore(): Promise<MealTimeSlotCacheStore> {
  const raw = await AsyncStorage.getItem(MEAL_TIME_CACHE_NAMESPACE);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as MealTimeSlotCacheStore;
  } catch {
    return {};
  }
}

async function saveStore(store: MealTimeSlotCacheStore): Promise<void> {
  await AsyncStorage.setItem(MEAL_TIME_CACHE_NAMESPACE, JSON.stringify(store));
}

export async function loadMealTimeSlotCacheEntry(
  dateKey: string,
  slot: MealTimeSlotKey,
): Promise<MealTimeSlotCacheEntry | null> {
  const key = buildMealTimeCacheKey(dateKey, slot);
  const store = await loadStore();
  const entry = store[key];
  if (!entry) return null;
  if (!isValidMealTimeSlotCacheEntry(entry)) {
    delete store[key];
    await saveStore(store);
    return null;
  }
  return entry;
}

export async function saveMealTimeSlotCacheEntry(
  entry: MealTimeSlotCacheEntry,
): Promise<void> {
  const key = buildMealTimeCacheKey(entry.dateKey, entry.slot);
  const store = await loadStore();
  store[key] = entry;
  await saveStore(store);
}

export async function clearMealTimeSlotCache(): Promise<void> {
  await AsyncStorage.removeItem(MEAL_TIME_CACHE_NAMESPACE);
}

export function buildRecipeIdsFromRecommendation(
  recommendation: HomeRecommendationDTO,
): string[] {
  const alts = recommendation.alternatives?.map((alt) => alt.recipe.id) ?? [];
  return [recommendation.recipe.id, ...alts];
}
