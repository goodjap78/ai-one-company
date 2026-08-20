/**
 * Runtime match guard for meal-kit product results.
 * Same false-positive rules as audit classifyMealKitMatch (production-safe subset).
 */
import type { ShoppingProduct } from '../../../types/shoppingProduct';

const MEAL_KIT_TERMS = ['밀키트', 'meal kit', 'mealkit'];
const READY_MEAL_TERMS = [
  '간편식',
  '간편',
  '즉석',
  '조리완제품',
  '완제품',
  'HMR',
  'hmr',
  '레토르트',
  '냉동',
  '손질',
];
const TOOL_TERMS = [
  '팬',
  '프라이팬',
  '냄비',
  '주걱',
  '도마',
  '칼',
  '그릇',
  '용기',
  '조리도구',
  '키친',
  'kitchen',
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').trim();
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function recipeNameInTitle(recipeName: string, title: string): boolean {
  const recipeNorm = normalizeText(recipeName);
  const titleNorm = normalizeText(title);
  if (recipeNorm.length >= 2 && titleNorm.includes(recipeNorm)) return true;
  return false;
}

function keywordCoreInTitle(searchKeyword: string, title: string): boolean {
  const core = searchKeyword
    .replace(/\s*(밀키트|간편식)\s*/g, ' ')
    .trim();
  if (core.length < 2) return false;
  return normalizeText(title).includes(normalizeText(core));
}

export type MealKitRejectReason =
  | 'accepted'
  | 'missing_recipe_or_keyword'
  | 'missing_meal_kit_or_ready_term'
  | 'tool_or_cookware';

export function explainMealKitProduct(
  recipeName: string,
  searchKeyword: string,
  title: string,
): { accepted: boolean; reason: MealKitRejectReason } {
  const hasName =
    recipeNameInTitle(recipeName, title) || keywordCoreInTitle(searchKeyword, title);
  if (!hasName) {
    return { accepted: false, reason: 'missing_recipe_or_keyword' };
  }

  const hasMealKit = includesAny(title, MEAL_KIT_TERMS);
  const hasReadyMeal = includesAny(title, READY_MEAL_TERMS);
  if (includesAny(title, TOOL_TERMS) && !hasMealKit && !hasReadyMeal) {
    return { accepted: false, reason: 'tool_or_cookware' };
  }
  if (!hasMealKit && !hasReadyMeal) {
    return { accepted: false, reason: 'missing_meal_kit_or_ready_term' };
  }

  return { accepted: true, reason: 'accepted' };
}

/**
 * Accept only products that name-match the recipe (or keyword core)
 * and look like meal-kit / ready-meal — not cookware / unrelated.
 */
export function isAcceptableMealKitProduct(
  recipeName: string,
  searchKeyword: string,
  title: string,
): boolean {
  return explainMealKitProduct(recipeName, searchKeyword, title).accepted;
}

export const MEAL_KIT_MAX_PRODUCTS = 3;

export function filterMealKitProducts(
  recipeName: string,
  searchKeyword: string,
  products: ShoppingProduct[],
  limit = MEAL_KIT_MAX_PRODUCTS,
): ShoppingProduct[] {
  return products
    .filter((product) =>
      isAcceptableMealKitProduct(recipeName, searchKeyword, product.title),
    )
    .slice(0, limit);
}
