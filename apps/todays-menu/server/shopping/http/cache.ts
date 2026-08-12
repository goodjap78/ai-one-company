import type { ShoppingProduct } from '../../../types/shoppingProduct';
import { SHOPPING_PROXY_CACHE_TTL_MS } from './constants';

export type CacheLookup<T> = {
  hit: boolean;
  value: T | null;
};

/**
 * Short-term keyword cache — local in-memory only in this sprint.
 * Distributed cache (Vercel KV / Upstash) can implement this interface later.
 */
export interface ShoppingCache {
  getProducts(key: string): CacheLookup<ShoppingProduct[]>;
  setProducts(key: string, products: ShoppingProduct[], ttlMs?: number): void;
}

type CacheEntry = {
  expiresAtMs: number;
  products: ShoppingProduct[];
};

export class InMemoryShoppingCache implements ShoppingCache {
  private readonly store = new Map<string, CacheEntry>();

  getProducts(key: string): CacheLookup<ShoppingProduct[]> {
    const entry = this.store.get(key);
    if (!entry) return { hit: false, value: null };
    if (Date.now() > entry.expiresAtMs) {
      this.store.delete(key);
      return { hit: false, value: null };
    }
    return { hit: true, value: entry.products };
  }

  setProducts(
    key: string,
    products: ShoppingProduct[],
    ttlMs = SHOPPING_PROXY_CACHE_TTL_MS,
  ): void {
    this.store.set(key, {
      products,
      expiresAtMs: Date.now() + ttlMs,
    });
  }
}

export class NoOpShoppingCache implements ShoppingCache {
  getProducts(): CacheLookup<ShoppingProduct[]> {
    return { hit: false, value: null };
  }

  setProducts(): void {
    // no-op
  }
}

export function buildShoppingCacheKey(keyword: string, limit: number): string {
  return `${keyword.trim().toLowerCase()}::${limit}`;
}

export type ShoppingCacheMode = 'in-memory' | 'none';

export function getCacheMode(): ShoppingCacheMode {
  if (process.env.SHOPPING_PROXY_CACHE_ENABLED === 'true') {
    return 'in-memory';
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'in-memory';
  }
  return 'none';
}

export function createShoppingCache(): ShoppingCache {
  if (process.env.SHOPPING_PROXY_CACHE_ENABLED === 'true') {
    return new InMemoryShoppingCache();
  }
  if (process.env.NODE_ENV !== 'production') {
    return new InMemoryShoppingCache();
  }
  return new NoOpShoppingCache();
}
