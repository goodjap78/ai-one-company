/**
 * Sprint Combo v2 — HANKKI Convenience Combo Hero Style v2.0 prompts.
 */
export const COMBO_HERO_V2_VERSION = '2.0';

export const COMBO_NEGATIVE_BLOCK =
  'Show only the finished convenience-store combo and the containers strictly required to present that combo. No unrelated drinks, no extra coffee cups, no utensils, no chopsticks, no napkins, no packaging wrappers, no branded product packages, no other side dishes, no table spread, no wide dining scene, no distant camera, no people, no hands, no text, no logos, no brand names, no price tags. One combo only. Isolated hero combo. Clean minimal background.';

export const COMBO_FRAMING_BLOCK =
  'Tight food-focused framing. The finished combo and its essential containers should fill approximately 86-92% of the frame. Minimal empty background. No wide table scene. No distant camera. Food feels close, vivid, and immediately appetizing while keeping the full combo visible without cropping the key foods. Food visual centroid at 50% horizontal and 47-50% vertical; warm bright cream-toned background; realistic quick convenience-store meal feeling not fine dining; bright soft natural daylight; consistent close elevated 3/4 camera; 1344x768 JPG 16:9 landscape; harmonize with HANKKI cream-tone mobile UI.';

export const COMBO_HERO_BASE = `${COMBO_NEGATIVE_BLOCK} ${COMBO_FRAMING_BLOCK}`;

/** Per-imageKey dish identity for pilot combos. */
export const COMBO_HERO_HINTS: Record<string, string> = {
  triangle_kimbap_rice_noodle_combo:
    'One bowl of cup-noodle rice-bowl hack: cooked noodles and finely broken triangle-kimbap rice mixed together in the same bowl with broth; rice grains and noodles both clearly visible; not a side-by-side set; no untouched packaged triangle kimbap beside the bowl; no separate coffee, drinks, or other side dishes.',
  spicy_cheese_stir_noodles_combo:
    'Red spicy stir-fried noodles with melted cheese slice on top; stir-fried noodle dish not soup ramen; cheese visibly melting into the noodles; only the noodle dish in frame; no cup-noodle broth, no extra drinks, no packaging, no other foods.',
  ice_cream_coffee_combo:
    'Affogato-style convenience dessert: vanilla ice cream in a simple cup with coffee poured over it; coffee is an allowed essential ingredient for this combo; visible contrast between cold ice cream and dark coffee; no separate bread, cookies, cake, spoons, or decorative cafe props; not upscale cafe plating.',
};

export const COMBO_IMAGE_PILOT_IDS = [
  'combo_0001',
  'combo_0020',
  'combo_0044',
] as const;

export type ComboPilotId = (typeof COMBO_IMAGE_PILOT_IDS)[number];
