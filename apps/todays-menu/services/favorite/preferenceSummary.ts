import type { Difficulty, MealType } from '../../types/home';
import type {
  PreferenceCategory,
  PreferenceSeason,
  PreferenceSummary,
  UserPreference,
} from '../../types/preference';
import type { RecipeEmotionId, RecipeTagId } from '../../recipes/types';

function uniqueValues<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)];
}

export function buildPreferenceSummary(favorites: UserPreference[]): PreferenceSummary {
  return {
    favoriteCategories: uniqueValues(
      favorites.map((item) => item.category) as PreferenceCategory[],
    ),
    favoriteMealTypes: uniqueValues(favorites.map((item) => item.mealType) as MealType[]),
    favoriteTags: uniqueValues(
      favorites.flatMap((item) => item.tags) as RecipeTagId[],
    ),
    favoriteEmotionTags: uniqueValues(
      favorites.flatMap((item) => item.emotionTags) as RecipeEmotionId[],
    ),
    favoriteCookingTimes: uniqueNumbers(favorites.map((item) => item.cookingTime)),
    favoriteDifficulty: uniqueValues(
      favorites.map((item) => item.difficulty) as Difficulty[],
    ),
    favoriteSeasons: uniqueValues(favorites.map((item) => item.season) as PreferenceSeason[]),
    totalFavorites: favorites.length,
  };
}

export function getPreferenceSummary(favorites: UserPreference[]): PreferenceSummary {
  return buildPreferenceSummary(favorites);
}
