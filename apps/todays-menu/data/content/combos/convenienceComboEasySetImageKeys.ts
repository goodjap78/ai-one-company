/**
 * Sprint 53 — stable imageKey map for all 29 EASY_SET combos.
 * Factory uses this map for queue, prompts, and review generation.
 * Production registry / enrichment patch applied only after human approval per batch.
 */
export const COMBO_EASY_SET_IMAGE_KEY_MAP = {
  combo_0002: 'lunchbox_cup_rice_set',
  combo_0003: 'burger_fries_set',
  combo_0004: 'sandwich_yogurt_set',
  combo_0005: 'gimbap_udon_set',
  combo_0006: 'chicken_tender_rice_set',
  combo_0007: 'tofu_bibim_rice_ball_set',
  combo_0009: 'salad_chicken_breast_set',
  combo_0012: 'triangle_kimbap_triple_set',
  combo_0014: 'sundae_plate_set',
  combo_0017: 'ramen_rice_ball_set',
  combo_0018: 'chicken_nugget_plate_set',
  combo_0019: 'spicy_pepper_ramen_set',
  combo_0022: 'spicy_sundae_set',
  combo_0024: 'spicy_chicken_feet_set',
  combo_0026: 'triangle_kimbap_milk_set',
  combo_0029: 'commute_lunchbox_set',
  combo_0030: 'lunch_sandwich_set',
  combo_0032: 'gimbap_ramen_set',
  combo_0033: 'light_salad_set',
  combo_0034: 'fruit_plate_set',
  combo_0035: 'tofu_salad_set',
  combo_0036: 'vegetable_juice_set',
  combo_0037: 'konjac_light_meal_set',
  combo_0040: 'boiled_egg_kim_set',
  combo_0042: 'tofu_protein_set',
  combo_0043: 'chicken_protein_set',
  combo_0045: 'dessert_bread_set',
  combo_0048: 'hangover_bean_sprout_soup_set',
  combo_0049: 'hangover_dried_pollack_soup_set',
} as const;

export type ComboEasySetId = keyof typeof COMBO_EASY_SET_IMAGE_KEY_MAP;
export type ComboEasySetImageKey = (typeof COMBO_EASY_SET_IMAGE_KEY_MAP)[ComboEasySetId];

export const COMBO_EASY_SET_COMBO_IDS = Object.keys(
  COMBO_EASY_SET_IMAGE_KEY_MAP,
) as ComboEasySetId[];

export function isComboEasySetId(id: string): id is ComboEasySetId {
  return id in COMBO_EASY_SET_IMAGE_KEY_MAP;
}

export function comboEasySetImageKeyForId(comboId: string): ComboEasySetImageKey | undefined {
  if (!isComboEasySetId(comboId)) return undefined;
  return COMBO_EASY_SET_IMAGE_KEY_MAP[comboId];
}
