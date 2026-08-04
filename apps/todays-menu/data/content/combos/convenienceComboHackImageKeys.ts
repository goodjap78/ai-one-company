/**
 * Sprint 51-B — stable imageKey map for all 21 HACK_COMBO combos.
 * Runtime catalog still exposes imageKey only for approved pilots (enrichment patch).
 * Factory uses this map for queue, prompts, and review generation.
 */
export const COMBO_HACK_IMAGE_KEY_MAP = {
  combo_0001: 'triangle_kimbap_rice_noodle_combo',
  combo_0008: 'rice_ball_cup_noodle_bibim_combo',
  combo_0010: 'soft_boiled_egg_ramen_combo',
  combo_0011: 'cheese_spicy_cup_ramen_combo',
  combo_0013: 'rice_cake_cheese_ramen_combo',
  combo_0015: 'cheese_tteokbokki_hotbar_combo',
  combo_0016: 'cheese_hotdog_combo',
  combo_0020: 'spicy_cheese_stir_noodles_combo',
  combo_0021: 'milky_cheese_tteokbokki_combo',
  combo_0023: 'labokki_combo',
  combo_0025: 'tuna_kim_ramen_combo',
  combo_0027: 'soft_boiled_egg_cup_rice_combo',
  combo_0028: 'protein_cup_noodle_combo',
  combo_0031: 'butter_kim_cup_rice_combo',
  combo_0038: 'yogurt_fruit_parfait_combo',
  combo_0039: 'chicken_salad_bibim_combo',
  combo_0041: 'tuna_bibimbap_combo',
  combo_0044: 'ice_cream_coffee_combo',
  combo_0046: 'cake_ice_cream_parfait_combo',
  combo_0047: 'hotteok_ice_cream_combo',
  combo_0050: 'bean_sprout_egg_hangover_soup_combo',
} as const;

export type ComboHackId = keyof typeof COMBO_HACK_IMAGE_KEY_MAP;
export type ComboHackImageKey = (typeof COMBO_HACK_IMAGE_KEY_MAP)[ComboHackId];

export const COMBO_HACK_COMBO_IDS = Object.keys(
  COMBO_HACK_IMAGE_KEY_MAP,
) as ComboHackId[];

export function isComboHackId(id: string): id is ComboHackId {
  return id in COMBO_HACK_IMAGE_KEY_MAP;
}

export function comboHackImageKeyForId(comboId: string): ComboHackImageKey | undefined {
  if (!isComboHackId(comboId)) return undefined;
  return COMBO_HACK_IMAGE_KEY_MAP[comboId];
}

/** Pilots already in production — do not regenerate without explicit force. */
export const COMBO_HACK_PILOT_IDS = [
  'combo_0001',
  'combo_0020',
  'combo_0044',
] as const satisfies readonly ComboHackId[];
