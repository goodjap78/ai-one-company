import type { ImageSourcePropType } from 'react-native';
import type { MealLocalAssetKey } from '../../services/images/mealImageTypes';
import {
  getLocalMealImageSource,
  isRegisteredMealImageKey,
  parseMealImageKeyFromAssetPath,
} from '../../services/images/mealImageAssets';
import { getHankkiRecipeById } from './hankkiRecipes';

/**
 * Sprint H7/H8 / H3-10 — central recipe image map (source of truth).
 * Map by stable recipe id only — never by display name.
 * Never map a recipe to another dish's photo.
 */

export type RecipeImageMapEntry =
  | { kind: 'local'; key: MealLocalAssetKey }
  | { kind: 'remote'; url: string };

/** Spelling aliases across core_* / gold_* namespaces (same dish). */
const RECIPE_ID_ALIASES: Record<string, string> = {
  core_c_jjajangmyeon: 'gold_c_jajangmyeon',
  gold_c_jjajangmyeon: 'gold_c_jajangmyeon',
};

/**
 * Sprint H3-10 — HANKKI meal image keys (filename without extension).
 */
export type MvpRecipeImageKey =
  | 'jaeyuk'
  | 'egg_rice'
  | 'kimchi_stew'
  | 'soybean_paste_stew'
  | 'bibimbap'
  | 'bulgogi'
  | 'kimchi_fried_rice'
  | 'curry_rice'
  | 'pork_cutlet'
  | 'dakgalbi';

export type MvpRecipeImageRow = {
  order: number;
  key: MvpRecipeImageKey;
  filename: `${MvpRecipeImageKey}.jpg`;
  path: `assets/meals/${MvpRecipeImageKey}.jpg`;
  recipeId: string;
  existingAssetKey: MealLocalAssetKey;
};

export const MVP_RECIPE_IMAGE_TABLE: readonly MvpRecipeImageRow[] = [
  {
    order: 1,
    key: 'jaeyuk',
    filename: 'jaeyuk.jpg',
    path: 'assets/meals/jaeyuk.jpg',
    recipeId: '001',
    existingAssetKey: 'jaeyuk',
  },
  {
    order: 2,
    key: 'egg_rice',
    filename: 'egg_rice.jpg',
    path: 'assets/meals/egg_rice.jpg',
    recipeId: '002',
    existingAssetKey: 'egg_rice',
  },
  {
    order: 3,
    key: 'kimchi_stew',
    filename: 'kimchi_stew.jpg',
    path: 'assets/meals/kimchi_stew.jpg',
    recipeId: '003',
    existingAssetKey: 'kimchi_stew',
  },
  {
    order: 4,
    key: 'soybean_paste_stew',
    filename: 'soybean_paste_stew.jpg',
    path: 'assets/meals/soybean_paste_stew.jpg',
    recipeId: '004',
    existingAssetKey: 'soybean_paste_stew',
  },
  {
    order: 5,
    key: 'bibimbap',
    filename: 'bibimbap.jpg',
    path: 'assets/meals/bibimbap.jpg',
    recipeId: '005',
    existingAssetKey: 'bibimbap',
  },
  {
    order: 6,
    key: 'bulgogi',
    filename: 'bulgogi.jpg',
    path: 'assets/meals/bulgogi.jpg',
    recipeId: '006',
    existingAssetKey: 'bulgogi',
  },
  {
    order: 7,
    key: 'kimchi_fried_rice',
    filename: 'kimchi_fried_rice.jpg',
    path: 'assets/meals/kimchi_fried_rice.jpg',
    recipeId: '007',
    existingAssetKey: 'kimchi_fried_rice',
  },
  {
    order: 8,
    key: 'curry_rice',
    filename: 'curry_rice.jpg',
    path: 'assets/meals/curry_rice.jpg',
    recipeId: '008',
    existingAssetKey: 'curry_rice',
  },
  {
    order: 9,
    key: 'pork_cutlet',
    filename: 'pork_cutlet.jpg',
    path: 'assets/meals/pork_cutlet.jpg',
    recipeId: '009',
    existingAssetKey: 'pork_cutlet',
  },
  {
    order: 10,
    key: 'dakgalbi',
    filename: 'dakgalbi.jpg',
    path: 'assets/meals/dakgalbi.jpg',
    recipeId: '010',
    existingAssetKey: 'dakgalbi',
  },
] as const;

export const MVP_RECIPE_IMAGE_PATHS: Record<MvpRecipeImageKey, string> = {
  jaeyuk: 'assets/meals/jaeyuk.jpg',
  egg_rice: 'assets/meals/egg_rice.jpg',
  kimchi_stew: 'assets/meals/kimchi_stew.jpg',
  soybean_paste_stew: 'assets/meals/soybean_paste_stew.jpg',
  bibimbap: 'assets/meals/bibimbap.jpg',
  bulgogi: 'assets/meals/bulgogi.jpg',
  kimchi_fried_rice: 'assets/meals/kimchi_fried_rice.jpg',
  curry_rice: 'assets/meals/curry_rice.jpg',
  pork_cutlet: 'assets/meals/pork_cutlet.jpg',
  dakgalbi: 'assets/meals/dakgalbi.jpg',
};

export const MVP_RECIPE_IMAGE_PATH_BY_RECIPE_ID: Record<string, string> =
  Object.fromEntries(MVP_RECIPE_IMAGE_TABLE.map((row) => [row.recipeId, row.path]));

/**
 * Exact dish photos that exist in `assets/meals/`.
 * Sprint H3-10 — HANKKI ids 001–010 map to HANKKI asset keys.
 */
export const RECIPE_IMAGE_MAP: Record<string, RecipeImageMapEntry> = {
  // HANKKI catalog (001–010)
  '001': { kind: 'local', key: 'jaeyuk' },
  '002': { kind: 'local', key: 'egg_rice' },
  '003': { kind: 'local', key: 'kimchi_stew' },
  '004': { kind: 'local', key: 'soybean_paste_stew' },
  '005': { kind: 'local', key: 'bibimbap' },
  '006': { kind: 'local', key: 'bulgogi' },
  '007': { kind: 'local', key: 'kimchi_fried_rice' },
  '008': { kind: 'local', key: 'curry_rice' },
  '009': { kind: 'local', key: 'pork_cutlet' },
  '010': { kind: 'local', key: 'dakgalbi' },

  // Batch 02 (011–020) — hero JPGs not shipped yet; cuisine fallback until assets exist
  '011': { kind: 'local', key: 'sundubu_jjigae' },
  '012': { kind: 'local', key: 'dakbokkeumtang' },
  '013': { kind: 'local', key: 'ojingeo_bokkeum' },
  '014': { kind: 'local', key: 'galbitang' },
  '015': { kind: 'local', key: 'yukgaejang' },
  '016': { kind: 'local', key: 'miyeok_guk' },
  '017': { kind: 'local', key: 'tteokguk' },
  '018': { kind: 'local', key: 'gamja_jorim' },
  '019': { kind: 'local', key: 'egg_roll' },
  '020': { kind: 'local', key: 'beef_bulgogi_don' },

  // Batch 03 (021–030) — hero JPGs not shipped yet; cuisine fallback
  '021': { kind: 'local', key: 'godeungeo_gui' },
  '022': { kind: 'local', key: 'samgyeopsal_gui' },
  '023': { kind: 'local', key: 'dwaeji_bulbaek' },
  '024': { kind: 'local', key: 'budae_jjigae' },
  '025': { kind: 'local', key: 'cheonggukjang_jjigae' },
  '026': { kind: 'local', key: 'sogogi_muguk' },
  '027': { kind: 'local', key: 'bugeo_guk' },
  '028': { kind: 'local', key: 'kongnamul_guk' },
  '029': { kind: 'local', key: 'dubu_jorim' },
  '030': { kind: 'local', key: 'myeolchi_bokkeum' },

  // Batch 04 (031–040) — hero JPGs not shipped yet; cuisine fallback
  '031': { kind: 'local', key: 'omurice' },
  '032': { kind: 'local', key: 'tteokgalbi' },
  '033': { kind: 'local', key: 'galchi_jorim' },
  '034': { kind: 'local', key: 'dakgaejang' },
  '035': { kind: 'local', key: 'gamjatang' },
  '036': { kind: 'local', key: 'janchi_guksu' },
  '037': { kind: 'local', key: 'bibim_guksu' },
  '038': { kind: 'local', key: 'naengmyeon' },
  '039': { kind: 'local', key: 'japchae' },
  '040': { kind: 'local', key: 'gimbap' },

  // Batch 05 (041–050) — hero JPGs not shipped yet; cuisine fallback
  '041': { kind: 'local', key: 'ramyeon' },
  '042': { kind: 'local', key: 'kimchi_ramyeon' },
  '043': { kind: 'local', key: 'cheese_ramyeon' },
  '044': { kind: 'local', key: 'tteokbokki' },
  '045': { kind: 'local', key: 'rabokki' },
  '046': { kind: 'local', key: 'sundae_bokkeum' },
  '047': { kind: 'local', key: 'sundae_guk' },
  '048': { kind: 'local', key: 'kalguksu' },
  '049': { kind: 'local', key: 'sujebi' },
  '050': { kind: 'local', key: 'haemul_pajeon' },

  // Batch 06 Western (051–060) — cuisine fallback until Image Factory ships
  '051': { kind: 'local', key: 'cream_pasta' },
  '052': { kind: 'local', key: 'tomato_pasta' },
  '053': { kind: 'local', key: 'hamburger' },
  '054': { kind: 'local', key: 'chicken_steak' },
  '055': { kind: 'local', key: 'meatball' },
  '056': { kind: 'local', key: 'potato_gratin' },
  '057': { kind: 'local', key: 'club_sandwich' },
  '058': { kind: 'local', key: 'caesar_salad' },
  '059': { kind: 'local', key: 'omelette' },
  '060': { kind: 'local', key: 'french_toast' },

  // Batch 07 Snack (061–070)
  '061': { kind: 'local', key: 'rose_tteokbokki' },
  '062': { kind: 'local', key: 'spicy_sundae_bokkeum' },
  '063': { kind: 'local', key: 'tuna_gimbap' },
  '064': { kind: 'local', key: 'hotdog' },
  '065': { kind: 'local', key: 'cheese_ball' },
  '066': { kind: 'local', key: 'french_fries' },
  '067': { kind: 'local', key: 'garlic_toast' },
  '068': { kind: 'local', key: 'ramyeon_bokki' },
  '069': { kind: 'local', key: 'goguma_mattang' },
  '070': { kind: 'local', key: 'hotteok' },

  // Batch 08 Healthy (071–080)
  '071': { kind: 'local', key: 'chicken_salad' },
  '072': { kind: 'local', key: 'salmon_poke' },
  '073': { kind: 'local', key: 'tofu_steak' },
  '074': { kind: 'local', key: 'vegetable_soup' },
  '075': { kind: 'local', key: 'quinoa_bowl' },
  '076': { kind: 'local', key: 'brown_rice_bibimbap' },
  '077': { kind: 'local', key: 'konjac_stir_fry' },
  '078': { kind: 'local', key: 'chicken_soup' },
  '079': { kind: 'local', key: 'avocado_toast' },
  '080': { kind: 'local', key: 'greek_yogurt_bowl' },

  // Batch 09 Quick (081–090)
  '081': { kind: 'local', key: 'tuna_mayo_rice' },
  '082': { kind: 'local', key: 'egg_soup' },
  '083': { kind: 'local', key: 'bacon_fried_rice' },
  '084': { kind: 'local', key: 'sausage_veg_stir_fry' },
  '085': { kind: 'local', key: 'cheese_egg_rice' },
  '086': { kind: 'local', key: 'tuna_kimchi_jjigae' },
  '087': { kind: 'local', key: 'instant_curry' },
  '088': { kind: 'local', key: 'bibim_naengmyeon' },
  '089': { kind: 'local', key: 'inari_sushi' },
  '090': { kind: 'local', key: 'pot_udon' },

  // Batch 10 Korean classics II (091–100)
  '091': { kind: 'local', key: 'bossam' },
  '092': { kind: 'local', key: 'jjimdak' },
  '093': { kind: 'local', key: 'nakji_bokkeum' },
  '094': { kind: 'local', key: 'godeungeo_jorim' },
  '095': { kind: 'local', key: 'eungalchi_jorim' },
  '096': { kind: 'local', key: 'doenjang_guk' },
  '097': { kind: 'local', key: 'spinach_namul' },
  '098': { kind: 'local', key: 'nut_myeolchi_bokkeum' },
  '099': { kind: 'local', key: 'egg_gukbap' },
  '100': { kind: 'local', key: 'kimchi_bokkeum' },

  // Legacy core / gold ids (same-dish HANKKI keys where available)
  core_kr_bibimbap: { kind: 'local', key: 'bibimbap' },
  gold_kr_bibimbap: { kind: 'local', key: 'bibimbap' },

  core_kr_kimchi_jjigae: { kind: 'local', key: 'kimchi_stew' },
  gold_kr_kimchi_jjigae: { kind: 'local', key: 'kimchi_stew' },

  core_kr_jeyuk_bokkeum: { kind: 'local', key: 'jaeyuk' },
  gold_kr_jeyuk_bokkeum: { kind: 'local', key: 'jaeyuk' },

  core_kr_bulgogi: { kind: 'local', key: 'bulgogi' },
  core_kr_doenjang_jjigae: { kind: 'local', key: 'soybean_paste_stew' },
  core_kr_kimchi_bokkeumbap: { kind: 'local', key: 'kimchi_fried_rice' },
  core_quick_egg_fried_rice: { kind: 'local', key: 'egg_rice' },
  core_j_donkatsu: { kind: 'local', key: 'pork_cutlet' },

  // Legacy gold keys without dedicated HANKKI file — keep key, resolve via assets map
  core_kr_samgyeopsal: { kind: 'local', key: 'gold_kr_samgyeopsal' },
  gold_kr_samgyeopsal: { kind: 'local', key: 'gold_kr_samgyeopsal' },
  core_kr_jjapaghetti: { kind: 'local', key: 'gold_kr_jjapaghetti' },
  gold_kr_jjapaghetti: { kind: 'local', key: 'gold_kr_jjapaghetti' },
  core_j_udon: { kind: 'local', key: 'gold_j_udon' },
  gold_j_udon: { kind: 'local', key: 'gold_j_udon' },
  core_c_jjajangmyeon: { kind: 'local', key: 'gold_c_jajangmyeon' },
  gold_c_jajangmyeon: { kind: 'local', key: 'gold_c_jajangmyeon' },
  core_w_cream_pasta: { kind: 'local', key: 'gold_w_cream_pasta' },
  gold_w_cream_pasta: { kind: 'local', key: 'gold_w_cream_pasta' },
};

export function normalizeRecipeImageId(recipeId: string): string {
  return RECIPE_ID_ALIASES[recipeId] ?? recipeId;
}

function normalizeImagePath(imagePath: string): string {
  return imagePath.trim().replace(/^\.\//, '').replace(/^\/+/, '');
}

/** Resolve HANKKI `recipe.image` path → local asset key. */
export function getRecipeImageMapEntryByPath(imagePath: string): RecipeImageMapEntry | null {
  const path = normalizeImagePath(imagePath);
  if (!path) return null;

  const mvp = MVP_RECIPE_IMAGE_TABLE.find((row) => row.path === path);
  if (mvp) {
    return { kind: 'local', key: mvp.existingAssetKey };
  }

  const fromRegistry = parseMealImageKeyFromAssetPath(path);
  if (fromRegistry) {
    return { kind: 'local', key: fromRegistry };
  }

  return null;
}

/**
 * Lookup exact image for a recipe id.
 * Prefer RECIPE_IMAGE_MAP id entries; HANKKI path is a secondary path.
 */
export function getRecipeImageMapEntry(recipeId: string): RecipeImageMapEntry | null {
  const direct = RECIPE_IMAGE_MAP[recipeId];
  if (direct) return direct;

  const hankki = getHankkiRecipeById(recipeId);
  if (hankki?.image) {
    const fromPath = getRecipeImageMapEntryByPath(hankki.image);
    if (fromPath) return fromPath;
  }

  if (hankki?.heroImageKey && isRegisteredMealImageKey(hankki.heroImageKey)) {
    return { kind: 'local', key: hankki.heroImageKey };
  }

  const aliased = RECIPE_ID_ALIASES[recipeId];
  if (aliased) {
    const fromAlias = RECIPE_IMAGE_MAP[aliased];
    if (fromAlias) return fromAlias;
  }

  if (recipeId.startsWith('core_')) {
    const goldId = `gold_${recipeId.slice('core_'.length)}`;
    const fromGold = RECIPE_IMAGE_MAP[goldId];
    if (fromGold) return fromGold;

    const goldAliased = RECIPE_ID_ALIASES[goldId];
    if (goldAliased && RECIPE_IMAGE_MAP[goldAliased]) {
      return RECIPE_IMAGE_MAP[goldAliased];
    }
  }

  return null;
}

/** Resolve to a RN image source, or null for clean placeholder. */
export function getRecipeImageSource(recipeId: string): ImageSourcePropType | null {
  const entry = getRecipeImageMapEntry(recipeId);
  if (!entry) return null;
  if (entry.kind === 'local') return getLocalMealImageSource(entry.key);
  return { uri: entry.url };
}

/** Resolve a HANKKI `recipe.image` path to a bundled source, if available. */
export function getRecipeImageSourceByPath(imagePath: string): ImageSourcePropType | null {
  const entry = getRecipeImageMapEntryByPath(imagePath);
  if (!entry) return null;
  if (entry.kind === 'local') return getLocalMealImageSource(entry.key);
  return { uri: entry.url };
}

/** Planned MVP asset path for a recipe id, if this dish is in the first-10 table. */
export function getMvpRecipeImagePath(recipeId: string): string | null {
  return MVP_RECIPE_IMAGE_PATH_BY_RECIPE_ID[recipeId] ?? null;
}
