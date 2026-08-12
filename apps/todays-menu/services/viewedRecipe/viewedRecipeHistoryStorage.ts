import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ViewedRecipeEntry } from '../../types/viewedRecipeHistory';

export const VIEWED_RECIPE_HISTORY_KEY = '@hankki/viewed_recipe_history';
export const MAX_VIEWED_RECIPE_HISTORY = 20;

function parseViewedRecipeHistory(raw: string | null): ViewedRecipeEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is ViewedRecipeEntry =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ViewedRecipeEntry).recipeId === 'string' &&
        (item as ViewedRecipeEntry).recipeId.trim().length > 0 &&
        typeof (item as ViewedRecipeEntry).viewedAt === 'string' &&
        (item as ViewedRecipeEntry).viewedAt.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export async function getViewedRecipeHistory(): Promise<ViewedRecipeEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(VIEWED_RECIPE_HISTORY_KEY);
    return parseViewedRecipeHistory(raw).slice(0, MAX_VIEWED_RECIPE_HISTORY);
  } catch {
    return [];
  }
}

export async function recordViewedRecipe(recipeId: string): Promise<ViewedRecipeEntry[]> {
  const trimmed = recipeId.trim();
  if (!trimmed) return getViewedRecipeHistory();

  const current = await getViewedRecipeHistory();
  const viewedAt = new Date().toISOString();
  const next: ViewedRecipeEntry[] = [
    { recipeId: trimmed, viewedAt },
    ...current.filter((entry) => entry.recipeId !== trimmed),
  ].slice(0, MAX_VIEWED_RECIPE_HISTORY);

  await AsyncStorage.setItem(VIEWED_RECIPE_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearViewedRecipeHistory(): Promise<void> {
  await AsyncStorage.removeItem(VIEWED_RECIPE_HISTORY_KEY);
}
