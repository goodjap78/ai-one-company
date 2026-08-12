import { SHOPPING_CONFIG } from '../../constants/shoppingConfig';
import type {
  IngredientProductResult,
  ProductSearchRequest,
  ShoppingProductSearchStatus,
} from '../../types/shoppingProduct';
import { trackShoppingEvent } from './shoppingAnalytics';
import { getShoppingProductAdapter, isShoppingProductSearchEnabled } from './productAdapter';
import type { ShoppingProductAdapter } from './productAdapter/types';

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function statusFromProducts(
  availability: ShoppingProductAdapter['availability'],
  products: ShoppingProduct[],
  errorMessage?: string,
): ShoppingProductSearchStatus {
  if (availability === 'disabled') return 'disabled';
  if (errorMessage) return 'error';
  if (products.length === 0) return 'empty';
  return 'success';
}

async function searchOne(
  adapter: ShoppingProductAdapter,
  request: ProductSearchRequest,
  limit: number,
): Promise<IngredientProductResult> {
  if (adapter.availability === 'disabled') {
    return {
      request,
      status: 'disabled',
      products: [],
    };
  }

  try {
    trackShoppingEvent('shopping_ingredient_search', {
      keyword: request.shoppingKeyword,
      matchKey: request.matchKey,
    });

    const products = await adapter.searchProducts({
      shoppingKeyword: request.shoppingKeyword,
      ingredientName: request.ingredientName,
      limit,
    });

    return {
      request,
      status: statusFromProducts(adapter.availability, products),
      products,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'search_failed';
    return {
      request,
      status: 'error',
      products: [],
      errorMessage: message,
    };
  }
}

/**
 * MVP strategy: independent search per selected ingredient (top N each).
 * Concurrency capped via SHOPPING_CONFIG.maxConcurrentSearches.
 */
export async function searchProductsForRequests(
  requests: ProductSearchRequest[],
): Promise<IngredientProductResult[]> {
  if (requests.length === 0) return [];

  const adapter = getShoppingProductAdapter();

  if (!isShoppingProductSearchEnabled()) {
    return requests.map((request) => ({
      request,
      status: 'disabled' as const,
      products: [],
    }));
  }

  const limit = SHOPPING_CONFIG.maxProductsPerIngredient;
  const concurrency = Math.max(1, SHOPPING_CONFIG.maxConcurrentSearches);

  return mapWithConcurrency(requests, concurrency, (request) => searchOne(adapter, request, limit));
}

export function idleProductResults(requests: ProductSearchRequest[]): IngredientProductResult[] {
  return requests.map((request) => ({
    request,
    status: 'idle',
    products: [],
  }));
}
