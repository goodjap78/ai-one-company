import { compactIngredientName, INGREDIENT_ALIASES, lookupIngredientAlias } from '../../data/ingredients/ingredientAliases';
import type { PantryItem, PantrySnapshot } from '../../types/pantry';
import type { RecipeIngredient } from '../../data/recipes/types';

/** Virtual match key for the unified "면류" pantry chip — not a recipe iconKey. */
export const FRIDGE_NOODLE_MATCH_KEY = 'fridge_noodle';

const NOODLE_NAME_PATTERN =
  /소면|칼국수|국수|라면|냉면|당면|우동|파스타|스파게티|면사리|냉면사리|칼국수면/;
const RICE_CAKE_NAME_PATTERN = /떡|떡국|순대|떡볶이|떡국떡/;

/**
 * Temporarily remap mis-tagged noodle ingredients that still use `rice_cake` iconKey.
 * Recipe source data is intentionally not bulk-edited in this MVP.
 */
export function resolveRecipeIngredientMatchKey(ingredient: Pick<RecipeIngredient, 'iconKey' | 'name'>): string {
  return resolveFridgeMatchKey(ingredient.iconKey, ingredient.name);
}

export function resolveFridgeMatchKey(iconKey: string, name: string): string {
  const key = iconKey?.trim() ?? '';
  if (key !== 'rice_cake') return key;

  const compact = compactIngredientName(name);
  if (NOODLE_NAME_PATTERN.test(compact)) return FRIDGE_NOODLE_MATCH_KEY;
  if (RICE_CAKE_NAME_PATTERN.test(compact)) return 'rice_cake';
  return 'rice_cake';
}

export function resolvePantryItemMatchKey(iconKey: string, name: string): string {
  if (iconKey === FRIDGE_NOODLE_MATCH_KEY) return FRIDGE_NOODLE_MATCH_KEY;
  return resolveFridgeMatchKey(iconKey, name);
}

export function buildPantryMatchKeySet(pantry: PantrySnapshot | PantryItem[]): Set<string> {
  const items = Array.isArray(pantry) ? pantry : pantry.items;
  const keys = new Set<string>();
  for (const item of items) {
    const matchKey = resolvePantryItemMatchKey(item.iconKey, item.name);
    if (matchKey) keys.add(matchKey);
  }
  return keys;
}

export function pantryOwnsMatchKey(ownedKeys: Set<string>, matchKey: string): boolean {
  if (!matchKey) return false;
  return ownedKeys.has(matchKey);
}

const FRIDGE_INPUT_ALIASES: Record<string, string> = {
  토마토: 'tomato',
  방울토마토: 'tomato',
  우유: 'milk',
  버터: 'butter',
  아보카도: 'avocado',
  식빵: 'bread_crumbs',
  통밀식빵: 'bread_crumbs',
  면류: FRIDGE_NOODLE_MATCH_KEY,
  면: FRIDGE_NOODLE_MATCH_KEY,
};

const VALID_FRIDGE_ICON_KEYS = new Set<string>([
  ...Object.values(INGREDIENT_ALIASES),
  ...Object.values(FRIDGE_INPUT_ALIASES),
  FRIDGE_NOODLE_MATCH_KEY,
  'tomato',
  'milk',
  'butter',
  'avocado',
  'bread_crumbs',
]);

export type ResolvedFridgeIngredient = {
  name: string;
  iconKey: string;
  matchKey: string;
};

export function resolveFridgeIngredientInput(raw: string): ResolvedFridgeIngredient | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const aliasIconKey =
    FRIDGE_INPUT_ALIASES[trimmed] ??
    lookupIngredientAlias(trimmed);

  if (!aliasIconKey) return null;

  if (aliasIconKey === FRIDGE_NOODLE_MATCH_KEY) {
    return {
      name: '면류',
      iconKey: FRIDGE_NOODLE_MATCH_KEY,
      matchKey: FRIDGE_NOODLE_MATCH_KEY,
    };
  }

  if (!VALID_FRIDGE_ICON_KEYS.has(aliasIconKey)) {
    return null;
  }

  return {
    name: trimmed,
    iconKey: aliasIconKey,
    matchKey: resolveFridgeMatchKey(aliasIconKey, trimmed),
  };
}
