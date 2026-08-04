import type { ImageSourcePropType } from 'react-native';

/**
 * Sprint 48-C — convenience combo hero images (separate from recipe meal heroes).
 * Register keys only after approve copies JPG into assets/convenience-combos/.
 */
export type ConvenienceComboImageKey =
  | 'spicy_cheese_stir_noodles_combo'
  | 'triangle_kimbap_rice_noodle_combo'
  | 'ice_cream_coffee_combo';

export const KNOWN_CONVENIENCE_COMBO_IMAGE_KEYS: readonly ConvenienceComboImageKey[] = [
  'spicy_cheese_stir_noodles_combo',
  'triangle_kimbap_rice_noodle_combo',
  'ice_cream_coffee_combo',
] as const;

export const CONVENIENCE_COMBO_IMAGE_ASSETS: Partial<
  Record<ConvenienceComboImageKey, ImageSourcePropType>
> = {
  ice_cream_coffee_combo: require('../../assets/convenience-combos/ice_cream_coffee_combo.jpg'),
  spicy_cheese_stir_noodles_combo: require('../../assets/convenience-combos/spicy_cheese_stir_noodles_combo.jpg'),
  triangle_kimbap_rice_noodle_combo: require('../../assets/convenience-combos/triangle_kimbap_rice_noodle_combo.jpg'),
};

export function getConvenienceComboImageSource(
  imageKey: string,
): ImageSourcePropType | undefined {
  return (CONVENIENCE_COMBO_IMAGE_ASSETS as Record<string, ImageSourcePropType>)[
    imageKey
  ];
}

export function isKnownConvenienceComboImageKey(
  imageKey: string,
): imageKey is ConvenienceComboImageKey {
  return KNOWN_CONVENIENCE_COMBO_IMAGE_KEYS.includes(
    imageKey as ConvenienceComboImageKey,
  );
}
