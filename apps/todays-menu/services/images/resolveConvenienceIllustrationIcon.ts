import type { ImageSourcePropType } from 'react-native';
import type { ConvenienceIllustrationIconKey } from '../../types/convenienceIllustrationIcon';
import { lookupConvenienceComponentAlias } from '../../data/content/combos/convenienceComponentCatalog';
import {
  getConvenienceIllustrationIconSource,
  isKnownConvenienceIllustrationIconKey,
} from './convenienceIllustrationIconAssets';

/**
 * Resolve a production convenience illustration icon by key.
 * Returns null for unknown keys — no placeholder fallback.
 */
export function resolveConvenienceIllustrationIcon(
  key: ConvenienceIllustrationIconKey | string | null | undefined,
): ImageSourcePropType | null {
  if (!key || !isKnownConvenienceIllustrationIconKey(key)) {
    return null;
  }
  return getConvenienceIllustrationIconSource(key);
}

/**
 * Resolve illustration icon from a raw combo item label via canonical catalog.
 */
export function resolveConvenienceIllustrationIconForLabel(
  rawLabel: string,
): ImageSourcePropType | null {
  const entry = lookupConvenienceComponentAlias(rawLabel);
  if (!entry?.illustrationIconKey) return null;
  return resolveConvenienceIllustrationIcon(entry.illustrationIconKey);
}
