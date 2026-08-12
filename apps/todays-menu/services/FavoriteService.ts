import type { MealType } from '../types/home';
import type { AddFavoriteInput, UserPreference } from '../types/preference';
import { getCurrentMealType } from '../utils/mealType';
import {
  getFavorites as getFavoritesImpl,
  isFavorite as isFavoriteImpl,
  removeFavorite as removeFavoriteImpl,
  toggleFavorite as toggleFavoriteImpl,
} from './favorite/favoriteService';

export type ToggleFavoriteResult = {
  isFavorite: boolean;
  added: boolean;
  preference: UserPreference | null;
};

/** Release 1.0 favorite API — AsyncStorage-backed. */
export async function getFavorites(): Promise<UserPreference[]> {
  return getFavoritesImpl();
}

export async function isFavorite(recipeId: string): Promise<boolean> {
  return isFavoriteImpl(recipeId);
}

export async function removeFavorite(recipeId: string): Promise<boolean> {
  return removeFavoriteImpl(recipeId);
}

export async function getFavoriteRecipeIds(): Promise<string[]> {
  const favorites = await getFavoritesImpl();
  return favorites.map((item) => item.recipeId);
}

export async function toggleFavorite(
  recipeId: string,
  mealType: MealType = getCurrentMealType(),
): Promise<ToggleFavoriteResult> {
  const input: AddFavoriteInput = { recipeId, mealType };
  return toggleFavoriteImpl(input);
}
