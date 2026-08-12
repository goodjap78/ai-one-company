import type { ImageSourcePropType } from 'react-native';
import {
  resolveIngredientIcon,
  type ResolveIngredientIconInput,
} from '../services/images/resolveIngredientIcon';

/**
 * Sprint R3 / R5-2 — resolve ingredient icon via static registry + alias map.
 * Missing assets → category / generic fallback, then null (soft pastel UI).
 */
export function resolveIngredientIconSource(
  input: ResolveIngredientIconInput,
): ImageSourcePropType | null {
  return resolveIngredientIcon(input);
}
