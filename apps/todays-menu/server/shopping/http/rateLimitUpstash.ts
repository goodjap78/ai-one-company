import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  SHOPPING_PROXY_RATE_LIMIT_MAX,
  SHOPPING_PROXY_RATE_LIMIT_WINDOW_MS,
} from './constants';
import type { RateLimitResult, ShoppingRateLimiter } from './rateLimit';
import { resolveUpstashRestCredentials } from './upstashEnv';

const UPSTASH_WINDOW_SECONDS = Math.max(
  1,
  Math.round(SHOPPING_PROXY_RATE_LIMIT_WINDOW_MS / 1000),
);

/**
 * Distributed rate limit for Vercel serverless.
 * Uses resolveUpstashRestCredentials() — prefers Marketplace env names
 * (UPSTASH_REDIS_REST_KV_REST_API_URL / TOKEN), not Redis.fromEnv() alone.
 */
export class UpstashShoppingRateLimiter implements ShoppingRateLimiter {
  private readonly ratelimit: Ratelimit;

  constructor() {
    const credentials = resolveUpstashRestCredentials();
    if (!credentials) {
      throw new Error(
        'Upstash Redis REST credentials are not configured for shopping rate limit.',
      );
    }

    const redis = new Redis({
      url: credentials.url,
      token: credentials.token,
    });

    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        SHOPPING_PROXY_RATE_LIMIT_MAX,
        `${UPSTASH_WINDOW_SECONDS} s`,
      ),
      prefix: 'hankki-shopping-proxy',
    });
  }

  async check(clientKey: string): Promise<RateLimitResult> {
    const key = clientKey.trim() || 'unknown';
    const { success, remaining } = await this.ratelimit.limit(key);
    return {
      allowed: success,
      remaining: Math.max(0, remaining),
    };
  }
}
