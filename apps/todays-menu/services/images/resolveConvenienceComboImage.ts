import type { ImageSourcePropType } from 'react-native';
import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import { getConvenienceComboImageSource } from './convenienceComboImageAssets';

/**
 * Resolve optional combo hero image for list + detail.
 * Returns null when no imageKey or no registered production asset — UI keeps accent fallback.
 */
export function resolveConvenienceComboImage(
  combo: ConvenienceCombo,
): ImageSourcePropType | null {
  const key = combo.imageKey?.trim();
  if (!key) return null;
  const source = getConvenienceComboImageSource(key);
  return source ?? null;
}
