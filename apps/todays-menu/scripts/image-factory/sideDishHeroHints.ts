/**
 * Sprint 50 / 50-B — side dish (banchan) hero prompt hints for recipe_0141–0160.
 * HANKKI Side Dish Hero Style v2.0 — single dish only, unified framing.
 */
export const SIDE_DISH_HERO_V2_VERSION = '2.1';

export const SIDE_DISH_NEGATIVE_BLOCK =
  'Show only the single named side dish in one small Korean side-dish plate. No rice, no rice bowl, no soup, no soup bowl, no other side dishes, no table setting, no utensils, no chopsticks, no drinks, no napkins, no extra plates, no surrounding foods, no unrelated garnish, no meal spread. The named side dish must be the sole visual subject. One dish only. One plate only. Isolated plated side dish. Clean minimal background. Consistent framing. Centered food composition.';

export const SIDE_DISH_FRAMING_BLOCK =
  'Tight food-focused framing. The plated food should fill approximately 86-92% of the frame. Minimal empty background. No wide table scene. No distant camera. The food should feel close, vivid, and immediately appetizing, while keeping the full plate visible without cropping. Food visual centroid at 50% horizontal and 44-47% vertical; top margin about 8%; bottom UI safe margin about 12%; warm cream or very light neutral background; bright warm natural daylight; consistent close 3/4 elevated camera; 1344x768 JPG hero crop; harmonize with HANKKI cream-tone mobile UI.';

export const SIDE_DISH_HERO_BASE = `${SIDE_DISH_NEGATIVE_BLOCK} ${SIDE_DISH_FRAMING_BLOCK}`;

/** Per-heroImageKey dish identity hints (recipe_0141–0160). */
export const SIDE_DISH_HERO_HINTS: Record<string, string> = {
  bean_sprout_muchim:
    'Seasoned soybean sprout namul: yellow bean heads and white stems clearly visible; dry tossed namul with no broth; distinguish from mung bean sprouts (sukju).',
  sukju_namul:
    'Seasoned mung bean sprout namul: thinner longer pale white stems than soybean sprouts; no large yellow bean heads; namul not soup.',
  eggplant_muchim:
    'Steamed eggplant torn or cut into long strips and seasoned as namul; soft purple skin; not stir-fried eggplant or fried eggplant main.',
  radish_saengchae:
    'Fresh seasoned radish salad (saengchae): thin julienned white radish with light red chili dressing; not bright red kimchi.',
  miyeok_chomuchim:
    'Dry seasoned seaweed stem salad (chomuchim): chopped chewy stems with light vinegar dressing; not miyeok-guk soup or wet seaweed soup.',
  fish_cake_bokkeum:
    'Stir-fried fish cake (eomuk) strips, thin or square-cut; small side-dish portion; not fish cake soup or large fish main.',
  dried_squid_bokkeum:
    'Stir-fried dried shredded squid (jinmichae): thin long brown shreds; not whole squid stir-fry, octopus, or fried seafood.',
  potato_strip_bokkeum:
    'Stir-fried thin potato strips (julienned); soft home-style banchan; not french fries, chips, or thick potato wedges.',
  shrimp_bokkeum:
    'Stir-fried shrimp side dish in sauce; cooked shrimp pieces; not raw shrimp, shrimp tempura, or large seafood platter.',
  quail_egg_jangjorim:
    'Many small quail eggs in glossy soy braising glaze; bite-sized; not chicken-sized eggs; minimal pooling liquid.',
  lotus_root_jorim:
    'Thin sliced lotus root rounds with visible holes in soy glaze; crunchy jorim; distinct from burdock root.',
  burdock_jorim:
    'Thin long burdock root strips or matchsticks in soy glaze; earthy brown; distinct from lotus root rounds or carrot.',
  pepper_potato_jorim:
    'Small green chili peppers and potato cubes in soy jorim; modest side portion; not a soupy stew or jjigae.',
  egg_jangjorim:
    'Halved or whole chicken eggs in soy braising glaze; larger than quail eggs; distinct from quail egg jangjorim.',
  tofu_pan_fry:
    'Wide flat pan-fried tofu slices with lightly golden surface; not bite-size cubes, gangjeong glaze, or pancake.',
  tofu_gangjeong:
    'Bite-size tofu cubes coated in sweet-spicy glossy gangjeong sauce; crispy glazed surface; not plain pan-fried tofu or jeon.',
  beef_jangjorim:
    'Thin beef strips shredded along the grain or small jorim pieces in soy glaze; not bulgogi or galbi-jjim style.',
  saury_soy_jorim:
    'Small saury (gwangchi) fish in soy jorim with radish; slender elongated saury shape; not thick mackerel steak or large pot.',
  zucchini_pancake:
    'Round zucchini jeon: sliced zucchini in golden batter on one small plate; not thick stacked pancakes or dubu-jeon.',
  tofu_pancake:
    'Soft tofu-and-egg jeon rounds; pale golden pancake; distinct from zucchini jeon, tofu pan-fry, and tofu gangjeong.',
};

export function isSideDishRecipe(categories: string[]): boolean {
  return categories.some((c) => c.includes('반찬'));
}

export const SIDE_DISH_SHOT_REQUIREMENTS = [
  'tight food-focused framing; plated food fills approximately 86-92% of the frame',
  'minimal empty background; no wide table scene; no distant camera',
  'close vivid appetizing food; full plate visible without edge cropping',
  'isolated side dish as sole subject; one small plate only',
  'no rice bowl, soup bowl, utensils, or other dishes in frame',
  'dish centered; food visual center at 44-47% vertical height from top',
  'approximately 8% top margin and 12% bottom margin',
  'warm cream or very light neutral background',
  'bright soft natural daylight; high-key food photography',
  'horizontal 16:9 app-friendly composition; 1344x768 JPG',
  'no people, hands, chopsticks, text, logo, or decorative clutter',
];

export function buildSideDishPromptAppend(
  heroImageKey: string,
  categories: string[],
): string {
  if (!isSideDishRecipe(categories)) return '';
  const hint = SIDE_DISH_HERO_HINTS[heroImageKey];
  return hint
    ? `${SIDE_DISH_HERO_BASE} ${hint}`
    : SIDE_DISH_HERO_BASE;
}
