import type { ShoppingIngredientItem } from '../../types/shopping';
import type { ProductSearchRequest } from '../../types/shoppingProduct';
import { shoppingItemSelectionKey } from './shoppingSelection';

export function buildProductSearchRequest(item: ShoppingIngredientItem): ProductSearchRequest {
  return {
    ingredientName: item.ingredientName,
    shoppingKeyword: item.shoppingKeyword,
    matchKey: item.matchKey,
    amountText: item.amountText,
  };
}

export function buildProductSearchRequests(
  items: ShoppingIngredientItem[],
  selectedKeys: Set<string>,
): ProductSearchRequest[] {
  return items
    .filter((item) => selectedKeys.has(shoppingItemSelectionKey(item)))
    .map((item) => buildProductSearchRequest(item));
}
