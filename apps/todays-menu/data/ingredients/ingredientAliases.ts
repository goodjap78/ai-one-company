/**
 * Sprint R5-2 — shared Korean ingredient name → iconKey aliases.
 * Recipes only need an ingredient name; iconKey remains optional.
 */

export type IngredientIconCategory =
  | 'meat'
  | 'vegetable'
  | 'grain'
  | 'sauce'
  | 'seasoning'
  | 'dairy'
  | 'processed'
  | 'generic';

/** Category fallback asset keys registered in `ingredientImageAssets`. */
export type IngredientFallbackImageKey =
  | 'fallback_meat'
  | 'fallback_vegetable'
  | 'fallback_grain'
  | 'fallback_sauce'
  | 'fallback_seasoning'
  | 'fallback_dairy'
  | 'fallback_processed'
  | 'fallback_generic';

export function fallbackKeyForCategory(
  category: IngredientIconCategory,
): IngredientFallbackImageKey {
  return `fallback_${category}`;
}

/** Collapse whitespace; keep Korean as-is; lowercase Latin. */
export function normalizeIngredientName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Space-stripped form for matching `다진 마늘` ↔ `다진마늘`. */
export function compactIngredientName(value: string): string {
  return normalizeIngredientName(value).replace(/\s+/g, '');
}

/**
 * Display / alias names → reusable icon keys.
 * Prefer exact matches; resolver also tries longest contains for longer aliases.
 */
export const INGREDIENT_ALIASES: Record<string, string> = {
  // meat
  돼지고기: 'pork',
  '돼지 등심': 'pork',
  '돼지등심': 'pork',
  '돼지 앞다리살': 'pork',
  '돼지앞다리살': 'pork',
  앞다리살: 'pork',
  목살: 'pork',
  삼겹살: 'pork',
  소고기: 'beef',
  우삼겹: 'beef',
  닭고기: 'chicken',
  닭다리살: 'chicken',
  닭가슴살: 'chicken',
  닭: 'chicken',
  고등어: 'mackerel',
  북어채: 'fish_generic',
  북어: 'fish_generic',
  잔멸치: 'anchovy',
  멸치: 'anchovy',
  갈치: 'fish_generic',
  은갈치: 'fish_generic',
  생선: 'fish_generic',
  참치: 'tuna',
  참치캔: 'tuna',
  어묵: 'fish_cake',
  오뎅: 'fish_cake',
  맛살: 'imitation_crab',
  게맛살: 'imitation_crab',
  새우: 'shrimp',
  새우젓: 'salt',
  유부: 'fried_tofu',
  유부주머니: 'fried_tofu',
  오징어: 'squid',
  낙지: 'octopus',
  해파리: 'jellyfish',

  // dairy / egg (egg uses egg icon; category = generic for fallback)
  계란: 'egg',
  달걀: 'egg',
  유정란: 'egg',

  // grains
  밥: 'rice',
  쌀: 'rice',
  떡: 'rice_cake',
  밀가루: 'flour',
  빵가루: 'bread_crumbs',

  // processed
  햄: 'ham',
  스팸: 'ham',
  소시지: 'sausage',
  핫도그소시지: 'sausage',
  김치: 'kimchi',
  배추김치: 'kimchi',
  두부: 'tofu',
  순두부: 'tofu',
  연두부: 'tofu',
  청국장: 'doenjang',
  아몬드: 'peanut',
  견과류: 'peanut',

  // vegetables
  양파: 'onion',
  대파: 'green_onion',
  파: 'green_onion',
  쪽파: 'green_onion',
  실파: 'green_onion',
  당근: 'carrot',
  애호박: 'zucchini',
  호박: 'zucchini',
  버섯: 'mushroom',
  표고버섯: 'mushroom',
  감자: 'potato',
  양배추: 'cabbage',
  시금치: 'spinach',
  브로콜리: 'broccoli',
  콩나물: 'bean_sprout',
  청양고추: 'green_chili',
  고추: 'green_chili',
  고구마: 'sweet_potato',
  깻잎: 'perilla',
  김가루: 'seaweed',
  김: 'seaweed',
  미역: 'seaweed',
  무: 'radish',
  숙주: 'bean_sprout',
  고사리: 'bean_sprout',
  풋고추: 'green_chili',

  // sauces
  간장: 'soy_sauce',
  국간장: 'soy_sauce',
  진간장: 'soy_sauce',
  양조간장: 'soy_sauce',
  고추장: 'gochujang',
  된장: 'doenjang',
  참기름: 'sesame_oil',
  들기름: 'sesame_oil',
  돈까스소스: 'tonkatsu_sauce',
  '돈까스 소스': 'tonkatsu_sauce',

  // seasonings
  고춧가루: 'gochugaru',
  마늘: 'garlic',
  다진마늘: 'garlic',
  '다진 마늘': 'garlic',
  설탕: 'sugar',
  물엿: 'sugar',
  소금: 'salt',
  후추: 'pepper',
  카레가루: 'curry_powder',
  식용유: 'cooking_oil',
  배즙: 'pear',
  배: 'pear',
  물: 'water',
  소갈비: 'beef',
  떡국떡: 'rice_cake',
  식초: 'vinegar',
  겨자: 'pepper',
  케첩: 'tonkatsu_sauce',
  당면: 'rice_cake',
  소면: 'rice_cake',
  냉면사리: 'rice_cake',
  냉면육수: 'water',
  배추: 'cabbage',
  상추: 'cabbage',
  오이: 'zucchini',
  돼지등뼈: 'pork',
  '다진 소고기': 'beef',
  다진소고기: 'beef',
  '다진 돼지고기': 'pork',
  다진돼지고기: 'pork',
  라면: 'rice_cake',
  라면스프: 'salt',
  슬라이스치즈: 'cheese',
  치즈: 'cheese',
  순대: 'rice_cake',
  칼국수면: 'rice_cake',
};

/** iconKey → visual category (for fallback assets). */
export const INGREDIENT_ICON_CATEGORY: Record<string, IngredientIconCategory> = {
  pork: 'meat',
  beef: 'meat',
  chicken: 'meat',

  onion: 'vegetable',
  green_onion: 'vegetable',
  carrot: 'vegetable',
  zucchini: 'vegetable',
  mushroom: 'vegetable',
  potato: 'vegetable',
  cabbage: 'vegetable',
  spinach: 'vegetable',
  broccoli: 'vegetable',
  bean_sprout: 'vegetable',
  green_chili: 'vegetable',
  sweet_potato: 'vegetable',
  perilla: 'vegetable',
  seaweed: 'vegetable',
  pear: 'vegetable',

  rice: 'grain',
  rice_cake: 'grain',
  flour: 'grain',
  bread_crumbs: 'grain',

  soy_sauce: 'sauce',
  gochujang: 'sauce',
  doenjang: 'sauce',
  sesame_oil: 'sauce',
  tonkatsu_sauce: 'sauce',

  gochugaru: 'seasoning',
  garlic: 'seasoning',
  sugar: 'seasoning',
  salt: 'seasoning',
  pepper: 'seasoning',
  curry_powder: 'seasoning',
  cooking_oil: 'seasoning',
  water: 'seasoning',

  ham: 'processed',
  sausage: 'processed',
  kimchi: 'processed',
  tofu: 'processed',
  fried_tofu: 'processed',
  fish_cake: 'processed',
  imitation_crab: 'processed',

  egg: 'generic',
  squid: 'meat',
  shrimp: 'meat',
  mackerel: 'meat',
  anchovy: 'meat',
  tuna: 'meat',
  fish: 'meat',
  fish_generic: 'meat',
  octopus: 'meat',
  jellyfish: 'meat',
  fishcake: 'processed',
  radish: 'vegetable',
  cheese: 'dairy',
  vinegar: 'sauce',
};

const ALIAS_ENTRIES = Object.entries(INGREDIENT_ALIASES)
  .map(([alias, iconKey]) => ({
    alias,
    normalized: normalizeIngredientName(alias),
    compact: compactIngredientName(alias),
    iconKey,
  }))
  .sort((a, b) => b.compact.length - a.compact.length);

/**
 * Resolve an ingredient display name to an iconKey via the alias map.
 * Exact / compact match first; then longest contains (aliases length ≥ 2).
 */
export function lookupIngredientAlias(rawName: string): string | null {
  const normalized = normalizeIngredientName(rawName);
  if (!normalized) return null;

  const compact = compactIngredientName(rawName);

  const exact =
    INGREDIENT_ALIASES[rawName.trim()] ??
    INGREDIENT_ALIASES[normalized] ??
    ALIAS_ENTRIES.find((entry) => entry.compact === compact)?.iconKey;
  if (exact) return exact;

  for (const entry of ALIAS_ENTRIES) {
    if (entry.compact.length < 2) continue;
    if (compact.includes(entry.compact)) return entry.iconKey;
  }

  return null;
}

export function categoryForIconKey(iconKey: string): IngredientIconCategory {
  return INGREDIENT_ICON_CATEGORY[iconKey] ?? 'generic';
}

/** Heuristic category when no iconKey is known yet. */
export function inferIngredientIconCategory(rawName: string): IngredientIconCategory {
  const aliasKey = lookupIngredientAlias(rawName);
  if (aliasKey) return categoryForIconKey(aliasKey);

  const n = compactIngredientName(rawName);
  if (/돼지|소고기|우육|닭|고기|삼겹|목살|등심|앞다리/.test(n)) return 'meat';
  if (/우유|치즈|버터|요거트|크림/.test(n)) return 'dairy';
  if (/밥|쌀|면|국수|떡|밀가루|빵/.test(n)) return 'grain';
  if (/간장|고추장|된장|소스|기름|참기름/.test(n)) return 'sauce';
  if (/소금|설탕|후추|가루|마늘|양념/.test(n)) return 'seasoning';
  if (/햄|스팸|소시지|김치|두부|어묵|게맛살|맛살|유부/.test(n)) return 'processed';
  if (/고등어|갈치|멸치|생선|참치|오징어|새우|낙지|해파리/.test(n)) return 'meat';
  if (/양파|파|당근|호박|버섯|감자|배추|상추|고추|채소|나물|깻잎|시금치|브로콜리/.test(n)) {
    return 'vegetable';
  }
  return 'generic';
}
