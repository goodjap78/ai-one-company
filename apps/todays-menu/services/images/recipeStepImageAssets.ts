import type { ImageSourcePropType } from 'react-native';

/**
 * Sprint R3 / R4 — cooking-step image keys.
 * Register a key only when the file exists under `assets/recipe-steps/`.
 * Never use dynamic require().
 */
export type RecipeStepImageKey =
  | 'jaeyuk_step_01'
  | 'jaeyuk_step_02'
  | 'jaeyuk_step_03'
  | 'jaeyuk_step_04'
  | 'egg_rice_step_01'
  | 'egg_rice_step_02'
  | 'egg_rice_step_03'
  | 'egg_rice_step_04'
  | 'kimchi_stew_step_01'
  | 'kimchi_stew_step_02'
  | 'kimchi_stew_step_03'
  | 'kimchi_stew_step_04'
  | 'doenjang_stew_step_01'
  | 'doenjang_stew_step_02'
  | 'doenjang_stew_step_03'
  | 'doenjang_stew_step_04'
  | 'bibimbap_step_01'
  | 'bibimbap_step_02'
  | 'bibimbap_step_03'
  | 'bibimbap_step_04'
  | 'bibimbap_step_05'
  | 'bulgogi_step_01'
  | 'bulgogi_step_02'
  | 'bulgogi_step_03'
  | 'bulgogi_step_04'
  | 'kimchi_fried_rice_step_01'
  | 'kimchi_fried_rice_step_02'
  | 'kimchi_fried_rice_step_03'
  | 'kimchi_fried_rice_step_04'
  | 'curry_rice_step_01'
  | 'curry_rice_step_02'
  | 'curry_rice_step_03'
  | 'curry_rice_step_04'
  | 'curry_rice_step_05'
  | 'pork_cutlet_step_01'
  | 'pork_cutlet_step_02'
  | 'pork_cutlet_step_03'
  | 'pork_cutlet_step_04'
  | 'dakgalbi_step_01'
  | 'dakgalbi_step_02'
  | 'dakgalbi_step_03'
  | 'dakgalbi_step_04'
  | 'sundubu_jjigae_step_01'
  | 'sundubu_jjigae_step_02'
  | 'sundubu_jjigae_step_03'
  | 'sundubu_jjigae_step_04'
  | 'dakbokkeumtang_step_01'
  | 'dakbokkeumtang_step_02'
  | 'dakbokkeumtang_step_03'
  | 'dakbokkeumtang_step_04'
  | 'ojingeo_bokkeum_step_01'
  | 'ojingeo_bokkeum_step_02'
  | 'ojingeo_bokkeum_step_03'
  | 'ojingeo_bokkeum_step_04'
  | 'galbitang_step_01'
  | 'galbitang_step_02'
  | 'galbitang_step_03'
  | 'galbitang_step_04'
  | 'yukgaejang_step_01'
  | 'yukgaejang_step_02'
  | 'yukgaejang_step_03'
  | 'yukgaejang_step_04'
  | 'miyeok_guk_step_01'
  | 'miyeok_guk_step_02'
  | 'miyeok_guk_step_03'
  | 'miyeok_guk_step_04'
  | 'tteokguk_step_01'
  | 'tteokguk_step_02'
  | 'tteokguk_step_03'
  | 'tteokguk_step_04'
  | 'gamja_jorim_step_01'
  | 'gamja_jorim_step_02'
  | 'gamja_jorim_step_03'
  | 'gamja_jorim_step_04'
  | 'egg_roll_step_01'
  | 'egg_roll_step_02'
  | 'egg_roll_step_03'
  | 'egg_roll_step_04'
  | 'beef_bulgogi_don_step_01'
  | 'beef_bulgogi_don_step_02'
  | 'beef_bulgogi_don_step_03'
  | 'beef_bulgogi_don_step_04';

/**
 * Static asset registry — no on-disk step photos yet.
 */
export const RECIPE_STEP_IMAGE_ASSETS: Partial<
  Record<RecipeStepImageKey, ImageSourcePropType>
> = {
  // Register with static require() when files exist.
};

export function getRecipeStepImageSource(
  imageKey: string | null | undefined,
): ImageSourcePropType | null {
  if (!imageKey) return null;
  return RECIPE_STEP_IMAGE_ASSETS[imageKey as RecipeStepImageKey] ?? null;
}

export function listRegisteredRecipeStepImageKeys(): RecipeStepImageKey[] {
  return Object.keys(RECIPE_STEP_IMAGE_ASSETS) as RecipeStepImageKey[];
}
