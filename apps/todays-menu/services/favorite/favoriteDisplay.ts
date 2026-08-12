import { getMasterRecipeById } from '../../recipes';
import type { UserPreference } from '../../types/preference';
import type { RecipeImage } from '../../types/recipe';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { getMenuById, getRecipeById } from '../recipe/mockRecipeDetails';
import { getFavorites } from './favoriteService';

export type FavoriteCardData = {
  recipeId: string;
  title: string;
  subtitle: string;
  emoji: string;
  image: RecipeImage;
  cookingTimeMinutes: number;
  mealType: UserPreference['mealType'];
  category: UserPreference['category'];
  mode: 'homemade' | 'delivery';
  createdAt: string;
};

const MODE_EMOJI = {
  homemade: '🍳',
  delivery: '🚚',
} as const;

export function resolveFavoriteCardData(preference: UserPreference): FavoriteCardData | null {
  const master = getMasterRecipeById(preference.recipeId);
  if (master) {
    return {
      recipeId: preference.recipeId,
      title: master.title.ko,
      subtitle: master.subtitle.ko,
      emoji: master.image.emoji ?? '🍽️',
      image: resolveMealHeroImage(preference.recipeId, 'homemade', master.image.url),
      cookingTimeMinutes: preference.cookingTime,
      mealType: preference.mealType,
      category: preference.category,
      mode: 'homemade',
      createdAt: preference.createdAt,
    };
  }

  const menu = getMenuById(preference.recipeId);
  if (menu) {
    return {
      recipeId: preference.recipeId,
      title: menu.title,
      subtitle: menu.subtitle,
      emoji: MODE_EMOJI[menu.mode],
      image: resolveMealHeroImage(preference.recipeId, menu.mode),
      cookingTimeMinutes: preference.cookingTime,
      mealType: preference.mealType,
      category: preference.category,
      mode: menu.mode,
      createdAt: preference.createdAt,
    };
  }

  const recipe = getRecipeById(preference.recipeId);
  if (recipe) {
    return {
      recipeId: preference.recipeId,
      title: recipe.title,
      subtitle: recipe.description,
      emoji: recipe.image.emoji ?? '🍽️',
      image: resolveMealHeroImage(preference.recipeId, recipe.mode, recipe.image.url),
      cookingTimeMinutes: preference.cookingTime || recipe.cookTime,
      mealType: preference.mealType,
      category: preference.category,
      mode: recipe.mode,
      createdAt: preference.createdAt,
    };
  }

  return null;
}

export async function resolveFavoriteCards(
  preferences: UserPreference[],
): Promise<FavoriteCardData[]> {
  return preferences
    .map(resolveFavoriteCardData)
    .filter((card): card is FavoriteCardData => card !== null);
}

/** Same source as Favorites page — only resolvable saved favorites. */
export async function getFavoriteDisplayCount(): Promise<number> {
  const favorites = await getFavorites();
  const cards = await resolveFavoriteCards(favorites);
  return cards.length;
}
