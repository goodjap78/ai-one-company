import type { MealImageRegistryEntry } from './mealImageTypes';

const DEFAULT_LOCAL = 'hankki-default' as const;

/**
 * Gold Meal hero image registry (TOP20).
 * Flagship TOP5 have dedicated local placeholders; others use default until Sprint 25-C.
 * Set `remoteUrl` to swap to production photography without code changes.
 */
export const GOLD_MEAL_IMAGE_REGISTRY: Record<string, MealImageRegistryEntry> = {
  // — Flagship TOP5 (dedicated local placeholders)
  gold_kr_kimchi_jjigae: {
    mealId: 'gold_kr_kimchi_jjigae',
    emoji: '🍲',
    localAssetKey: 'gold_kr_kimchi_jjigae',
    remoteUrl: null,
  },
  gold_kr_samgyeopsal: {
    mealId: 'gold_kr_samgyeopsal',
    emoji: '🥓',
    localAssetKey: 'gold_kr_samgyeopsal',
    remoteUrl: null,
  },
  gold_kr_jeyuk_bokkeum: {
    mealId: 'gold_kr_jeyuk_bokkeum',
    emoji: '🥩',
    localAssetKey: 'gold_kr_jeyuk_bokkeum',
    remoteUrl: null,
  },
  gold_kr_bibimbap: {
    mealId: 'gold_kr_bibimbap',
    emoji: '🍚',
    localAssetKey: 'gold_kr_bibimbap',
    remoteUrl: null,
  },
  gold_kr_jjapaghetti: {
    mealId: 'gold_kr_jjapaghetti',
    emoji: '🍜',
    localAssetKey: 'gold_kr_jjapaghetti',
    remoteUrl: null,
  },

  // — Remaining TOP15 (default placeholder until content + photos ship)
  gold_kr_doenjang_jjigae: {
    mealId: 'gold_kr_doenjang_jjigae',
    emoji: '🍲',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_kr_bulgogi: {
    mealId: 'gold_kr_bulgogi',
    emoji: '🥩',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_kr_kimchi_bokkeumbap: {
    mealId: 'gold_kr_kimchi_bokkeumbap',
    emoji: '🍚',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_kr_dakgalbi: {
    mealId: 'gold_kr_dakgalbi',
    emoji: '🍗',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_kr_sundubu_jjigae: {
    mealId: 'gold_kr_sundubu_jjigae',
    emoji: '🍲',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_kr_budae_jjigae: {
    mealId: 'gold_kr_budae_jjigae',
    emoji: '🍲',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_w_curry_rice: {
    mealId: 'gold_w_curry_rice',
    emoji: '🍛',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_w_cream_pasta: {
    mealId: 'gold_w_cream_pasta',
    emoji: '🍝',
    localAssetKey: 'gold_w_cream_pasta',
    remoteUrl: null,
  },


  gold_w_burger: {
    mealId: 'gold_w_burger',
    emoji: '🍔',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_j_donkatsu: {
    mealId: 'gold_j_donkatsu',
    emoji: '🍖',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_j_omurice: {
    mealId: 'gold_j_omurice',
    emoji: '🍛',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_j_udon: {
    mealId: 'gold_j_udon',
    emoji: '🍜',
    localAssetKey: 'gold_j_udon',
    remoteUrl: null,
  },
  gold_j_gyudon: {
    mealId: 'gold_j_gyudon',
    emoji: '🍚',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_c_jajangmyeon: {
    mealId: 'gold_c_jajangmyeon',
    emoji: '🍜',
    localAssetKey: 'gold_c_jajangmyeon',
    remoteUrl: null,
  },


  gold_c_jjamppong: {
    mealId: 'gold_c_jjamppong',
    emoji: '🍜',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
  gold_c_malatang: {
    mealId: 'gold_c_malatang',
    emoji: '🌶️',
    localAssetKey: DEFAULT_LOCAL,
    remoteUrl: null,
  },
};

export function getMealImageRegistryEntry(mealId: string): MealImageRegistryEntry | undefined {
  return GOLD_MEAL_IMAGE_REGISTRY[mealId];
}

export function isGoldMealImageId(mealId: string): boolean {
  return mealId in GOLD_MEAL_IMAGE_REGISTRY;
}
