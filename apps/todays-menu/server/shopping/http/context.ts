import { getDefaultCoupangPartnersClient } from '../coupangPartnersClient';
import { loadShoppingProxyEnv } from '../loadShoppingProxyEnv';
import { parseAllowedOrigins } from './cors';
import { createShoppingCache, type ShoppingCache } from './cache';
import { SHOPPING_PROXY_SEARCH_LIMIT_MAX } from './constants';
import { createShoppingRateLimiter, type ShoppingRateLimiter } from './rateLimit';

export type ShoppingProxyContext = {
  appRoot?: string;
  maxSearchLimit: number;
  allowedOrigins: string[];
  rateLimiter: ShoppingRateLimiter;
  cache: ShoppingCache;
  isCoupangConfigured: () => boolean;
  getCoupangClient: () => ReturnType<typeof getDefaultCoupangPartnersClient>;
};

export function createShoppingProxyContext(options?: {
  appRoot?: string;
}): ShoppingProxyContext {
  const appRoot = options?.appRoot;
  const allowedOrigins = parseAllowedOrigins(
    process.env.SHOPPING_PROXY_ALLOWED_ORIGINS,
  );

  return {
    appRoot,
    maxSearchLimit: SHOPPING_PROXY_SEARCH_LIMIT_MAX,
    allowedOrigins,
    rateLimiter: createShoppingRateLimiter(),
    cache: createShoppingCache(),
    isCoupangConfigured: () => loadShoppingProxyEnv(appRoot) !== null,
    getCoupangClient: () => getDefaultCoupangPartnersClient(appRoot),
  };
}

/** Test override — does not change production wiring. */
export function createShoppingProxyContextForTests(
  overrides: Partial<ShoppingProxyContext> & { appRoot?: string } = {},
): ShoppingProxyContext {
  const { appRoot, ...rest } = overrides;
  const base = createShoppingProxyContext({ appRoot });
  return { ...base, ...rest };
}
