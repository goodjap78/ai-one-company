/**
 * Server-side Coupang Partners API client.
 * SECURITY: credentials never leave this module's server process.
 */
import type { ShoppingProduct } from '../../types/shoppingProduct';
import { buildCoupangAuthorization } from './coupangHmac';
import type {
  CoupangApiResponse,
  CoupangClientError,
  CoupangProductSearchData,
} from './coupangPartnersTypes';
import { loadShoppingProxyEnv, type ShoppingProxyEnv } from './loadShoppingProxyEnv';
import { mapCoupangSearchItems } from './mapCoupangProducts';
import { validateCoupangSearchInput } from './validateSearchInput';

export const COUPANG_API_BASE_URL = 'https://api-gateway.coupang.com';
export const COUPANG_PRODUCT_SEARCH_PATH =
  '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';

export type CoupangPartnersClientConfig = ShoppingProxyEnv;

export type CoupangSearchResult =
  | { ok: true; products: ShoppingProduct[] }
  | { ok: false; error: CoupangClientError };

function buildSearchPath(keyword: string, limit: number, subId?: string): string {
  const params = new URLSearchParams();
  params.set('keyword', keyword);
  params.set('limit', String(limit));
  params.set('srpLinkOnly', 'false');
  if (subId) {
    params.set('subId', subId);
  }
  return `${COUPANG_PRODUCT_SEARCH_PATH}?${params.toString()}`;
}

export function createCoupangPartnersClient(config: CoupangPartnersClientConfig) {
  async function searchProductsByKeyword(
    keyword: string,
    limit: number,
  ): Promise<CoupangSearchResult> {
    const validated = validateCoupangSearchInput({ keyword, limit });
    if (!validated) {
      return {
        ok: false,
        error: {
          code: 'invalid_keyword',
          message: 'invalid_keyword',
        },
      };
    }

    const requestPath = buildSearchPath(
      validated.keyword,
      validated.limit,
      config.subId,
    );
    const authorization = buildCoupangAuthorization(
      'GET',
      requestPath,
      config.accessKey,
      config.secretKey,
    );

    const url = `${COUPANG_API_BASE_URL}${requestPath}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: 'http_error',
            message: `coupang_http_${response.status}`,
            status: response.status,
          },
        };
      }

      const payload = (await response.json()) as CoupangApiResponse<CoupangProductSearchData>;

      if (!payload || typeof payload.rCode !== 'string') {
        return {
          ok: false,
          error: {
            code: 'malformed_response',
            message: 'missing_rCode',
          },
        };
      }

      if (payload.rCode !== '0') {
        return {
          ok: false,
          error: {
            code: 'api_error',
            message: payload.rMessage?.trim() || `coupang_rCode_${payload.rCode}`,
            rCode: payload.rCode,
          },
        };
      }

      const items = payload.data?.productData ?? [];
      const products = mapCoupangSearchItems(items, validated.keyword);

      return { ok: true, products };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: {
            code: 'timeout',
            message: 'request_timeout',
          },
        };
      }

      return {
        ok: false,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'network_error',
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { searchProductsByKeyword };
}

export function getDefaultCoupangPartnersClient(appRoot?: string) {
  const env = loadShoppingProxyEnv(appRoot);
  if (!env) return null;
  return createCoupangPartnersClient(env);
}
