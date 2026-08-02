import { getRecipeImageSourceByPath } from '../../data/recipes/recipeImageMap';
import type { Recipe } from '../../data/recipes/types';
import { resolveMealImage } from '../images/resolveMealImage';
import type { FridgeRaidHeroImage } from './fridgeRaidTypes';

export type FridgeRecipeImageSource = Pick<Recipe, 'id' | 'name' | 'image' | 'heroImageKey'> & {
  /** Future API field — remote hero URL when local bundle is unavailable. */
  imageUrl?: string | null;
};

/**
 * Resolve fridge-result hero images with the same local/remote priority as Home.
 *
 * Extension point: pass `imageUrl` from a remote Recipe DTO when the catalog
 * moves off bundled assets. `resolveMealImage` already prefers valid https URLs.
 */
export function resolveFridgeRecipeHeroImage(recipe: FridgeRecipeImageSource): FridgeRaidHeroImage {
  const localSource = getRecipeImageSourceByPath(recipe.image) ?? undefined;
  const resolved = resolveMealImage(recipe.id, {
    mealMode: 'homemade',
    localSource,
    remoteUrl: recipe.imageUrl ?? null,
    recipeName: recipe.name,
  });

  return {
    emoji: resolved.emoji,
    url: resolved.url,
    source: resolved.source,
    accessibilityLabel: resolved.accessibilityLabel,
  };
}
