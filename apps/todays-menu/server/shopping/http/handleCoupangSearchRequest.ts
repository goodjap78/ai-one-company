import { SHOPPING_PROXY_MAX_BODY_BYTES } from './constants';
import { validateCoupangSearchInput } from '../validateSearchInput';
import { buildShoppingCacheKey } from './cache';
import type { ShoppingProxyContext } from './context';
import { parseJsonBody } from './body';
import { mapCoupangClientErrorToHttp, shoppingErrorResponse } from './errors';
import type { ProxyHttpResponse } from './types';

function clientIpKey(rawIp: string | undefined): string {
  const ip = rawIp?.trim();
  return ip && ip.length > 0 ? ip : 'unknown';
}

export async function handleCoupangSearchRequest(
  context: ShoppingProxyContext,
  bodyRaw: string | undefined,
  clientIp?: string,
): Promise<ProxyHttpResponse> {
  const baseHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };

  if (bodyRaw && Buffer.byteLength(bodyRaw, 'utf8') > SHOPPING_PROXY_MAX_BODY_BYTES) {
    return {
      status: 413,
      headers: baseHeaders,
      json: shoppingErrorResponse(413, 'SHOPPING_PAYLOAD_TOO_LARGE').json,
    };
  }

  const limiter = await context.rateLimiter.check(clientIpKey(clientIp));
  if (!limiter.allowed) {
    return {
      status: 429,
      headers: baseHeaders,
      json: shoppingErrorResponse(429, 'SHOPPING_RATE_LIMITED').json,
    };
  }

  const client = context.getCoupangClient();
  if (!client) {
    return {
      status: 503,
      headers: baseHeaders,
      json: shoppingErrorResponse(503, 'SHOPPING_PROVIDER_UNAVAILABLE').json,
    };
  }

  let parsed: unknown;
  try {
    parsed = parseJsonBody(bodyRaw ?? '');
  } catch {
    return {
      status: 400,
      headers: baseHeaders,
      json: shoppingErrorResponse(400, 'SHOPPING_INVALID_REQUEST', 'Invalid JSON body.').json,
    };
  }

  const body = parsed as { keyword?: unknown; limit?: unknown };
  const validated = validateCoupangSearchInput(body, context.maxSearchLimit);
  if (!validated) {
    return {
      status: 400,
      headers: baseHeaders,
      json: shoppingErrorResponse(
        400,
        'SHOPPING_INVALID_REQUEST',
        'keyword is required and must be a non-empty string.',
      ).json,
    };
  }

  const cacheKey = buildShoppingCacheKey(validated.keyword, validated.limit);
  const cached = context.cache.getProducts(cacheKey);
  if (cached.hit && cached.value) {
    return {
      status: 200,
      headers: baseHeaders,
      json: { products: cached.value },
    };
  }

  const result = await client.searchProductsByKeyword(
    validated.keyword,
    validated.limit,
  );

  if (!result.ok) {
    const mapped = mapCoupangClientErrorToHttp(result.error.code);
    return {
      status: mapped.status,
      headers: baseHeaders,
      json: shoppingErrorResponse(mapped.status, mapped.error).json,
    };
  }

  context.cache.setProducts(cacheKey, result.products);
  return {
    status: 200,
    headers: baseHeaders,
    json: { products: result.products },
  };
}
