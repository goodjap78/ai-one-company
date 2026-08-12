import type { ShoppingListMode } from '../../constants/shoppingConfig';
import { COMMON_STAPLE_MATCH_KEYS } from '../../constants/shoppingConfig';
import { isFridgeCoreIngredientGroup } from '../fridge/fridgeIngredientAlignment';
import type { ShoppingIngredientItem } from '../../types/shopping';

export function shoppingItemSelectionKey(item: ShoppingIngredientItem): string {
  return `${item.matchKey}::${item.shoppingKeyword}`;
}

export function isCommonStapleMatchKey(matchKey: string): boolean {
  return COMMON_STAPLE_MATCH_KEYS.includes(matchKey);
}

/**
 * Default checkbox state.
 * - Staples (water/salt/pepper/oil/sugar) off in all modes.
 * - `all`: main ingredients only — sub/seasoning opt-in.
 * - `missing`: missing main/sub auto-selected; seasoning opt-in.
 */
export function defaultIngredientSelected(
  item: ShoppingIngredientItem,
  mode: ShoppingListMode = 'all',
): boolean {
  if (!item.shoppingKeyword.trim()) return false;
  if (isCommonStapleMatchKey(item.matchKey)) return false;
  if (mode === 'missing') return isFridgeCoreIngredientGroup(item.group);
  return item.group === 'main';
}

export function buildDefaultSelectedKeys(
  items: ShoppingIngredientItem[],
  mode: ShoppingListMode = 'all',
): Set<string> {
  const keys = new Set<string>();
  for (const item of items) {
    if (defaultIngredientSelected(item, mode)) {
      keys.add(shoppingItemSelectionKey(item));
    }
  }
  return keys;
}

export function countSelectedItems(
  items: ShoppingIngredientItem[],
  selectedKeys: Set<string>,
): number {
  return items.filter((item) => selectedKeys.has(shoppingItemSelectionKey(item))).length;
}
