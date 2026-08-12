/**
 * Sprint 62-C — Lightweight preference profile from favorites + viewed history.
 */
export type LightPersonalizationFeatureBuckets = {
  cuisines: Record<string, number>;
  dishTypes: Record<string, number>;
  tasteProfiles: Record<string, number>;
  situationTags: Record<string, number>;
  dietaryTags: Record<string, number>;
  mainIngredients: Record<string, number>;
  collections: Record<string, number>;
  spicyAffinity: number;
};

export type LightPersonalizationProfile = {
  favorite: LightPersonalizationFeatureBuckets;
  viewed: LightPersonalizationFeatureBuckets;
  favoriteRecipeIds: string[];
  viewedRecipeIds: string[];
  isEmpty: boolean;
};

export const LIGHT_PERSONALIZATION_MAX_BONUS = 8;

export const LIGHT_PERSONALIZATION_SIGNAL = {
  favoriteWeight: 1.0,
  viewedStrong: 0.5,
  viewedMedium: 0.4,
  viewedWeak: 0.3,
  /** Viewed buckets contribute at most this fraction vs favorite on the same dimension. */
  viewedScoreMultiplier: 0.55,
} as const;

export type LightPersonalizationScoreResult = {
  points: number;
  label: string | null;
  key: string | null;
};

function emptyBuckets(): LightPersonalizationFeatureBuckets {
  return {
    cuisines: {},
    dishTypes: {},
    tasteProfiles: {},
    situationTags: {},
    dietaryTags: {},
    mainIngredients: {},
    collections: {},
    spicyAffinity: 0,
  };
}

export function createEmptyLightPersonalizationProfile(): LightPersonalizationProfile {
  return {
    favorite: emptyBuckets(),
    viewed: emptyBuckets(),
    favoriteRecipeIds: [],
    viewedRecipeIds: [],
    isEmpty: true,
  };
}
