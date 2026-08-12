import { useEffect, useMemo, useRef, useState } from 'react';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { buildProductSearchRequests } from '../services/shopping/buildProductSearchRequests';
import {
  applyFetchedProductResults,
  invalidateNonSuccessProductCache,
  planProductSearches,
  productRequestKey,
} from '../services/shopping/productResultCache';
import { searchProductsForRequests } from '../services/shopping/searchProductsForRequests';
import type { ShoppingIngredientItem } from '../types/shopping';
import type { IngredientProductResult } from '../types/shoppingProduct';

function selectedKeysSignature(selectedKeys: Set<string>): string {
  return Array.from(selectedKeys).sort().join('\0');
}

/**
 * Per-ingredient product search for the shopping screen.
 *
 * - Keeps SUCCESS results in a session cache across deselect/reselect
 * - Retries EMPTY / ERROR on reselect (does not stick stale empty)
 * - Only fetches newly needed ingredients (avoids re-hitting rate limits for SUCCESS)
 */
export function useShoppingProductResults(
  items: ShoppingIngredientItem[],
  selectedKeys: Set<string>,
): {
  results: IngredientProductResult[];
  loading: boolean;
} {
  const selectionSig = useMemo(
    () => selectedKeysSignature(selectedKeys),
    [selectedKeys],
  );

  const requests = useMemo(
    () => buildProductSearchRequests(items, selectedKeys),
    // selectionSig captures Set contents; items identity still required
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedKeys via selectionSig
    [items, selectionSig],
  );

  const cacheRef = useRef<Map<string, IngredientProductResult>>(new Map());
  const itemsRef = useRef(items);
  const [results, setResults] = useState<IngredientProductResult[]>([]);
  const [loading, setLoading] = useState(false);

  // New shopping list (e.g. recipe/mode change) — drop session cache.
  if (itemsRef.current !== items) {
    cacheRef.current = new Map();
    itemsRef.current = items;
  }

  useEffect(() => {
    if (requests.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (!SHOPPING_CONFIG.productProviderEnabled) {
      setResults(
        requests.map((request) => ({
          request,
          status: 'disabled' as const,
          products: [],
        })),
      );
      setLoading(false);
      return;
    }

    const cache = cacheRef.current;

    // Reselect path: clear stale EMPTY/ERROR so plan treats them as fetch-needed.
    for (const request of requests) {
      invalidateNonSuccessProductCache(cache, productRequestKey(request));
    }

    const { visible, toFetch } = planProductSearches(requests, cache);
    setResults(visible);

    if (toFetch.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void searchProductsForRequests(toFetch).then((fetched) => {
      if (cancelled) return;
      const next = applyFetchedProductResults(requests, cache, fetched);
      setResults(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [requests]);

  return { results, loading };
}
