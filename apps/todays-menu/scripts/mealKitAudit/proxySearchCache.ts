import fs from 'node:fs';
import path from 'node:path';
import type { ShoppingProduct } from '../../types/shoppingProduct';

const SEARCH_PATH = '/api/shopping/coupang/search';

export type ProxySearchStats = {
  apiRequestCount: number;
  rateLimitEvents: number;
  cacheHits: number;
};

export function loadDotEnv(appRoot: string): void {
  for (const file of ['.env', '.env.local']) {
    const envPath = path.join(appRoot, file);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function resolveProxyBaseUrl(): string {
  const production = process.env.SHOPPING_PROXY_PRODUCTION_BASE_URL?.trim().replace(/\/$/, '');
  if (production) return production;
  const local = process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim().replace(/\/$/, '');
  if (local) return local;
  throw new Error('Set SHOPPING_PROXY_PRODUCTION_BASE_URL or EXPO_PUBLIC_SHOPPING_API_BASE_URL');
}

export function createProxySearchClient(options: {
  delayMs: number;
  cooldownMs: number;
}): {
  search: (keyword: string, limit: number) => Promise<ShoppingProduct[]>;
  stats: () => ProxySearchStats;
} {
  const cache = new Map<string, ShoppingProduct[]>();
  const stats: ProxySearchStats = {
    apiRequestCount: 0,
    rateLimitEvents: 0,
    cacheHits: 0,
  };
  const baseUrl = resolveProxyBaseUrl();
  let queue: Promise<void> = Promise.resolve();

  async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchOnce(
    keyword: string,
    limit: number,
  ): Promise<{ products: ShoppingProduct[]; rateLimited: boolean }> {
    const response = await fetch(`${baseUrl}${SEARCH_PATH}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword, limit }),
    });

    if (response.status === 429) {
      return { products: [], rateLimited: true };
    }

    const payload = (await response.json()) as {
      products?: ShoppingProduct[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? `http_${response.status}`);
    }
    return {
      products: Array.isArray(payload.products) ? payload.products : [],
      rateLimited: false,
    };
  }

  async function searchUnqueued(keyword: string, limit: number): Promise<ShoppingProduct[]> {
    const key = `${keyword}::${limit}`;
    const cached = cache.get(key);
    if (cached) {
      stats.cacheHits += 1;
      return cached;
    }

    await sleep(options.delayMs);
    stats.apiRequestCount += 1;
    let result = await fetchOnce(keyword, limit);
    if (result.rateLimited) {
      stats.rateLimitEvents += 1;
      await sleep(options.cooldownMs);
      stats.apiRequestCount += 1;
      result = await fetchOnce(keyword, limit);
      if (result.rateLimited) {
        cache.set(key, []);
        return [];
      }
    }

    cache.set(key, result.products);
    return result.products;
  }

  return {
    async search(keyword: string, limit: number) {
      const run = queue.then(() => searchUnqueued(keyword, limit));
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
    stats: () => ({ ...stats }),
  };
}
