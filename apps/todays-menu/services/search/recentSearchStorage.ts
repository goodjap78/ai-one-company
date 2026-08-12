import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@hankki/recent_searches';
const MAX_RECENT = 5;

function parseRecentSearches(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return parseRecentSearches(raw).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();

  const current = await getRecentSearches();
  const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, MAX_RECENT);

  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}
