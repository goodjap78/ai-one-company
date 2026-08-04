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
  labokki_combo:
    'Finished labokki in one bowl: cup noodles fully mixed with spicy-sweet tteokbokki sauce coating every noodle strand; red glossy sauce; noodles and sauce integrated as one dish; not uncooked noodles beside a sauce packet; no product lineup.',
  milky_cheese_tteokbokki_combo:
    'Creamy milky cheese tteokbokki: chewy rice cakes in spicy red sauce with melted cheese blended throughout; cheese visibly melting into sauce; single bowl only; not separate cheese slice on packaging.',
  cheese_tteokbokki_hotbar_combo:
    'Finished tteokbokki with melted cheese and chopped hotbar pieces mixed into the spicy sauce; rice cakes, cheese, and hotbar all in one bowl; not hotbar still in wrapper beside the bowl.',
  cheese_hotdog_combo:
    'Convenience-store hotdog with melted cheese slice draped over the sausage in the bun; cheese visibly melting; optional small fries mixed in as part of the combo; no hotdog packaging or ketchup packets.',
  cheese_spicy_cup_ramen_combo:
    'Spicy cup ramen with melted cheese slice on top mixing into the noodles and broth; cheese visibly melting; noodles in cup or bowl; not cheese package beside ramen.',
  soft_boiled_egg_ramen_combo:
    'Hot ramen with soft-boiled egg halved on top; runny yolk slightly broken into the broth; seaweed garnish on noodles; finished ramen bowl not a raw egg beside uncooked noodles.',
  rice_ball_cup_noodle_bibim_combo:
    'Finished cup-noodle bibimbap hack: cooked cup noodles mixed with broken rice ball and seasoning in one bowl; rice and noodles visibly stirred together; not separate rice ball beside untouched noodles.',
  soft_boiled_egg_cup_rice_combo:
    'Heated cup rice with soft-boiled egg on top; runny yolk broken into rice; kimchi mixed in; one bowl donburi-style finished dish not separate egg and cup packaging.',
  protein_cup_noodle_combo:
    'Cup noodles with shredded warm chicken breast and soft-boiled egg on top; yolk slightly broken; protein toppings integrated into noodles in one bowl.',
  butter_kim_cup_rice_combo:
    'Butter and seaweed flakes mixed into heated cup rice; glossy buttery rice with green kim flakes visible; one stirred rice bowl not butter stick beside plain rice.',
  chicken_salad_bibim_combo:
    'Warm shredded chicken mixed with salad greens and dressing in one bowl; lightly tossed salad-bowl hack not separate chicken pack beside untouched salad.',
  tuna_bibimbap_combo:
    'Tuna mixed into rice in one bowl; stirred tuna rice bowl with visible tuna flakes in rice; not canned tuna beside separate rice container.',
  yogurt_fruit_parfait_combo:
    'Tight close-up framing. Single clear parfait cup centered as the only subject. The parfait cup fills most of the frame approximately 86-92%. Minimal background. No distant camera. No additional plates or props. One convenience-store yogurt parfait cup with visible layers of yogurt, chopped fruit, and nuts inside the same cup; full cup not cropped at edges; no separate fruit plate; no wide table; no spoons napkins drinks or decorative props; bright cream-toned background; realistic convenience-store parfait not upscale cafe dessert styling.',
  cake_ice_cream_parfait_combo:
    'One cup or bowl parfait with crumbled cake pieces and ice cream scoops layered together as finished dessert; food large and close in frame 86-92% fill; minimal empty background no wide table scene; no fancy cafe decorations or extra plates; not a whole cake slice beside ice cream tub.',
  hotteok_ice_cream_combo:
    'Warm hotteok with melting ice cream scoop on top; hot golden pancake with cold ice cream; temperature contrast dessert in one serving not separate hotteok pack.',
  bean_sprout_egg_hangover_soup_combo:
    'Hangover soup bowl: hot bean sprout soup with soft-boiled egg and rice stirred in; runny yolk in broth with rice grains visible; one soup bowl not separate rice container.',
  rice_cake_cheese_ramen_combo:
    'Cup ramen with chewy rice cake pieces and melted cheese mixed into broth; cheese melting into spicy noodle soup; finished bowl not cheese slice beside plain ramen.',
  tuna_kim_ramen_combo:
    'Ramen with tuna flakes and seaweed in broth; tuna and kim visible on noodles in one bowl; finished tuna ramen not canned tuna beside uncooked noodles.',
};

export const COMBO_IMAGE_PILOT_IDS = [
  'combo_0001',
  'combo_0020',
  'combo_0044',
] as const;

export type ComboPilotId = (typeof COMBO_IMAGE_PILOT_IDS)[number];
