import type { CollectionId } from '../content/types/contentBase';
import type { RecipeStandardMetadata } from './recipeStandardMetadataTypes';

export type DeriveCollectionIdsInput = {
  standardMetadata: RecipeStandardMetadata;
  serving: number;
  /** Merged with auto-derived ids; duplicates removed. */
  override?: CollectionId[];
};

function uniqueSorted(ids: Iterable<CollectionId>): CollectionId[] {
  return [...new Set(ids)].sort();
}

/**
 * Auto-assign collection membership for production recipes.
 * Seasonal / popular / editor collections are manual-only (not derived here).
 */
export function deriveCollectionIds(input: DeriveCollectionIdsInput): CollectionId[] {
  const { standardMetadata, serving } = input;
  const ids = new Set<CollectionId>();

  ids.add('HOME');

  if (standardMetadata.situationTags.includes('solo_meal') || serving <= 1) {
    ids.add('SOLO');
  }

  if (
    standardMetadata.cookingTime <= 15 ||
    standardMetadata.situationTags.includes('quick_meal')
  ) {
    ids.add('FAST');
  }

  if (standardMetadata.situationTags.includes('family_meal')) {
    ids.add('FAMILY');
  }

  if (standardMetadata.situationTags.includes('kids_meal')) {
    ids.add('KIDS');
  }

  if (standardMetadata.mealTypes.includes('late_night')) {
    ids.add('MIDNIGHT');
  }

  if (standardMetadata.situationTags.includes('hangover')) {
    ids.add('HANGOVER');
  }

  if (standardMetadata.dietaryTags.includes('low_carb')) {
    ids.add('DIET');
  }

  if (
    standardMetadata.dietaryTags.includes('high_protein') ||
    standardMetadata.dietaryTags.includes('light_meal')
  ) {
    ids.add('HEALTHY');
  }

  if (input.override) {
    for (const id of input.override) {
      ids.add(id);
    }
  }

  return uniqueSorted(ids);
}
