import type { ImageSourcePropType } from 'react-native';
import type { IngredientFallbackImageKey } from '../../data/ingredients/ingredientAliases';
import { INGREDIENT_ALIASES } from '../../data/ingredients/ingredientAliases';

/**
 * Sprint R3 / R5-2 — ingredient icon keys for Recipe Detail.
 * Register a key only when the PNG exists under `assets/ingredients/`.
 * Never use dynamic require().
 */
export type IngredientImageKey =
  | 'pork'
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'rice'
  | 'kimchi'
  | 'tofu'
  | 'ham'
  | 'green_onion'
  | 'onion'
  | 'zucchini'
  | 'mushroom'
  | 'carrot'
  | 'potato'
  | 'cabbage'
  | 'spinach'
  | 'broccoli'
  | 'bean_sprout'
  | 'green_chili'
  | 'sweet_potato'
  | 'perilla'
  | 'rice_cake'
  | 'seaweed'
  | 'garlic'
  | 'soy_sauce'
  | 'gochujang'
  | 'gochugaru'
  | 'doenjang'
  | 'sesame_oil'
  | 'cooking_oil'
  | 'sugar'
  | 'salt'
  | 'pepper'
  | 'curry_powder'
  | 'flour'
  | 'bread_crumbs'
  | 'tonkatsu_sauce'
  | 'pear'
  | 'water'
  | 'squid'
  | 'radish'
  | 'fish'
  | 'fish_cake'
  | 'fishcake'
  | 'fish_generic'
  | 'mackerel'
  | 'anchovy'
  | 'tuna'
  | 'shrimp'
  | 'sausage'
  | 'fried_tofu'
  | 'imitation_crab'
  | 'octopus'
  | 'jellyfish'
  | 'peanut'
  | 'cheese'
  | 'vinegar'
  | IngredientFallbackImageKey;

/**
 * Static asset registry — no on-disk PNGs yet (README only).
 * When adding files, use static require() only.
 */
export const INGREDIENT_IMAGE_ASSETS: Partial<
  Record<IngredientImageKey, ImageSourcePropType>
> = {
  anchovy: require('../../assets/ingredients/anchovy.png'),
  avocado: require('../../assets/ingredients/avocado.png'),
  banana: require('../../assets/ingredients/banana.png'),
  bean_sprout: require('../../assets/ingredients/bean_sprout.png'),
  beef: require('../../assets/ingredients/beef.png'),
  blueberry: require('../../assets/ingredients/blueberry.png'),
  bread_crumbs: require('../../assets/ingredients/bread_crumbs.png'),
  butter: require('../../assets/ingredients/butter.png'),
  cabbage: require('../../assets/ingredients/cabbage.png'),
  carrot: require('../../assets/ingredients/carrot.png'),
  cheese: require('../../assets/ingredients/cheese.png'),
  chicken: require('../../assets/ingredients/chicken.png'),
  cooking_oil: require('../../assets/ingredients/cooking_oil.png'),
  curry_powder: require('../../assets/ingredients/curry_powder.png'),
  doenjang: require('../../assets/ingredients/doenjang.png'),
  egg: require('../../assets/ingredients/egg.png'),
  fish: require('../../assets/ingredients/fish.png'),
  fish_cake: require('../../assets/ingredients/fish_cake.png'),
  fish_generic: require('../../assets/ingredients/fish_generic.png'),
  fishcake: require('../../assets/ingredients/fishcake.png'),
  flour: require('../../assets/ingredients/flour.png'),
  fried_tofu: require('../../assets/ingredients/fried_tofu.png'),
  garlic: require('../../assets/ingredients/garlic.png'),
  gochugaru: require('../../assets/ingredients/gochugaru.png'),
  gochujang: require('../../assets/ingredients/gochujang.png'),
  green_chili: require('../../assets/ingredients/green_chili.png'),
  green_onion: require('../../assets/ingredients/green_onion.png'),
  ham: require('../../assets/ingredients/ham.png'),
  kimchi: require('../../assets/ingredients/kimchi.png'),
  mackerel: require('../../assets/ingredients/mackerel.png'),
  milk: require('../../assets/ingredients/milk.png'),
  mushroom: require('../../assets/ingredients/mushroom.png'),
  octopus: require('../../assets/ingredients/octopus.png'),
  onion: require('../../assets/ingredients/onion.png'),
  peanut: require('../../assets/ingredients/peanut.png'),
  pear: require('../../assets/ingredients/pear.png'),
  pepper: require('../../assets/ingredients/pepper.png'),
  perilla: require('../../assets/ingredients/perilla.png'),
  pork: require('../../assets/ingredients/pork.png'),
  potato: require('../../assets/ingredients/potato.png'),
  radish: require('../../assets/ingredients/radish.png'),
  rice: require('../../assets/ingredients/rice.png'),
  rice_cake: require('../../assets/ingredients/rice_cake.png'),
  salmon: require('../../assets/ingredients/salmon.png'),
  salt: require('../../assets/ingredients/salt.png'),
  sausage: require('../../assets/ingredients/sausage.png'),
  seaweed: require('../../assets/ingredients/seaweed.png'),
  seed: require('../../assets/ingredients/seed.png'),
  sesame_oil: require('../../assets/ingredients/sesame_oil.png'),
  soy_sauce: require('../../assets/ingredients/soy_sauce.png'),
  spinach: require('../../assets/ingredients/spinach.png'),
  squid: require('../../assets/ingredients/squid.png'),
  sugar: require('../../assets/ingredients/sugar.png'),
  sweet_potato: require('../../assets/ingredients/sweet_potato.png'),
  tofu: require('../../assets/ingredients/tofu.png'),
  tomato: require('../../assets/ingredients/tomato.png'),
  tonkatsu_sauce: require('../../assets/ingredients/tonkatsu_sauce.png'),
  tuna: require('../../assets/ingredients/tuna.png'),
  vinegar: require('../../assets/ingredients/vinegar.png'),
  water: require('../../assets/ingredients/water.png'),
  zucchini: require('../../assets/ingredients/zucchini.png'),
};

/** Known specific + fallback keys (for step B name-as-key resolution). */
export const KNOWN_INGREDIENT_IMAGE_KEYS = new Set<string>([
  'pork',
  'beef',
  'chicken',
  'egg',
  'rice',
  'kimchi',
  'tofu',
  'ham',
  'green_onion',
  'onion',
  'zucchini',
  'mushroom',
  'carrot',
  'potato',
  'cabbage',
  'spinach',
  'broccoli',
  'bean_sprout',
  'green_chili',
  'sweet_potato',
  'perilla',
  'rice_cake',
  'seaweed',
  'garlic',
  'soy_sauce',
  'gochujang',
  'gochugaru',
  'doenjang',
  'sesame_oil',
  'cooking_oil',
  'sugar',
  'salt',
  'pepper',
  'curry_powder',
  'flour',
  'bread_crumbs',
  'tonkatsu_sauce',
  'pear',
  'water',
  'squid',
  'radish',
  'fish',
  'fish_cake',
  'fishcake',
  'fish_generic',
  'mackerel',
  'anchovy',
  'tuna',
  'shrimp',
  'sausage',
  'fried_tofu',
  'imitation_crab',
  'octopus',
  'jellyfish',
  'peanut',
  'cheese',
  'vinegar',
  'salmon',
  'fallback_meat',
  'fallback_vegetable',
  'fallback_grain',
  'fallback_sauce',
  'fallback_seasoning',
  'fallback_dairy',
  'fallback_processed',
  'fallback_generic',
]);

/** IIE ingredient ids → iconKey */
export const INGREDIENT_ID_TO_ICON_KEY: Record<string, IngredientImageKey> = {
  ing_pork: 'pork',
  ing_beef: 'beef',
  ing_chicken: 'chicken',
  ing_egg: 'egg',
  ing_rice: 'rice',
  ing_kimchi: 'kimchi',
  ing_tofu: 'tofu',
  ing_green_onion: 'green_onion',
  ing_onion: 'onion',
  ing_zucchini: 'zucchini',
  ing_garlic: 'garlic',
  ing_soy_sauce: 'soy_sauce',
  ing_gochujang: 'gochujang',
  ing_gochugaru: 'gochugaru',
  ing_doenjang: 'doenjang',
  ing_sesame_oil: 'sesame_oil',
  ing_potato: 'potato',
  ing_carrot: 'carrot',
};

/**
 * @deprecated Prefer `INGREDIENT_ALIASES` from `data/ingredients/ingredientAliases`.
 * Kept for existing imports.
 */
export const INGREDIENT_NAME_TO_ICON_KEY: Record<string, IngredientImageKey> =
  INGREDIENT_ALIASES as Record<string, IngredientImageKey>;

export function getIngredientImageSource(
  iconKey: string | null | undefined,
): ImageSourcePropType | null {
  if (!iconKey) return null;
  return INGREDIENT_IMAGE_ASSETS[iconKey as IngredientImageKey] ?? null;
}

export function listRegisteredIngredientImageKeys(): IngredientImageKey[] {
  return Object.keys(INGREDIENT_IMAGE_ASSETS) as IngredientImageKey[];
}

export function isKnownIngredientImageKey(key: string): boolean {
  return KNOWN_INGREDIENT_IMAGE_KEYS.has(key);
}
