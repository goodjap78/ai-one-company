import {
  SHOPPING_PROXY_RATE_LIMIT_MAX,
  SHOPPING_PROXY_RATE_LIMIT_WINDOW_MS,
} from './constants';
import { UpstashShoppingRateLimiter } from './rateLimitUpstash';
import { hasUpstashRedisEnv } from './upstashEnv';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

export type ShoppingRateLimitMode = 'upstash' | 'in-memory' | 'none' | 'disabled';

/**
 * Rate limit abstraction — in-memory for local dev; Upstash Redis on Vercel production.
 */
export interface ShoppingRateLimiter {
  check(clientKey: string): Promise<RateLimitResult>;
}

type WindowState = {
  count: number;
  windowStartMs: number;
};

export class InMemoryShoppingRateLimiter implements ShoppingRateLimiter {
  private readonly buckets = new Map<string, WindowState>();
  private readonly max: number;
  private readonly windowMs: number;

  constructor(
    max = SHOPPING_PROXY_RATE_LIMIT_MAX,
    windowMs = SHOPPING_PROXY_RATE_LIMIT_WINDOW_MS,
  ) {
    this.max = max;
    this.windowMs = windowMs;
  }

  async check(clientKey: string): Promise<RateLimitResult> {
    const key = clientKey.trim() || 'unknown';
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now - current.windowStartMs >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStartMs: now });
      return { allowed: true, remaining: this.max - 1 };
    }

    if (current.count >= this.max) {
      return { allowed: false, remaining: 0 };
    }

    current.count += 1;
    return { allowed: true, remaining: this.max - current.count };
  }
}

/** Production serverless placeholder — always allow until Upstash or in-memory override. */
export class NoOpShoppingRateLimiter implements ShoppingRateLimiter {
  async check(): Promise<RateLimitResult> {
    return { allowed: true, remaining: SHOPPING_PROXY_RATE_LIMIT_MAX };
  }
}

export { hasUpstashRedisEnv };

export function getRateLimitMode(): ShoppingRateLimitMode {
  if (process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED === 'true') {
    return 'disabled';
  }
  if (hasUpstashRedisEnv()) {
    return 'upstash';
  }
  if (process.env.VERCEL === '1' && !process.env.SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY) {
    return 'none';
  }
  return 'in-memory';
}

export function isRateLimitActive(): boolean {
  const mode = getRateLimitMode();
  return mode === 'upstash' || mode === 'in-memory';
}

export function createShoppingRateLimiter(): ShoppingRateLimiter {
  const mode = getRateLimitMode();
  if (mode === 'disabled' || mode === 'none') {
    return new NoOpShoppingRateLimiter();
  }
  if (mode === 'upstash') {
    return new UpstashShoppingRateLimiter();
  }
  return new InMemoryShoppingRateLimiter();
}
