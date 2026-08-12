import type { AddFavoriteInput, UserPreference } from '../../types/preference';
import { resolveRecipeMetadata } from './recipeMetadataResolver';

export function createUserPreference(input: AddFavoriteInput): UserPreference {
  const createdAt = new Date().toISOString();
  const metadata = resolveRecipeMetadata(input.recipeId, new Date(createdAt));

  return {
    recipeId: input.recipeId,
    category: metadata.category,
    mealType: input.mealType,
    difficulty: metadata.difficulty,
    cookingTime: metadata.cookingTime,
    tags: metadata.tags,
    emotionTags: metadata.emotionTags,
    season: metadata.season,
    createdAt,
  };
}

/**
 * Upgrades legacy records that only stored recipeId/category/mealType/createdAt.
 */
export function upgradeUserPreference(
  partial: Pick<UserPreference, 'recipeId' | 'mealType' | 'createdAt'> &
    Partial<Omit<UserPreference, 'recipeId' | 'mealType' | 'createdAt'>>,
): UserPreference {
  const metadata = resolveRecipeMetadata(partial.recipeId, new Date(partial.createdAt));

  return {
    recipeId: partial.recipeId,
    mealType: partial.mealType,
    createdAt: partial.createdAt,
    category: partial.category ?? metadata.category,
    difficulty: partial.difficulty ?? metadata.difficulty,
    cookingTime: partial.cookingTime ?? metadata.cookingTime,
    tags: partial.tags?.length ? partial.tags : metadata.tags,
    emotionTags: partial.emotionTags?.length ? partial.emotionTags : metadata.emotionTags,
    season: partial.season ?? metadata.season,
  };
}

export { resolvePreferenceCategory } from './recipeMetadataResolver';
