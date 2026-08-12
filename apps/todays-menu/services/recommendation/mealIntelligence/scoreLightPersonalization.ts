import type { MenuItem } from '../../../types/recommendation';
import {
  LIGHT_PERSONALIZATION_MAX_BONUS,
  LIGHT_PERSONALIZATION_SIGNAL,
  type LightPersonalizationFeatureBuckets,
  type LightPersonalizationProfile,
  type LightPersonalizationScoreResult,
} from '../../../types/lightPersonalization';
import { resolveMenuAiRecipeContext } from './resolveMenuStandardMetadata';
import {
  isLightPersonalizationProfileEmpty,
  menuMetadataSnapshot,
} from './lightPersonalizationProfile';

const DIMENSION_CAPS = {
  cuisine: 2.5,
  dishType: 2.5,
  spicy: 2,
  quick: 1.5,
  collection: 1.5,
  ingredient: 1,
} as const;

function bucketStrength(map: Record<string, number>, key: string): number {
  if (!key) return 0;
  const value = map[key] ?? 0;
  if (value <= 0) return 0;
  const max = Math.max(...Object.values(map), 0);
  if (max <= 0) return 0;
  return value / max;
}

function combinedStrength(
  favoriteBuckets: LightPersonalizationFeatureBuckets,
  viewedBuckets: LightPersonalizationFeatureBuckets,
  map: 'cuisines' | 'dishTypes' | 'tasteProfiles' | 'situationTags' | 'dietaryTags' | 'mainIngredients' | 'collections',
  key: string,
): number {
  const favoriteStrength = bucketStrength(favoriteBuckets[map], key);
  const viewedStrength = bucketStrength(viewedBuckets[map], key);
  return Math.max(
    favoriteStrength,
    viewedStrength * LIGHT_PERSONALIZATION_SIGNAL.viewedScoreMultiplier,
  );
}

function spicyCombinedStrength(profile: LightPersonalizationProfile): number {
  const favoriteSpicyTaste = bucketStrength(profile.favorite.tasteProfiles, 'spicy');
  const viewedSpicyTaste =
    bucketStrength(profile.viewed.tasteProfiles, 'spicy') *
    LIGHT_PERSONALIZATION_SIGNAL.viewedScoreMultiplier;
  const favoriteLevel =
    profile.favorite.spicyAffinity > 0
      ? Math.min(1, profile.favorite.spicyAffinity / (profile.favorite.spicyAffinity + 0.5))
      : 0;
  const viewedLevel =
    profile.viewed.spicyAffinity > 0
      ? Math.min(1, profile.viewed.spicyAffinity / (profile.viewed.spicyAffinity + 0.5)) *
        LIGHT_PERSONALIZATION_SIGNAL.viewedScoreMultiplier
      : 0;
  return Math.max(favoriteSpicyTaste, viewedSpicyTaste, favoriteLevel, viewedLevel);
}

function buildExplanation(
  profile: LightPersonalizationProfile,
  snapshot: ReturnType<typeof menuMetadataSnapshot>,
): string | null {
  const spicyStrength = spicyCombinedStrength(profile);
  const isSpicyMenu =
    snapshot.spiceLevel >= 2 ||
    snapshot.tasteProfiles.includes('spicy') ||
    snapshot.tasteProfiles.includes('rich');

  if (spicyStrength >= 0.45 && isSpicyMenu) {
    return '전에 좋아했던 매콤한 메뉴랑 비슷해요!';
  }

  const noodleStrength = combinedStrength(profile.favorite, profile.viewed, 'dishTypes', 'noodle');
  if (noodleStrength >= 0.45 && snapshot.dishType === 'noodle') {
    return '최근에 이런 면 요리를 자주 봤어요.';
  }

  const riceBowlStrength = Math.max(
    combinedStrength(profile.favorite, profile.viewed, 'dishTypes', 'rice_bowl'),
    combinedStrength(profile.favorite, profile.viewed, 'dishTypes', 'rice'),
  );
  if (riceBowlStrength >= 0.45 && (snapshot.dishType === 'rice_bowl' || snapshot.dishType === 'rice')) {
    return '최근에 이런 한 그릇 메뉴를 자주 봤어요.';
  }

  const soupStrength = Math.max(
    combinedStrength(profile.favorite, profile.viewed, 'dishTypes', 'soup'),
    combinedStrength(profile.favorite, profile.viewed, 'dishTypes', 'stew'),
  );
  if (soupStrength >= 0.45 && (snapshot.dishType === 'soup' || snapshot.dishType === 'stew')) {
    return '최근에 국물 메뉴를 자주 봤어요.';
  }

  const quickStrength = combinedStrength(profile.favorite, profile.viewed, 'situationTags', 'quick_meal');
  if (quickStrength >= 0.45 && snapshot.situationTags.includes('quick_meal')) {
    return '자주 찾던 가볍고 빠른 메뉴와 비슷해요.';
  }

  return null;
}

/**
 * Similarity bonus only — never boosts the exact favorite/viewed recipe id.
 */
export function scoreLightPersonalization(
  menu: MenuItem,
  profile: LightPersonalizationProfile | undefined,
): LightPersonalizationScoreResult {
  if (isLightPersonalizationProfileEmpty(profile)) {
    return { points: 0, label: null, key: null };
  }

  const activeProfile = profile!;
  if (activeProfile.favoriteRecipeIds.includes(menu.id)) {
    return { points: 0, label: null, key: null };
  }
  if (activeProfile.viewedRecipeIds.includes(menu.id)) {
    return { points: 0, label: null, key: null };
  }

  const { recipe, metadata } = resolveMenuAiRecipeContext(menu);
  if (!metadata || !recipe) {
    return { points: 0, label: null, key: null };
  }

  const snapshot = menuMetadataSnapshot(metadata, recipe.collectionIds);
  const favoriteBuckets = activeProfile.favorite;
  const viewedBuckets = activeProfile.viewed;

  let raw = 0;
  raw +=
    combinedStrength(favoriteBuckets, viewedBuckets, 'cuisines', snapshot.cuisine) * DIMENSION_CAPS.cuisine;
  raw +=
    combinedStrength(favoriteBuckets, viewedBuckets, 'dishTypes', snapshot.dishType) * DIMENSION_CAPS.dishType;
  raw +=
    spicyCombinedStrength(activeProfile) *
    (snapshot.spiceLevel >= 2 || snapshot.tasteProfiles.includes('spicy') ? DIMENSION_CAPS.spicy : 0);
  raw +=
    combinedStrength(favoriteBuckets, viewedBuckets, 'situationTags', 'quick_meal') *
    (snapshot.situationTags.includes('quick_meal') ? DIMENSION_CAPS.quick : 0);

  let collectionMatch = 0;
  for (const collection of snapshot.collections) {
    collectionMatch = Math.max(
      collectionMatch,
      combinedStrength(favoriteBuckets, viewedBuckets, 'collections', collection),
    );
  }
  raw += collectionMatch * DIMENSION_CAPS.collection;

  let ingredientMatch = 0;
  for (const ingredient of snapshot.mainIngredients) {
    ingredientMatch = Math.max(
      ingredientMatch,
      combinedStrength(favoriteBuckets, viewedBuckets, 'mainIngredients', ingredient),
    );
  }
  raw += ingredientMatch * DIMENSION_CAPS.ingredient;

  const maxRaw =
    DIMENSION_CAPS.cuisine +
    DIMENSION_CAPS.dishType +
    DIMENSION_CAPS.spicy +
    DIMENSION_CAPS.quick +
    DIMENSION_CAPS.collection +
    DIMENSION_CAPS.ingredient;

  if (raw <= 0) {
    return { points: 0, label: null, key: null };
  }

  const normalized = raw / maxRaw;
  const points = Math.min(
    LIGHT_PERSONALIZATION_MAX_BONUS,
    Math.round(normalized * LIGHT_PERSONALIZATION_MAX_BONUS),
  );

  if (points <= 0) {
    return { points: 0, label: null, key: null };
  }

  const label = buildExplanation(activeProfile, snapshot);
  const key = label ? 'light_personalization' : 'light_personalization_signal';

  return { points, label, key };
}
