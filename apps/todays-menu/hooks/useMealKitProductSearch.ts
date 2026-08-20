import { useEffect, useRef, useState } from 'react';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { filterMealKitProducts } from '../services/shopping/mealKit/filterMealKitProducts';
import { getShoppingProductAdapter, isShoppingProductSearchEnabled } from '../services/shopping/productAdapter';
import type { ShoppingProduct } from '../types/shoppingProduct';
import type { ShoppingProductSearchStatus } from '../types/shoppingProduct';

export type MealKitSearchState = {
  status: ShoppingProductSearchStatus;
  products: ShoppingProduct[];
  errorMessage?: string;
};

/**
 * Single-keyword meal-kit search (1 API request). Applies runtime match guard.
 */
export function useMealKitProductSearch(
  recipeName: string | null,
  searchKeyword: string | null,
  enabled: boolean,
): MealKitSearchState {
  const [state, setState] = useState<MealKitSearchState>({
    status: 'idle',
    products: [],
  });
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !recipeName || !searchKeyword) {
      setState({ status: 'idle', products: [] });
      return;
    }

    if (!SHOPPING_CONFIG.productProviderEnabled || !isShoppingProductSearchEnabled()) {
      setState({ status: 'disabled', products: [] });
      return;
    }

    const requestKey = `${recipeName}::${searchKeyword}`;
    requestKeyRef.current = requestKey;
    let cancelled = false;

    setState({ status: 'loading', products: [] });

    const adapter = getShoppingProductAdapter();
    void adapter
      .searchProducts({
        shoppingKeyword: searchKeyword,
        ingredientName: recipeName,
        limit: SHOPPING_CONFIG.maxMealKitSearchResults,
      })
      .then((raw) => {
        if (cancelled || requestKeyRef.current !== requestKey) return;
        const products = filterMealKitProducts(recipeName, searchKeyword, raw);
        setState({
          status: products.length > 0 ? 'success' : 'empty',
          products,
        });
      })
      .catch((error: unknown) => {
        if (cancelled || requestKeyRef.current !== requestKey) return;
        setState({
          status: 'error',
          products: [],
          errorMessage: error instanceof Error ? error.message : 'search_failed',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, recipeName, searchKeyword]);

  return state;
}
