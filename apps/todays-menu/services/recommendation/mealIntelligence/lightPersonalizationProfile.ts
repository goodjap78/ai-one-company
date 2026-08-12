import { getHankkiRecipeById } from '../../../data/recipes/hankkiRecipes';
import type { RecipeStandardMetadata } from '../../../data/recipes/recipeStandardMetadataTypes';
import type { CollectionId } from '../../../data/content/types/contentBase';
import type { ViewedRecipeEntry } from '../../../types/viewedRecipeHistory';
import type { UserPreference } from '../../../types/preference';
import {
  createEmptyLightPersonalizationProfile,
  LIGHT_PERSONALIZATION_SIGNAL,
  type LightPersonalizationFeatureBuckets,
  type LightPersonalizationProfile,
} from '../../../types/lightPersonalization';

type RecipeFeatureSnapshot = {
  cuisine: string;
  dishType: string;
  tasteProfiles: string[];
  spiceLevel: number;
  situationTags: string[];
  dietaryTags: string[];
  mainIngredients: string[];
  collections: CollectionId[];
};

function bump(map: Record<string, number>, key: string, amount: number): void {
  if (!key || amount <= 0) return;
  map[key] = (map[key] ?? 0) + amount;
}

function viewedRankSignalWeight(rankIndex: number): number {
  if (rankIndex < 5) return LIGHT_PERSONALIZATION_SIGNAL.viewedStrong;
  if (rankIndex < 10) return LIGHT_PERSONALIZATION_SIGNAL.viewedMedium;
  return LIGHT_PERSONALIZATION_SIGNAL.viewedWeak;
}

function snapshotFromRecipeId(recipeId: string): RecipeFeatureSnapshot | null {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return null;

  const meta = recipe.standardMetadata;
  return {
    cuisine: meta.cuisine,
    dishType: meta.dishType,
    tasteProfiles: [...meta.tasteProfile],
    spiceLevel: meta.spiceLevel,
    situationTags: [...meta.situationTags],
    dietaryTags: [...meta.dietaryTags],
    mainIngredients: [...meta.mainIngredients],
    collections: [...recipe.collectionIds],
  };
}

function applySnapshotToBuckets(
  buckets: LightPersonalizationFeatureBuckets,
  snapshot: RecipeFeatureSnapshot,
  weight: number,
): void {
  bump(buckets.cuisines, snapshot.cuisine, weight);
  bump(buckets.dishTypes, snapshot.dishType, weight);

  for (const taste of snapshot.tasteProfiles) {
    bump(buckets.tasteProfiles, taste, weight);
  }
  for (const tag of snapshot.situationTags) {
    bump(buckets.situationTags, tag, weight);
  }
  for (const tag of snapshot.dietaryTags) {
    bump(buckets.dietaryTags, tag, weight);
  }
  for (const ingredient of snapshot.mainIngredients) {
    bump(buckets.mainIngredients, ingredient, weight);
  }
  for (const collection of snapshot.collections) {
    bump(buckets.collections, collection, weight);
  }

  if (snapshot.spiceLevel >= 2) {
    buckets.spicyAffinity += weight;
  }
}

export function buildLightPersonalizationProfile(
  favorites: UserPreference[],
  viewedEntries: ViewedRecipeEntry[],
): LightPersonalizationProfile {
  if (favorites.length === 0 && viewedEntries.length === 0) {
    return createEmptyLightPersonalizationProfile();
  }

  const profile: LightPersonalizationProfile = {
    favorite: {
      cuisines: {},
      dishTypes: {},
      tasteProfiles: {},
      situationTags: {},
      dietaryTags: {},
      mainIngredients: {},
      collections: {},
      spicyAffinity: 0,
    },
    viewed: {
      cuisines: {},
      dishTypes: {},
      tasteProfiles: {},
      situationTags: {},
      dietaryTags: {},
      mainIngredients: {},
      collections: {},
      spicyAffinity: 0,
    },
    favoriteRecipeIds: favorites.map((item) => item.recipeId),
    viewedRecipeIds: viewedEntries.map((entry) => entry.recipeId),
    isEmpty: false,
  };

  for (const favorite of favorites) {
    const snapshot = snapshotFromRecipeId(favorite.recipeId);
    if (!snapshot) continue;
    applySnapshotToBuckets(profile.favorite, snapshot, LIGHT_PERSONALIZATION_SIGNAL.favoriteWeight);
  }

  viewedEntries.forEach((entry, index) => {
    const snapshot = snapshotFromRecipeId(entry.recipeId);
    if (!snapshot) return;
    applySnapshotToBuckets(profile.viewed, snapshot, viewedRankSignalWeight(index));
  });

  return profile;
}

export function isLightPersonalizationProfileEmpty(
  profile: LightPersonalizationProfile | undefined,
): boolean {
  return !profile || profile.isEmpty;
}

export function menuMetadataSnapshot(
  metadata: RecipeStandardMetadata,
  collections: CollectionId[],
): RecipeFeatureSnapshot {
  return {
    cuisine: metadata.cuisine,
    dishType: metadata.dishType,
    tasteProfiles: [...metadata.tasteProfile],
    spiceLevel: metadata.spiceLevel,
    situationTags: [...metadata.situationTags],
    dietaryTags: [...metadata.dietaryTags],
    mainIngredients: [...metadata.mainIngredients],
    collections: [...collections],
  };
}
