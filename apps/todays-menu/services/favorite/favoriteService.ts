import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AddFavoriteInput, AddFavoriteResult, UserPreference } from '../../types/preference';
import { trackFavoriteChange } from '../analytics';
import { createUserPreference, upgradeUserPreference } from './preferenceResolver';

const FAVORITES_KEY = '@hankki/favorites';
const LEGACY_TASTE_PREFS_KEY = '@todays_menu/taste_preferences';

function isCompleteUserPreference(value: unknown): value is UserPreference {
  if (!value || typeof value !== 'object') return false;

  const record = value as UserPreference;
  return (
    typeof record.recipeId === 'string' &&
    typeof record.category === 'string' &&
    typeof record.mealType === 'string' &&
    typeof record.difficulty === 'string' &&
    typeof record.cookingTime === 'number' &&
    Array.isArray(record.tags) &&
    Array.isArray(record.emotionTags) &&
    typeof record.season === 'string' &&
    typeof record.createdAt === 'string'
  );
}

function isLegacyUserPreference(value: unknown): value is Pick<
  UserPreference,
  'recipeId' | 'mealType' | 'createdAt'
> &
  Partial<UserPreference> {
  if (!value || typeof value !== 'object') return false;

  const record = value as UserPreference;
  return (
    typeof record.recipeId === 'string' &&
    typeof record.mealType === 'string' &&
    typeof record.createdAt === 'string'
  );
}

function normalizeUserPreference(value: unknown): UserPreference | null {
  if (isCompleteUserPreference(value)) {
    return upgradeUserPreference(value);
  }

  if (isLegacyUserPreference(value)) {
    return upgradeUserPreference(value);
  }

  return null;
}

function parseFavorites(raw: string | null): UserPreference[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeUserPreference)
      .filter((item): item is UserPreference => item !== null);
  } catch {
    return [];
  }
}

async function migrateLegacyPreferences(): Promise<UserPreference[]> {
  try {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_TASTE_PREFS_KEY);
    if (!legacyRaw) return [];

    const legacyIds = JSON.parse(legacyRaw) as unknown;
    if (!Array.isArray(legacyIds)) return [];

    const migrated = legacyIds
      .filter((id): id is string => typeof id === 'string')
      .map((recipeId) =>
        createUserPreference({
          recipeId,
          mealType: 'lunch',
        }),
      );

    if (migrated.length > 0) {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(migrated));
    }

    await AsyncStorage.removeItem(LEGACY_TASTE_PREFS_KEY);
    return migrated;
  } catch {
    return [];
  }
}

async function readFavorites(): Promise<UserPreference[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  const favorites = parseFavorites(raw);

  if (favorites.length > 0 || raw) {
    return favorites;
  }

  return migrateLegacyPreferences();
}

async function writeFavorites(favorites: UserPreference[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function getFavorites(): Promise<UserPreference[]> {
  const favorites = await readFavorites();
  return [...favorites].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getFavoriteRecipeIds(): Promise<string[]> {
  const favorites = await getFavorites();
  return favorites.map((item) => item.recipeId);
}

export async function isFavorite(recipeId: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((item) => item.recipeId === recipeId);
}

export async function getFavorite(recipeId: string): Promise<UserPreference | null> {
  const favorites = await getFavorites();
  return favorites.find((item) => item.recipeId === recipeId) ?? null;
}

export async function addFavorite(input: AddFavoriteInput): Promise<AddFavoriteResult> {
  const favorites = await readFavorites();
  const existing = favorites.find((item) => item.recipeId === input.recipeId);

  if (existing) {
    return { added: false, preference: existing };
  }

  const preference = createUserPreference(input);
  await writeFavorites([preference, ...favorites]);
  trackFavoriteChange({ recipe_id: input.recipeId, action: 'add' });

  return { added: true, preference };
}

export async function removeFavorite(recipeId: string): Promise<boolean> {
  const favorites = await readFavorites();
  const next = favorites.filter((item) => item.recipeId !== recipeId);

  if (next.length === favorites.length) {
    return false;
  }

  await writeFavorites(next);
  trackFavoriteChange({ recipe_id: recipeId, action: 'remove' });
  return true;
}

export async function toggleFavorite(input: AddFavoriteInput): Promise<{
  isFavorite: boolean;
  added: boolean;
  preference: UserPreference | null;
}> {
  const favorites = await readFavorites();
  const exists = favorites.some((item) => item.recipeId === input.recipeId);

  if (exists) {
    await removeFavorite(input.recipeId);
    return { isFavorite: false, added: false, preference: null };
  }

  const result = await addFavorite(input);
  return {
    isFavorite: true,
    added: result.added,
    preference: result.preference,
  };
}
