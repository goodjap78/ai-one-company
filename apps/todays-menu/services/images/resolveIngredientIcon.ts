import type { ImageSourcePropType } from 'react-native';
import {
  categoryForIconKey,
  compactIngredientName,
  fallbackKeyForCategory,
  inferIngredientIconCategory,
  lookupIngredientAlias,
  normalizeIngredientName,
  type IngredientIconCategory,
} from '../../data/ingredients/ingredientAliases';
import { resolveIngredient } from '../ingredient/resolveIngredient';
import {
  getIngredientImageSource,
  INGREDIENT_ID_TO_ICON_KEY,
  isKnownIngredientImageKey,
  type IngredientImageKey,
} from './ingredientImageAssets';

export type ResolveIngredientIconInput =
  | string
  | {
      name?: string | null;
      iconKey?: string | null;
      canonicalName?: string | null;
      ingredientId?: string | null;
      tags?: string[];
      group?: string | null;
    };

export type ResolvedIngredientIconMeta = {
  /** Resolved registry key (specific or fallback_*). */
  iconKey: string;
  category: IngredientIconCategory;
  /** How the key was chosen. */
  source: 'explicit' | 'normalized' | 'alias' | 'category' | 'generic';
  /** Specific key requested before fallback (for missing-asset logs). */
  requestedKey: string | null;
};

function asFields(input: ResolveIngredientIconInput): {
  name: string;
  iconKey: string;
  canonicalName: string;
  ingredientId: string;
} {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (isKnownIngredientImageKey(trimmed) || /^[a-z][a-z0-9_]*$/.test(trimmed)) {
      return { name: '', iconKey: trimmed, canonicalName: '', ingredientId: '' };
    }
    return { name: trimmed, iconKey: '', canonicalName: '', ingredientId: '' };
  }

  return {
    name: (input.name ?? '').trim(),
    iconKey: (input.iconKey ?? '').trim(),
    canonicalName: (input.canonicalName ?? '').trim(),
    ingredientId: (input.ingredientId ?? '').trim(),
  };
}

function tryNormalizedNameAsKey(name: string): string | null {
  if (!name) return null;
  const normalized = normalizeIngredientName(name);
  const underscored = compactIngredientName(name).replace(/-/g, '_');

  if (isKnownIngredientImageKey(normalized)) return normalized;
  if (isKnownIngredientImageKey(underscored)) return underscored;
  return null;
}

/**
 * Resolve iconKey only (A → C). Category/generic keys are applied when loading assets.
 */
export function resolveIngredientIconMeta(
  input: ResolveIngredientIconInput,
): ResolvedIngredientIconMeta {
  const fields = asFields(input);

  // A. explicit ingredient.iconKey
  if (fields.iconKey) {
    return {
      iconKey: fields.iconKey,
      category: categoryForIconKey(fields.iconKey),
      source: 'explicit',
      requestedKey: fields.iconKey,
    };
  }

  const displayName = fields.name || fields.canonicalName;

  // B. normalized ingredient name is already an icon key
  const fromNormalized = tryNormalizedNameAsKey(displayName);
  if (fromNormalized) {
    return {
      iconKey: fromNormalized,
      category: categoryForIconKey(fromNormalized),
      source: 'normalized',
      requestedKey: fromNormalized,
    };
  }

  // C. alias map (+ IIE id / canonical as alias helpers)
  const fromAlias =
    lookupIngredientAlias(displayName) ||
    (fields.canonicalName ? lookupIngredientAlias(fields.canonicalName) : null);

  if (fromAlias) {
    return {
      iconKey: fromAlias,
      category: categoryForIconKey(fromAlias),
      source: 'alias',
      requestedKey: fromAlias,
    };
  }

  if (fields.ingredientId && INGREDIENT_ID_TO_ICON_KEY[fields.ingredientId]) {
    const key = INGREDIENT_ID_TO_ICON_KEY[fields.ingredientId];
    return {
      iconKey: key,
      category: categoryForIconKey(key),
      source: 'alias',
      requestedKey: key,
    };
  }

  if (displayName) {
    const iie = resolveIngredient(displayName);
    if (iie.ingredientId && INGREDIENT_ID_TO_ICON_KEY[iie.ingredientId]) {
      const key = INGREDIENT_ID_TO_ICON_KEY[iie.ingredientId];
      return {
        iconKey: key,
        category: categoryForIconKey(key),
        source: 'alias',
        requestedKey: key,
      };
    }
    const canonicalAlias = lookupIngredientAlias(iie.canonicalName);
    if (canonicalAlias) {
      return {
        iconKey: canonicalAlias,
        category: categoryForIconKey(canonicalAlias),
        source: 'alias',
        requestedKey: canonicalAlias,
      };
    }
  }

  // D / E — no specific key; category then generic (asset layer picks fallback_*)
  const category = inferIngredientIconCategory(displayName || fields.iconKey);
  const categoryKey = fallbackKeyForCategory(category);
  return {
    iconKey: categoryKey,
    category,
    source: category === 'generic' ? 'generic' : 'category',
    requestedKey: null,
  };
}

/** Stable iconKey string for list keys / debugging (specific when known). */
export function resolveIngredientIconKey(input: ResolveIngredientIconInput): string {
  return resolveIngredientIconMeta(input).iconKey;
}

const loggedMissingKeys = new Set<string>();

function logMissingIngredientIcon(key: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (loggedMissingKeys.has(key)) return;
  loggedMissingKeys.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[ingredient-icon] missing asset for key: ${key}`);
}

/**
 * Resolve a local image asset for an ingredient.
 * Order: A explicit → B normalized name → C alias → D category fallback → E generic.
 * Never returns a broken image source; null means UI soft fallback.
 */
export function resolveIngredientIcon(
  input: ResolveIngredientIconInput,
): ImageSourcePropType | null {
  const meta = resolveIngredientIconMeta(input);

  if (meta.requestedKey) {
    const specific = getIngredientImageSource(meta.requestedKey);
    if (specific) return specific;
    logMissingIngredientIcon(meta.requestedKey);
  }

  // D. category fallback
  const categoryKey = fallbackKeyForCategory(meta.category) as IngredientImageKey;
  const categoryAsset = getIngredientImageSource(categoryKey);
  if (categoryAsset) return categoryAsset;

  // E. generic fallback
  const generic = getIngredientImageSource('fallback_generic');
  if (generic) return generic;

  return null;
}
