import type { ImageSourcePropType } from 'react-native';

/**
 * Sprint 48-C / 51-B / 53 — convenience combo hero images (HACK + EASY_SET production).
 */
export type ConvenienceComboImageKey =
  | 'bean_sprout_egg_hangover_soup_combo'
  | 'boiled_egg_kim_set'
  | 'burger_fries_set'
  | 'butter_kim_cup_rice_combo'
  | 'cake_ice_cream_parfait_combo'
  | 'cheese_hotdog_combo'
  | 'cheese_spicy_cup_ramen_combo'
  | 'cheese_tteokbokki_hotbar_combo'
  | 'chicken_nugget_plate_set'
  | 'chicken_protein_set'
  | 'chicken_salad_bibim_combo'
  | 'chicken_tender_rice_set'
  | 'commute_lunchbox_set'
  | 'dessert_bread_set'
  | 'fruit_plate_set'
  | 'gimbap_ramen_set'
  | 'gimbap_udon_set'
  | 'hangover_bean_sprout_soup_set'
  | 'hangover_dried_pollack_soup_set'
  | 'hotteok_ice_cream_combo'
  | 'ice_cream_coffee_combo'
  | 'konjac_light_meal_set'
  | 'labokki_combo'
  | 'light_salad_set'
  | 'lunch_sandwich_set'
  | 'lunchbox_cup_rice_set'
  | 'milky_cheese_tteokbokki_combo'
  | 'protein_cup_noodle_combo'
  | 'ramen_rice_ball_set'
  | 'rice_ball_cup_noodle_bibim_combo'
  | 'rice_cake_cheese_ramen_combo'
  | 'salad_chicken_breast_set'
  | 'sandwich_yogurt_set'
  | 'soft_boiled_egg_cup_rice_combo'
  | 'soft_boiled_egg_ramen_combo'
  | 'spicy_cheese_stir_noodles_combo'
  | 'spicy_chicken_feet_set'
  | 'spicy_pepper_ramen_set'
  | 'spicy_sundae_set'
  | 'sundae_plate_set'
  | 'tofu_bibim_rice_ball_set'
  | 'tofu_protein_set'
  | 'tofu_salad_set'
  | 'triangle_kimbap_milk_set'
  | 'triangle_kimbap_rice_noodle_combo'
  | 'triangle_kimbap_triple_set'
  | 'tuna_bibimbap_combo'
  | 'tuna_kim_ramen_combo'
  | 'vegetable_juice_set'
  | 'yogurt_fruit_parfait_combo';

export const KNOWN_CONVENIENCE_COMBO_IMAGE_KEYS: readonly ConvenienceComboImageKey[] = [
  'bean_sprout_egg_hangover_soup_combo',
  'boiled_egg_kim_set',
  'burger_fries_set',
  'butter_kim_cup_rice_combo',
  'cake_ice_cream_parfait_combo',
  'cheese_hotdog_combo',
  'cheese_spicy_cup_ramen_combo',
  'cheese_tteokbokki_hotbar_combo',
  'chicken_nugget_plate_set',
  'chicken_protein_set',
  'chicken_salad_bibim_combo',
  'chicken_tender_rice_set',
  'commute_lunchbox_set',
  'dessert_bread_set',
  'fruit_plate_set',
  'gimbap_ramen_set',
  'gimbap_udon_set',
  'hangover_bean_sprout_soup_set',
  'hangover_dried_pollack_soup_set',
  'hotteok_ice_cream_combo',
  'ice_cream_coffee_combo',
  'konjac_light_meal_set',
  'labokki_combo',
  'light_salad_set',
  'lunch_sandwich_set',
  'lunchbox_cup_rice_set',
  'milky_cheese_tteokbokki_combo',
  'protein_cup_noodle_combo',
  'ramen_rice_ball_set',
  'rice_ball_cup_noodle_bibim_combo',
  'rice_cake_cheese_ramen_combo',
  'salad_chicken_breast_set',
  'sandwich_yogurt_set',
  'soft_boiled_egg_cup_rice_combo',
  'soft_boiled_egg_ramen_combo',
  'spicy_cheese_stir_noodles_combo',
  'spicy_chicken_feet_set',
  'spicy_pepper_ramen_set',
  'spicy_sundae_set',
  'sundae_plate_set',
  'tofu_bibim_rice_ball_set',
  'tofu_protein_set',
  'tofu_salad_set',
  'triangle_kimbap_milk_set',
  'triangle_kimbap_rice_noodle_combo',
  'triangle_kimbap_triple_set',
  'tuna_bibimbap_combo',
  'tuna_kim_ramen_combo',
  'vegetable_juice_set',
  'yogurt_fruit_parfait_combo',
] as const;

export const CONVENIENCE_COMBO_IMAGE_ASSETS: Partial<
  Record<ConvenienceComboImageKey, ImageSourcePropType>
> = {
  bean_sprout_egg_hangover_soup_combo: require('../../assets/convenience-combos/bean_sprout_egg_hangover_soup_combo.jpg'),
  boiled_egg_kim_set: require('../../assets/convenience-combos/boiled_egg_kim_set.jpg'),
  burger_fries_set: require('../../assets/convenience-combos/burger_fries_set.jpg'),
  butter_kim_cup_rice_combo: require('../../assets/convenience-combos/butter_kim_cup_rice_combo.jpg'),
  cake_ice_cream_parfait_combo: require('../../assets/convenience-combos/cake_ice_cream_parfait_combo.jpg'),
  cheese_hotdog_combo: require('../../assets/convenience-combos/cheese_hotdog_combo.jpg'),
  cheese_spicy_cup_ramen_combo: require('../../assets/convenience-combos/cheese_spicy_cup_ramen_combo.jpg'),
  cheese_tteokbokki_hotbar_combo: require('../../assets/convenience-combos/cheese_tteokbokki_hotbar_combo.jpg'),
  chicken_nugget_plate_set: require('../../assets/convenience-combos/chicken_nugget_plate_set.jpg'),
  chicken_protein_set: require('../../assets/convenience-combos/chicken_protein_set.jpg'),
  chicken_salad_bibim_combo: require('../../assets/convenience-combos/chicken_salad_bibim_combo.jpg'),
  chicken_tender_rice_set: require('../../assets/convenience-combos/chicken_tender_rice_set.jpg'),
  commute_lunchbox_set: require('../../assets/convenience-combos/commute_lunchbox_set.jpg'),
  dessert_bread_set: require('../../assets/convenience-combos/dessert_bread_set.jpg'),
  fruit_plate_set: require('../../assets/convenience-combos/fruit_plate_set.jpg'),
  gimbap_ramen_set: require('../../assets/convenience-combos/gimbap_ramen_set.jpg'),
  gimbap_udon_set: require('../../assets/convenience-combos/gimbap_udon_set.jpg'),
  hangover_bean_sprout_soup_set: require('../../assets/convenience-combos/hangover_bean_sprout_soup_set.jpg'),
  hangover_dried_pollack_soup_set: require('../../assets/convenience-combos/hangover_dried_pollack_soup_set.jpg'),
  hotteok_ice_cream_combo: require('../../assets/convenience-combos/hotteok_ice_cream_combo.jpg'),
  ice_cream_coffee_combo: require('../../assets/convenience-combos/ice_cream_coffee_combo.jpg'),
  konjac_light_meal_set: require('../../assets/convenience-combos/konjac_light_meal_set.jpg'),
  labokki_combo: require('../../assets/convenience-combos/labokki_combo.jpg'),
  light_salad_set: require('../../assets/convenience-combos/light_salad_set.jpg'),
  lunch_sandwich_set: require('../../assets/convenience-combos/lunch_sandwich_set.jpg'),
  lunchbox_cup_rice_set: require('../../assets/convenience-combos/lunchbox_cup_rice_set.jpg'),
  milky_cheese_tteokbokki_combo: require('../../assets/convenience-combos/milky_cheese_tteokbokki_combo.jpg'),
  protein_cup_noodle_combo: require('../../assets/convenience-combos/protein_cup_noodle_combo.jpg'),
  ramen_rice_ball_set: require('../../assets/convenience-combos/ramen_rice_ball_set.jpg'),
  rice_ball_cup_noodle_bibim_combo: require('../../assets/convenience-combos/rice_ball_cup_noodle_bibim_combo.jpg'),
  rice_cake_cheese_ramen_combo: require('../../assets/convenience-combos/rice_cake_cheese_ramen_combo.jpg'),
  salad_chicken_breast_set: require('../../assets/convenience-combos/salad_chicken_breast_set.jpg'),
  sandwich_yogurt_set: require('../../assets/convenience-combos/sandwich_yogurt_set.jpg'),
  soft_boiled_egg_cup_rice_combo: require('../../assets/convenience-combos/soft_boiled_egg_cup_rice_combo.jpg'),
  soft_boiled_egg_ramen_combo: require('../../assets/convenience-combos/soft_boiled_egg_ramen_combo.jpg'),
  spicy_cheese_stir_noodles_combo: require('../../assets/convenience-combos/spicy_cheese_stir_noodles_combo.jpg'),
  spicy_chicken_feet_set: require('../../assets/convenience-combos/spicy_chicken_feet_set.jpg'),
  spicy_pepper_ramen_set: require('../../assets/convenience-combos/spicy_pepper_ramen_set.jpg'),
  spicy_sundae_set: require('../../assets/convenience-combos/spicy_sundae_set.jpg'),
  sundae_plate_set: require('../../assets/convenience-combos/sundae_plate_set.jpg'),
  tofu_bibim_rice_ball_set: require('../../assets/convenience-combos/tofu_bibim_rice_ball_set.jpg'),
  tofu_protein_set: require('../../assets/convenience-combos/tofu_protein_set.jpg'),
  tofu_salad_set: require('../../assets/convenience-combos/tofu_salad_set.jpg'),
  triangle_kimbap_milk_set: require('../../assets/convenience-combos/triangle_kimbap_milk_set.jpg'),
  triangle_kimbap_rice_noodle_combo: require('../../assets/convenience-combos/triangle_kimbap_rice_noodle_combo.jpg'),
  triangle_kimbap_triple_set: require('../../assets/convenience-combos/triangle_kimbap_triple_set.jpg'),
  tuna_bibimbap_combo: require('../../assets/convenience-combos/tuna_bibimbap_combo.jpg'),
  tuna_kim_ramen_combo: require('../../assets/convenience-combos/tuna_kim_ramen_combo.jpg'),
  vegetable_juice_set: require('../../assets/convenience-combos/vegetable_juice_set.jpg'),
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
