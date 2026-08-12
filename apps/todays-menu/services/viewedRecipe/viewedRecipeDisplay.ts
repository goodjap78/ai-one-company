import type { FavoriteCardData } from '../favorite/favoriteDisplay';
import { resolveFavoriteCardData } from '../favorite/favoriteDisplay';
import { upgradeUserPreference } from '../favorite/preferenceResolver';
import type { ViewedRecipeEntry } from '../../types/viewedRecipeHistory';
import { getViewedRecipeHistory } from './viewedRecipeHistoryStorage';

export function resolveViewedCardData(entry: ViewedRecipeEntry): FavoriteCardData | null {
  const preference = upgradeUserPreference({
    recipeId: entry.recipeId,
    mealType: '점심',
    createdAt: entry.viewedAt,
  });
  return resolveFavoriteCardData(preference);
}

export async function resolveViewedCards(entries: ViewedRecipeEntry[]): Promise<FavoriteCardData[]> {
  return entries
    .map(resolveViewedCardData)
    .filter((card): card is FavoriteCardData => card !== null);
}

/** Resolvable viewed recipes only — invalid catalog ids are excluded. */
export async function getViewedRecipeDisplayCount(): Promise<number> {
  const entries = await getViewedRecipeHistory();
  const cards = await resolveViewedCards(entries);
  return cards.length;
}
