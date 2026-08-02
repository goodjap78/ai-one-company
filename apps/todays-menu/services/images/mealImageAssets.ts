import type { ImageSourcePropType } from 'react-native';
import type { MealLocalAssetKey } from './mealImageTypes';

/**
 * Bundled local meal images.
 * React Native requires static `require()` paths — never dynamic.
 *
 * Sprint H3-10 — HANKKI meal JPEGs registered by exact on-disk filename.
 * `hankki-default` has no .png file; falls back to jaeyuk.jpg.
 */
export const MEAL_LOCAL_IMAGES: Record<MealLocalAssetKey, ImageSourcePropType> = {
  // HANKKI recipes (140 registered, alphabetical)
  avocado_toast: require('../../assets/meals/avocado_toast.jpg'),
  bacon_fried_rice: require('../../assets/meals/bacon_fried_rice.jpg'),
  bean_sprout_japchae: require('../../assets/meals/bean_sprout_japchae.jpg'),
  bean_sprout_noodle_soup: require('../../assets/meals/bean_sprout_noodle_soup.jpg'),
  beef_brisket_sukmyeon: require('../../assets/meals/beef_brisket_sukmyeon.jpg'),
  beef_bulgogi_don: require('../../assets/meals/beef_bulgogi_don.jpg'),
  beef_mushroom_donburi: require('../../assets/meals/beef_mushroom_donburi.jpg'),
  beef_tteokguk: require('../../assets/meals/beef_tteokguk.jpg'),
  bibim_guksu: require('../../assets/meals/bibim_guksu.jpg'),
  bibim_naengmyeon: require('../../assets/meals/bibim_naengmyeon.jpg'),
  bibimbap: require('../../assets/meals/bibimbap.jpg'),
  bossam: require('../../assets/meals/bossam.jpg'),
  brown_rice_bibimbap: require('../../assets/meals/brown_rice_bibimbap.jpg'),
  budae_jjigae: require('../../assets/meals/budae_jjigae.jpg'),
  bugeo_guk: require('../../assets/meals/bugeo_guk.jpg'),
  bulgogi: require('../../assets/meals/bulgogi.jpg'),
  caesar_salad: require('../../assets/meals/caesar_salad.jpg'),
  cheese_ball: require('../../assets/meals/cheese_ball.jpg'),
  cheese_egg_rice: require('../../assets/meals/cheese_egg_rice.jpg'),
  cheese_ramyeon: require('../../assets/meals/cheese_ramyeon.jpg'),
  cheese_sundae_ramyeon: require('../../assets/meals/cheese_sundae_ramyeon.jpg'),
  cheonggukjang_jjigae: require('../../assets/meals/cheonggukjang_jjigae.jpg'),
  cheongyang_tuna_jjigae: require('../../assets/meals/cheongyang_tuna_jjigae.jpg'),
  chicken_breast_donburi: require('../../assets/meals/chicken_breast_donburi.jpg'),
  chicken_salad: require('../../assets/meals/chicken_salad.jpg'),
  chicken_soup: require('../../assets/meals/chicken_soup.jpg'),
  chicken_steak: require('../../assets/meals/chicken_steak.jpg'),
  chicken_veg_stir_fry_solo: require('../../assets/meals/chicken_veg_stir_fry_solo.jpg'),
  club_sandwich: require('../../assets/meals/club_sandwich.jpg'),
  cream_pasta: require('../../assets/meals/cream_pasta.jpg'),
  cucumber_muchim: require('../../assets/meals/cucumber_muchim.jpg'),
  curry_rice: require('../../assets/meals/curry_rice.jpg'),
  dakbokkeumtang: require('../../assets/meals/dakbokkeumtang.jpg'),
  dakgaejang: require('../../assets/meals/dakgaejang.jpg'),
  dakgalbi: require('../../assets/meals/dakgalbi.jpg'),
  doenjang_guk: require('../../assets/meals/doenjang_guk.jpg'),
  dried_pollack_bean_sprout_guk: require('../../assets/meals/dried_pollack_bean_sprout_guk.jpg'),
  dried_pollack_haejang_guk: require('../../assets/meals/dried_pollack_haejang_guk.jpg'),
  dried_radish_doenjang_guk: require('../../assets/meals/dried_radish_doenjang_guk.jpg'),
  dubu_jorim: require('../../assets/meals/dubu_jorim.jpg'),
  dwaeji_bulbaek: require('../../assets/meals/dwaeji_bulbaek.jpg'),
  egg_gukbap: require('../../assets/meals/egg_gukbap.jpg'),
  egg_rice: require('../../assets/meals/egg_rice.jpg'),
  egg_roll: require('../../assets/meals/egg_roll.jpg'),
  egg_soup: require('../../assets/meals/egg_soup.jpg'),
  eggplant_donburi: require('../../assets/meals/eggplant_donburi.jpg'),
  eungalchi_jorim: require('../../assets/meals/eungalchi_jorim.jpg'),
  flying_fish_roe_kimchi_rice: require('../../assets/meals/flying_fish_roe_kimchi_rice.jpg'),
  french_fries: require('../../assets/meals/french_fries.jpg'),
  french_toast: require('../../assets/meals/french_toast.jpg'),
  galbitang: require('../../assets/meals/galbitang.jpg'),
  galchi_jorim: require('../../assets/meals/galchi_jorim.jpg'),
  gamja_jorim: require('../../assets/meals/gamja_jorim.jpg'),
  gamjatang: require('../../assets/meals/gamjatang.jpg'),
  garlic_bread_toast_solo: require('../../assets/meals/garlic_bread_toast_solo.jpg'),
  garlic_toast: require('../../assets/meals/garlic_toast.jpg'),
  gimbap: require('../../assets/meals/gimbap.jpg'),
  godeungeo_gui: require('../../assets/meals/godeungeo_gui.jpg'),
  godeungeo_jorim: require('../../assets/meals/godeungeo_jorim.jpg'),
  goguma_mattang: require('../../assets/meals/goguma_mattang.jpg'),
  greek_yogurt_bowl: require('../../assets/meals/greek_yogurt_bowl.jpg'),
  green_pepper_tuna_bokkeum: require('../../assets/meals/green_pepper_tuna_bokkeum.jpg'),
  haemul_pajeon: require('../../assets/meals/haemul_pajeon.jpg'),
  hamburger: require('../../assets/meals/hamburger.jpg'),
  honey_glazed_rice_cake: require('../../assets/meals/honey_glazed_rice_cake.jpg'),
  hotdog: require('../../assets/meals/hotdog.jpg'),
  hotteok: require('../../assets/meals/hotteok.jpg'),
  inari_sushi: require('../../assets/meals/inari_sushi.jpg'),
  instant_curry: require('../../assets/meals/instant_curry.jpg'),
  jaeyuk: require('../../assets/meals/jaeyuk.jpg'),
  jaeyuk_kimchi_bokkeum: require('../../assets/meals/jaeyuk_kimchi_bokkeum.jpg'),
  janchi_guksu: require('../../assets/meals/janchi_guksu.jpg'),
  janchi_mandu_guk: require('../../assets/meals/janchi_mandu_guk.jpg'),
  japchae: require('../../assets/meals/japchae.jpg'),
  jjimdak: require('../../assets/meals/jjimdak.jpg'),
  kal_mandu_guk: require('../../assets/meals/kal_mandu_guk.jpg'),
  kalguksu: require('../../assets/meals/kalguksu.jpg'),
  kimchi_bokkeum: require('../../assets/meals/kimchi_bokkeum.jpg'),
  kimchi_fried_rice: require('../../assets/meals/kimchi_fried_rice.jpg'),
  kimchi_ramyeon: require('../../assets/meals/kimchi_ramyeon.jpg'),
  kimchi_stew: require('../../assets/meals/kimchi_stew.jpg'),
  kongnamul_guk: require('../../assets/meals/kongnamul_guk.jpg'),
  konjac_stir_fry: require('../../assets/meals/konjac_stir_fry.jpg'),
  lemon_butter_fish: require('../../assets/meals/lemon_butter_fish.jpg'),
  meatball: require('../../assets/meals/meatball.jpg'),
  microwave_egg_steam: require('../../assets/meals/microwave_egg_steam.jpg'),
  microwave_potato: require('../../assets/meals/microwave_potato.jpg'),
  microwave_tofu_steam: require('../../assets/meals/microwave_tofu_steam.jpg'),
  miyeok_guk: require('../../assets/meals/miyeok_guk.jpg'),
  myeolchi_bokkeum: require('../../assets/meals/myeolchi_bokkeum.jpg'),
  naengmyeon: require('../../assets/meals/naengmyeon.jpg'),
  nakji_bibimbap: require('../../assets/meals/nakji_bibimbap.jpg'),
  nakji_bokkeum: require('../../assets/meals/nakji_bokkeum.jpg'),
  nut_myeolchi_bokkeum: require('../../assets/meals/nut_myeolchi_bokkeum.jpg'),
  odeng_tang: require('../../assets/meals/odeng_tang.jpg'),
  ojingeo_bokkeum: require('../../assets/meals/ojingeo_bokkeum.jpg'),
  omelette: require('../../assets/meals/omelette.jpg'),
  omurice: require('../../assets/meals/omurice.jpg'),
  osam_bulgogi: require('../../assets/meals/osam_bulgogi.jpg'),
  pad_thai_stir_noodle: require('../../assets/meals/pad_thai_stir_noodle.jpg'),
  peanut_butter_toast: require('../../assets/meals/peanut_butter_toast.jpg'),
  pork_cutlet: require('../../assets/meals/pork_cutlet.jpg'),
  pork_galbi_jjim: require('../../assets/meals/pork_galbi_jjim.jpg'),
  pot_udon: require('../../assets/meals/pot_udon.jpg'),
  potato_gratin: require('../../assets/meals/potato_gratin.jpg'),
  quinoa_bowl: require('../../assets/meals/quinoa_bowl.jpg'),
  rabokki: require('../../assets/meals/rabokki.jpg'),
  ramyeon: require('../../assets/meals/ramyeon.jpg'),
  ramyeon_bokki: require('../../assets/meals/ramyeon_bokki.jpg'),
  redbean_toast: require('../../assets/meals/redbean_toast.jpg'),
  rose_tteokbokki: require('../../assets/meals/rose_tteokbokki.jpg'),
  salmon_poke: require('../../assets/meals/salmon_poke.jpg'),
  samgyeopsal_gui: require('../../assets/meals/samgyeopsal_gui.jpg'),
  sausage_veg_stir_fry: require('../../assets/meals/sausage_veg_stir_fry.jpg'),
  shrimp_fried_rice_solo: require('../../assets/meals/shrimp_fried_rice_solo.jpg'),
  sogogi_muguk: require('../../assets/meals/sogogi_muguk.jpg'),
  somyeon_jangguk: require('../../assets/meals/somyeon_jangguk.jpg'),
  soybean_paste_stew: require('../../assets/meals/soybean_paste_stew.jpg'),
  spam_kimchi_fried_rice: require('../../assets/meals/spam_kimchi_fried_rice.jpg'),
  spicy_bean_sprout_soup: require('../../assets/meals/spicy_bean_sprout_soup.jpg'),
  spicy_sundae_bokkeum: require('../../assets/meals/spicy_sundae_bokkeum.jpg'),
  spinach_doenjang_muchim: require('../../assets/meals/spinach_doenjang_muchim.jpg'),
  spinach_namul: require('../../assets/meals/spinach_namul.jpg'),
  squid_donburi: require('../../assets/meals/squid_donburi.jpg'),
  sujebi: require('../../assets/meals/sujebi.jpg'),
  sundae_bokkeum: require('../../assets/meals/sundae_bokkeum.jpg'),
  sundae_guk: require('../../assets/meals/sundae_guk.jpg'),
  sundubu_jjigae: require('../../assets/meals/sundubu_jjigae.jpg'),
  tofu_kimchi_jjigae_solo: require('../../assets/meals/tofu_kimchi_jjigae_solo.jpg'),
  tofu_steak: require('../../assets/meals/tofu_steak.jpg'),
  tomato_pasta: require('../../assets/meals/tomato_pasta.jpg'),
  tteok_mandu_guk: require('../../assets/meals/tteok_mandu_guk.jpg'),
  tteokbokki: require('../../assets/meals/tteokbokki.jpg'),
  tteokgalbi: require('../../assets/meals/tteokgalbi.jpg'),
  tteokguk: require('../../assets/meals/tteokguk.jpg'),
  tuna_gimbap: require('../../assets/meals/tuna_gimbap.jpg'),
  tuna_kimchi_jjigae: require('../../assets/meals/tuna_kimchi_jjigae.jpg'),
  tuna_mayo_rice: require('../../assets/meals/tuna_mayo_rice.jpg'),
  vegetable_soup: require('../../assets/meals/vegetable_soup.jpg'),
  yukgaejang: require('../../assets/meals/yukgaejang.jpg'),

  // Fallback key — never require hankki-default.png (missing)
  'hankki-default': require('../../assets/meals/jaeyuk.jpg'),

  // Legacy gold_* keys → same-dish HANKKI file or category_default
  gold_kr_kimchi_jjigae: require('../../assets/meals/kimchi_stew.jpg'),
  gold_kr_samgyeopsal: require('../../assets/meals/category_default.png'),
  gold_kr_jeyuk_bokkeum: require('../../assets/meals/jaeyuk.jpg'),
  gold_kr_bibimbap: require('../../assets/meals/bibimbap.jpg'),
  gold_kr_jjapaghetti: require('../../assets/meals/category_default.png'),
  gold_j_udon: require('../../assets/meals/category_default.png'),
  gold_c_jajangmyeon: require('../../assets/meals/category_default.png'),
  gold_w_cream_pasta: require('../../assets/meals/category_default.png'),

  category_korean: require('../../assets/meals/category_korean.png'),
  category_japanese: require('../../assets/meals/category_japanese.png'),
  category_chinese: require('../../assets/meals/category_chinese.png'),
  category_western: require('../../assets/meals/category_western.png'),
  category_default: require('../../assets/meals/category_default.png'),
};

export function getLocalMealImageSource(key: MealLocalAssetKey): ImageSourcePropType {
  return MEAL_LOCAL_IMAGES[key] ?? MEAL_LOCAL_IMAGES.category_default;
}

/** True when `key` has a static Metro `require()` entry (not category fallback). */
export function isRegisteredMealImageKey(key: string): key is MealLocalAssetKey {
  return Object.prototype.hasOwnProperty.call(MEAL_LOCAL_IMAGES, key);
}

const MEAL_ASSET_PATH_RE = /^assets\/meals\/([a-z0-9_]+)\.(?:jpg|jpeg|png)$/i;

/**
 * Parse `assets/meals/{heroImageKey}.jpg` → registry key when registered.
 * Supports all bundled meal heroes without per-recipe RECIPE_IMAGE_MAP rows.
 */
export function parseMealImageKeyFromAssetPath(imagePath: string): MealLocalAssetKey | null {
  const normalized = imagePath.trim().replace(/^\.\//, '').replace(/^\/+/, '');
  const match = normalized.match(MEAL_ASSET_PATH_RE);
  if (!match) return null;
  const key = match[1];
  return isRegisteredMealImageKey(key) ? key : null;
}

/**
 * Last-resort bundled food-area image (cuisine-neutral tone).
 */
export function getDefaultMealImageSource(): ImageSourcePropType {
  return MEAL_LOCAL_IMAGES.category_default;
}
