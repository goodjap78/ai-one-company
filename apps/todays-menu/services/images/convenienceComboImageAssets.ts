import type { ImageSourcePropType } from 'react-native';

/**
 * Sprint 48-C / 51-B — convenience combo hero images (HACK_COMBO production only).
 */
export type ConvenienceComboImageKey =
  | 'bean_sprout_egg_hangover_soup_combo'
  | 'butter_kim_cup_rice_combo'
  | 'cake_ice_cream_parfait_combo'
  | 'cheese_hotdog_combo'
  | 'cheese_spicy_cup_ramen_combo'
  | 'cheese_tteokbokki_hotbar_combo'
  | 'chicken_salad_bibim_combo'
  | 'hotteok_ice_cream_combo'
  | 'ice_cream_coffee_combo'
  | 'labokki_combo'
  | 'milky_cheese_tteokbokki_combo'
  | 'protein_cup_noodle_combo'
  | 'rice_ball_cup_noodle_bibim_combo'
  | 'rice_cake_cheese_ramen_combo'
  | 'soft_boiled_egg_cup_rice_combo'
  | 'soft_boiled_egg_ramen_combo'
  | 'spicy_cheese_stir_noodles_combo'
  | 'triangle_kimbap_rice_noodle_combo'
  | 'tuna_bibimbap_combo'
  | 'tuna_kim_ramen_combo'
  | 'yogurt_fruit_parfait_combo';

export const KNOWN_CONVENIENCE_COMBO_IMAGE_KEYS: readonly ConvenienceComboImageKey[] = [
  'bean_sprout_egg_hangover_soup_combo',
  'butter_kim_cup_rice_combo',
  'cake_ice_cream_parfait_combo',
  'cheese_hotdog_combo',
  'cheese_spicy_cup_ramen_combo',
  'cheese_tteokbokki_hotbar_combo',
  'chicken_salad_bibim_combo',
  'hotteok_ice_cream_combo',
  'ice_cream_coffee_combo',
  'labokki_combo',
  'milky_cheese_tteokbokki_combo',
  'protein_cup_noodle_combo',
  'rice_ball_cup_noodle_bibim_combo',
  'rice_cake_cheese_ramen_combo',
  'soft_boiled_egg_cup_rice_combo',
  'soft_boiled_egg_ramen_combo',
  'spicy_cheese_stir_noodles_combo',
  'triangle_kimbap_rice_noodle_combo',
  'tuna_bibimbap_combo',
  'tuna_kim_ramen_combo',
  'yogurt_fruit_parfait_combo',
] as const;

export const CONVENIENCE_COMBO_IMAGE_ASSETS: Partial<
  Record<ConvenienceComboImageKey, ImageSourcePropType>
> = {
  bean_sprout_egg_hangover_soup_combo: require('../../assets/convenience-combos/bean_sprout_egg_hangover_soup_combo.jpg'),
  butter_kim_cup_rice_combo: require('../../assets/convenience-combos/butter_kim_cup_rice_combo.jpg'),
  cake_ice_cream_parfait_combo: require('../../assets/convenience-combos/cake_ice_cream_parfait_combo.jpg'),
  cheese_hotdog_combo: require('../../assets/convenience-combos/cheese_hotdog_combo.jpg'),
  cheese_spicy_cup_ramen_combo: require('../../assets/convenience-combos/cheese_spicy_cup_ramen_combo.jpg'),
  cheese_tteokbokki_hotbar_combo: require('../../assets/convenience-combos/cheese_tteokbokki_hotbar_combo.jpg'),
  chicken_salad_bibim_combo: require('../../assets/convenience-combos/chicken_salad_bibim_combo.jpg'),
  hotteok_ice_cream_combo: require('../../assets/convenience-combos/hotteok_ice_cream_combo.jpg'),
  ice_cream_coffee_combo: require('../../assets/convenience-combos/ice_cream_coffee_combo.jpg'),
  labokki_combo: require('../../assets/convenience-combos/labokki_combo.jpg'),
  milky_cheese_tteokbokki_combo: require('../../assets/convenience-combos/milky_cheese_tteokbokki_combo.jpg'),
  protein_cup_noodle_combo: require('../../assets/convenience-combos/protein_cup_noodle_combo.jpg'),
  rice_ball_cup_noodle_bibim_combo: require('../../assets/convenience-combos/rice_ball_cup_noodle_bibim_combo.jpg'),
  rice_cake_cheese_ramen_combo: require('../../assets/convenience-combos/rice_cake_cheese_ramen_combo.jpg'),
  soft_boiled_egg_cup_rice_combo: require('../../assets/convenience-combos/soft_boiled_egg_cup_rice_combo.jpg'),
  soft_boiled_egg_ramen_combo: require('../../assets/convenience-combos/soft_boiled_egg_ramen_combo.jpg'),
  spicy_cheese_stir_noodles_combo: require('../../assets/convenience-combos/spicy_cheese_stir_noodles_combo.jpg'),
  triangle_kimbap_rice_noodle_combo: require('../../assets/convenience-combos/triangle_kimbap_rice_noodle_combo.jpg'),
  tuna_bibimbap_combo: require('../../assets/convenience-combos/tuna_bibimbap_combo.jpg'),
  tuna_kim_ramen_combo: require('../../assets/convenience-combos/tuna_kim_ramen_combo.jpg'),
  yogurt_fruit_parfait_combo: require('../../assets/convenience-combos/yogurt_fruit_parfait_combo.jpg'),
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
