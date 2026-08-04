/**
 * Sprint 48-C — HACK_COMBO image pilot (3 combos only).
 * EASY_SET and bulk generation are out of scope for this sprint.
 */
export const COMBO_IMAGE_PILOT_MAP = {
  combo_0020: 'spicy_cheese_stir_noodles_combo',
  combo_0001: 'triangle_kimbap_rice_noodle_combo',
  combo_0044: 'ice_cream_coffee_combo',
} as const;

export type ComboImagePilotId = keyof typeof COMBO_IMAGE_PILOT_MAP;
export type ComboImagePilotKey = (typeof COMBO_IMAGE_PILOT_MAP)[ComboImagePilotId];

export const COMBO_IMAGE_PILOT_IDS = Object.keys(
  COMBO_IMAGE_PILOT_MAP,
) as ComboImagePilotId[];

export function isComboImagePilotId(id: string): id is ComboImagePilotId {
  return id in COMBO_IMAGE_PILOT_MAP;
}

export function comboImageKeyForId(comboId: string): ComboImagePilotKey | undefined {
  if (!isComboImagePilotId(comboId)) return undefined;
  return COMBO_IMAGE_PILOT_MAP[comboId];
}
