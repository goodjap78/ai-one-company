/** Max POST JSON body for shopping proxy endpoints. */
export const SHOPPING_PROXY_MAX_BODY_BYTES = 1024;

/** Public proxy search limit cap (MVP top 3; allow small buffer). */
export const SHOPPING_PROXY_SEARCH_LIMIT_MAX = 5;

/** Per-IP rate limit — requests per window. */
export const SHOPPING_PROXY_RATE_LIMIT_MAX = 30;

/** Rate limit window in milliseconds. */
export const SHOPPING_PROXY_RATE_LIMIT_WINDOW_MS = 60_000;

/** Short-term keyword cache TTL (10–15 min range). */
export const SHOPPING_PROXY_CACHE_TTL_MS = 12 * 60 * 1000;
