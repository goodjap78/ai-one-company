import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sprint H3-11 — persist last few Home recommendation ids.
 * Used to avoid repeating the same few menus on "다른 메뉴 추천".
 */
export const RECENT_RECOMMENDATIONS_KEY = '@todays_menu/recent_recommendations';
export const RECENT_RECOMMENDATIONS_MAX = 3;

let memoryCache: string[] | null = null;

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export async function getRecentRecommendationIds(): Promise<string[]> {
  if (memoryCache) return [...memoryCache];

  try {
    const raw = await AsyncStorage.getItem(RECENT_RECOMMENDATIONS_KEY);
    memoryCache = raw ? normalizeIds(JSON.parse(raw)) : [];
  } catch {
    memoryCache = [];
  }

  return [...memoryCache];
}

/** Newest-first; keeps at most RECENT_RECOMMENDATIONS_MAX ids. */
export async function noteRecentRecommendation(menuId: string): Promise<void> {
  const current = await getRecentRecommendationIds();
  memoryCache = [menuId, ...current.filter((id) => id !== menuId)].slice(
    0,
    RECENT_RECOMMENDATIONS_MAX,
  );

  try {
    await AsyncStorage.setItem(RECENT_RECOMMENDATIONS_KEY, JSON.stringify(memoryCache));
  } catch {
    // Keep in-memory list even if persistence fails.
  }
}

/** @internal Test helper */
export async function resetRecentRecommendationsForTests(): Promise<void> {
  memoryCache = [];
  try {
    await AsyncStorage.removeItem(RECENT_RECOMMENDATIONS_KEY);
  } catch {
    // ignore
  }
}
