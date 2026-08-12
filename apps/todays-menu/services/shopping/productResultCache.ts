import type {
  IngredientProductResult,
  ProductSearchRequest,
} from '../../types/shoppingProduct';

/** Matches `shoppingItemSelectionKey` / ShoppingScreen lookup. */
export function productRequestKey(request: ProductSearchRequest): string {
  return `${request.matchKey}::${request.shoppingKeyword}`;
}

/**
 * SUCCESS with products can be shown again on reselect without a new API call.
 * EMPTY / ERROR / idle / loading / disabled must not stick across reselect.
 */
export function shouldReuseProductResult(
  result: IngredientProductResult | undefined,
): boolean {
  return Boolean(
    result && result.status === 'success' && result.products.length > 0,
  );
}

export function planProductSearches(
  requests: ProductSearchRequest[],
  cache: ReadonlyMap<string, IngredientProductResult>,
): {
  visible: IngredientProductResult[];
  toFetch: ProductSearchRequest[];
} {
  const visible: IngredientProductResult[] = [];
  const toFetch: ProductSearchRequest[] = [];

  for (const request of requests) {
    const key = productRequestKey(request);
    const cached = cache.get(key);
    if (shouldReuseProductResult(cached)) {
      visible.push(cached!);
      continue;
    }
    toFetch.push(request);
    visible.push({
      request,
      status: 'loading',
      products: [],
    });
  }

  return { visible, toFetch };
}

export function applyFetchedProductResults(
  selectedRequests: ProductSearchRequest[],
  cache: Map<string, IngredientProductResult>,
  fetched: IngredientProductResult[],
): IngredientProductResult[] {
  for (const result of fetched) {
    cache.set(productRequestKey(result.request), result);
  }

  return selectedRequests.map((request) => {
    const key = productRequestKey(request);
    return (
      cache.get(key) ?? {
        request,
        status: 'empty' as const,
        products: [],
      }
    );
  });
}

/** Drop non-success entries so a later reselect always retries. */
export function invalidateNonSuccessProductCache(
  cache: Map<string, IngredientProductResult>,
  requestKey: string,
): void {
  const existing = cache.get(requestKey);
  if (!existing) return;
  if (!shouldReuseProductResult(existing)) {
    cache.delete(requestKey);
  }
}
