import type { ShoppingProduct } from '../../types/shoppingProduct';
import { getShoppingApiBaseUrl } from './shoppingApiConfig';

export type ShoppingProxySearchResponse = {
  products?: ShoppingProduct[];
  error?: string;
  message?: string;
};

const SEARCH_PATH = '/api/shopping/coupang/search';

/**
 * Calls HANKKI shopping proxy — never Coupang directly from the client.
 */
export async function fetchShoppingProductsFromProxy(
  keyword: string,
  limit: number,
): Promise<ShoppingProduct[]> {
  const baseUrl = getShoppingApiBaseUrl();
  if (!baseUrl) {
    throw new Error('shopping_api_not_configured');
  }

  const response = await fetch(`${baseUrl}${SEARCH_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword, limit }),
  });

  const payload = (await response.json()) as ShoppingProxySearchResponse;

  if (!response.ok) {
    const code = payload.error ?? `http_${response.status}`;
    throw new Error(code);
  }

  if (!Array.isArray(payload.products)) {
    throw new Error('malformed_proxy_response');
  }

  return payload.products;
}
