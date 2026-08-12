import { getCacheMode } from './cache';
import type { ShoppingProxyContext } from './context';
import { getRateLimitMode, isRateLimitActive } from './rateLimit';
import type { ProxyHttpResponse } from './types';

export function handleHealthRequest(context: ShoppingProxyContext): ProxyHttpResponse {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    json: {
      ok: true,
      coupangConfigured: context.isCoupangConfigured(),
      rateLimitMode: getRateLimitMode(),
      rateLimitActive: isRateLimitActive(),
      cacheMode: getCacheMode(),
    },
  };
}
