import type { ImageSourcePropType } from 'react-native';
import { getRecipeStepImageSource } from '../services/images/recipeStepImageAssets';

/**
 * Sprint R3 — resolve step photo via static registry only.
 * Missing assets → null (UI stays text-only; no placeholder box).
 */
export function resolveStepImageSource(
  imageKey: string | null | undefined,
): ImageSourcePropType | null {
  return getRecipeStepImageSource(imageKey);
}
