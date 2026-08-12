import type { MealMode } from '../../types/home';
import type { RecipeImage } from '../../types/recipe';
import { getCoreRecipeById } from '../../data/recipes';
import { getRecipeImageMapEntry } from '../../data/recipes/recipeImageMap';
import { getLocalMealImageSource } from './mealImageAssets';
import { getMealImageRegistryEntry } from './mealImageRegistry';
import type { MealImageSourceType, MealLocalAssetKey, ResolvedMealImage } from './mealImageTypes';

const MODE_FALLBACK_EMOJI: Record<MealMode, string> = {
  homemade: '🍳',
  delivery: '🚚',
};

/** Mascot / non-food key — never used as a meal hero photo. */
const MASCOT_PLACEHOLDER_KEY = 'hankki-default';

type ResolveOptions = {
  mealMode?: MealMode;
  /** Explicit remote override (e.g. recommendation DTO imageUrl) */
  remoteUrl?: string | null;
  /** Explicit local asset from recipe.image.source */
  localSource?: RecipeImage['source'];
  emoji?: string;
  accessibilityLabel?: string;
  /** Optional display name for dev logging */
  recipeName?: string;
};

function isValidRemoteUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function isFoodAssetKey(key: string | undefined | null): key is MealLocalAssetKey {
  return Boolean(
    key &&
      key !== MASCOT_PLACEHOLDER_KEY &&
      !String(key).startsWith('category_'),
  );
}

function toResolved(
  emoji: string,
  source: ResolvedMealImage['source'],
  url: string | null | undefined,
  accessibilityLabel: string,
  sourceType: MealImageSourceType,
): ResolvedMealImage {
  return {
    emoji,
    source,
    url: url ?? null,
    accessibilityLabel,
    sourceType,
  };
}

function resolveEmoji(mealId: string, options: ResolveOptions): string {
  const mealMode = options.mealMode ?? 'homemade';
  if (options.emoji) return options.emoji;

  const entry = getMealImageRegistryEntry(mealId);
  if (entry?.emoji) return entry.emoji;

  if (mealId.startsWith('core_')) {
    const goldEntry = getMealImageRegistryEntry(`gold_${mealId.slice('core_'.length)}`);
    if (goldEntry?.emoji) return goldEntry.emoji;

    if (mealId === 'core_c_jjajangmyeon') {
      const jajang = getMealImageRegistryEntry('gold_c_jajangmyeon');
      if (jajang?.emoji) return jajang.emoji;
    }
  }

  const core = getCoreRecipeById(mealId);
  if (core?.emoji) return core.emoji;

  return MODE_FALLBACK_EMOJI[mealMode];
}

function logResolveDev(
  mealId: string,
  recipeName: string | undefined,
  sourceType: MealImageSourceType,
): void {
  if (!__DEV__) return;
  const name =
    recipeName ??
    getCoreRecipeById(mealId)?.name ??
    getMealImageRegistryEntry(mealId)?.mealId ??
    mealId;
  console.log('[mealImage]', { recipeId: mealId, recipeName: name, sourceType });
}

/**
 * Meal image resolver (Sprint H7).
 *
 * Priority:
 * A. recipe.image local asset
 * B. recipe.imageUrl if valid
 * C. central recipe image map by recipe id (exact dish only)
 * D. registry local food key for the same id (never mascot / category / other dish)
 * E. clean placeholder only — never another recipe's photo
 */
export function resolveMealImage(
  mealId: string,
  options: ResolveOptions = {},
): ResolvedMealImage {
  const emoji = resolveEmoji(mealId, options);
  const label = options.accessibilityLabel ?? `${emoji} 메뉴 이미지`;

  // A — explicit local asset from recipe.image
  if (options.localSource) {
    const resolved = toResolved(emoji, options.localSource, null, label, 'local_asset');
    logResolveDev(mealId, options.recipeName, 'local_asset');
    return resolved;
  }

  // B — valid remote URL (DTO / registry override)
  const entry = getMealImageRegistryEntry(mealId);
  const goldAliasId = mealId.startsWith('core_')
    ? mealId === 'core_c_jjajangmyeon'
      ? 'gold_c_jajangmyeon'
      : `gold_${mealId.slice('core_'.length)}`
    : undefined;
  const goldAlias = goldAliasId ? getMealImageRegistryEntry(goldAliasId) : undefined;
  const remoteUrl = options.remoteUrl ?? entry?.remoteUrl ?? goldAlias?.remoteUrl ?? null;
  if (isValidRemoteUrl(remoteUrl)) {
    const resolved = toResolved(emoji, undefined, remoteUrl, label, 'image_url');
    logResolveDev(mealId, options.recipeName, 'image_url');
    return resolved;
  }

  // C — central recipe image map (exact dish only)
  const known = getRecipeImageMapEntry(mealId);
  if (known?.kind === 'local') {
    const resolved = toResolved(
      emoji,
      getLocalMealImageSource(known.key),
      null,
      label,
      'known_map_local',
    );
    logResolveDev(mealId, options.recipeName, 'known_map_local');
    return resolved;
  }
  if (known?.kind === 'remote' && isValidRemoteUrl(known.url)) {
    const resolved = toResolved(emoji, undefined, known.url, label, 'known_map_remote');
    logResolveDev(mealId, options.recipeName, 'known_map_remote');
    return resolved;
  }

  // D — registry local food key (same dish id only — never mascot / category)
  const registryKey = entry?.localAssetKey ?? goldAlias?.localAssetKey;
  if (isFoodAssetKey(registryKey)) {
    const resolved = toResolved(
      emoji,
      getLocalMealImageSource(registryKey),
      null,
      label,
      'known_map_local',
    );
    logResolveDev(mealId, options.recipeName, 'known_map_local');
    return resolved;
  }

  // E — clean placeholder only (no wrong-food / no category dish photo)
  const placeholder = toResolved(emoji, undefined, null, label, 'placeholder');
  logResolveDev(mealId, options.recipeName, 'placeholder');
  return placeholder;
}

export function toRecipeImage(resolved: ResolvedMealImage): RecipeImage {
  return {
    emoji: resolved.emoji,
    url: resolved.url,
    source: resolved.source,
    accessibilityLabel: resolved.accessibilityLabel,
  };
}

export function resolveMealImageAsRecipe(
  mealId: string,
  options: ResolveOptions = {},
): RecipeImage {
  return toRecipeImage(resolveMealImage(mealId, options));
}
