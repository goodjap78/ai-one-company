/**
 * Peanut vs tree-nut allergy tags from an ingredient line.
 * Does not change iconKeys (peanut image may still stand in for almonds).
 * sesame is intentionally unmapped — no STANDARD tag this sprint.
 */
import type { StandardAllergyTag } from './recipeStandardMetadataTypes';

const PEANUT_NAME = /땅콩|피넛/;
const TREE_NUT_NAME = /아몬드|호두|캐슈|피스타치오|견과|잣/;

export function peanutOrTreeNutAllergyTags(
  ingredientName: string,
  iconKey: string,
): StandardAllergyTag[] {
  if (PEANUT_NAME.test(ingredientName)) return ['peanut'];
  if (TREE_NUT_NAME.test(ingredientName)) return ['nuts'];
  if (iconKey === 'peanut') return ['peanut'];
  return [];
}

export function isTreeNutIngredientName(ingredientName: string): boolean {
  return TREE_NUT_NAME.test(ingredientName) && !PEANUT_NAME.test(ingredientName);
}
