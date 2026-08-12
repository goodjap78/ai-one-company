import { getCurrentMealType } from '../utils/mealType';
import {
  addFavorite,
  getFavoriteRecipeIds,
  removeFavorite,
} from './favorite';

export {
  getNickname,
  saveNickname,
} from './nicknameStorage';

export {
  getUserProfile,
  saveUserProfile,
  updateUserProfile,
  getMealHistory,
  getRecentMeals,
  getConversationMemory,
} from './memory';

/** @deprecated Use `getFavoriteRecipeIds` from `services/favorite`. */
export async function getSavedTasteRecipeIds(): Promise<string[]> {
  return getFavoriteRecipeIds();
}

/** @deprecated Use `addFavorite` from `services/favorite`. */
export async function saveTastePreference(recipeId: string): Promise<boolean> {
  const result = await addFavorite({
    recipeId,
    mealType: getCurrentMealType(),
  });
  return result.added;
}

/** @deprecated Use `removeFavorite` from `services/favorite`. */
export async function removeTastePreference(recipeId: string): Promise<boolean> {
  return removeFavorite(recipeId);
}
