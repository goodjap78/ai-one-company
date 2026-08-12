/**
 * Sprint 64-B/C — shopping proxy rate limit QA.
 * Run: npm run test:shopping-proxy-rate-limit
 */
import path from 'node:path';
import { NoOpShoppingCache } from '../server/shopping/http/cache';
import { createShoppingProxyContextForTests } from '../server/shopping/http/context';
import {
  dispatchShoppingProxyRequest,
  SHOPPING_PROXY_PATHS,
} from '../server/shopping/http/dispatchShoppingProxyRequest';
import {
  InMemoryShoppingRateLimiter,
  getRateLimitMode,
  isRateLimitActive,
} from '../server/shopping/http/rateLimit';
import {
  hasUpstashRedisEnv,
  resolveUpstashRestCredentials,
} from '../server/shopping/http/upstashEnv';

const APP_ROOT = path.resolve(__dirname, '..');

const UPSTASH_ENV_KEYS = [
  'UPSTASH_REDIS_REST_KV_REST_API_URL',
  'UPSTASH_REDIS_REST_KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

function snapshotUpstashEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const key of UPSTASH_ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreUpstashEnv(snap: Record<string, string | undefined>): void {
  for (const key of UPSTASH_ENV_KEYS) {
    const value = snap[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearUpstashEnv(): void {
  for (const key of UPSTASH_ENV_KEYS) {
    delete process.env[key];
  }
}

async function main(): Promise<void> {
  console.log('Sprint 64 shopping proxy rate limit QA — start\n');

  const mockClient = {
    searchProductsByKeyword: async () => ({
      ok: true as const,
      products: [],
    }),
  };

  const limiter = new InMemoryShoppingRateLimiter(3, 60_000);
  const context = createShoppingProxyContextForTests({
    appRoot: APP_ROOT,
    cache: new NoOpShoppingCache(),
    rateLimiter: limiter,
    isCoupangConfigured: () => true,
    getCoupangClient: () => mockClient,
  });

  await run('H — rate limit exceeded → 429', async () => {
    const ip = 'test-client-1';
    for (let i = 0; i < 3; i += 1) {
      const res = await dispatchShoppingProxyRequest(context, {
        method: 'POST',
        pathname: SHOPPING_PROXY_PATHS.search,
        headers: {},
        bodyRaw: JSON.stringify({ keyword: '대파', limit: 1 }),
        clientIp: ip,
      });
      assert(res.status === 200, `request ${i + 1} allowed`);
    }

    const blocked = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '대파', limit: 1 }),
      clientIp: ip,
    });
    assert(blocked.status === 429, 'status 429');
    const body = blocked.json as { error?: string };
    assert(body.error === 'SHOPPING_RATE_LIMITED', 'rate limit error code');
  });

  await run('Rate limit — separate IP not blocked', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '양파', limit: 1 }),
      clientIp: 'other-ip',
    });
    assert(res.status === 200, 'other ip allowed');
  });

  await run('Rate limit mode — disabled', () => {
    const prevDisabled = process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    const snap = snapshotUpstashEnv();
    process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = 'true';
    clearUpstashEnv();
    assert(getRateLimitMode() === 'disabled', 'disabled mode');
    assert(!isRateLimitActive(), 'not active when disabled');
    if (prevDisabled === undefined) delete process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    else process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = prevDisabled;
    restoreUpstashEnv(snap);
  });

  await run('Rate limit mode — Vercel Marketplace Upstash env', () => {
    const prevDisabled = process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    const prevVercel = process.env.VERCEL;
    const snap = snapshotUpstashEnv();
    clearUpstashEnv();
    process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = 'false';
    process.env.VERCEL = '1';
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = 'token-placeholder';
    assert(hasUpstashRedisEnv(), 'has marketplace env');
    const creds = resolveUpstashRestCredentials();
    assert(creds?.url === 'https://example.upstash.io', 'resolved marketplace url');
    assert(getRateLimitMode() === 'upstash', 'upstash mode');
    assert(isRateLimitActive(), 'active with upstash');
    if (prevDisabled === undefined) delete process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    else process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = prevDisabled;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    restoreUpstashEnv(snap);
  });

  await run('Rate limit mode — standard Upstash env still works', () => {
    const prevDisabled = process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    const prevVercel = process.env.VERCEL;
    const snap = snapshotUpstashEnv();
    clearUpstashEnv();
    process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = 'false';
    process.env.VERCEL = '1';
    process.env.UPSTASH_REDIS_REST_URL = 'https://standard.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'standard-token';
    assert(hasUpstashRedisEnv(), 'has standard env');
    assert(getRateLimitMode() === 'upstash', 'upstash mode via standard names');
    if (prevDisabled === undefined) delete process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    else process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = prevDisabled;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    restoreUpstashEnv(snap);
  });

  await run('Local fallback — no Upstash → in-memory', () => {
    const prevDisabled = process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    const prevVercel = process.env.VERCEL;
    const prevInMemory = process.env.SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY;
    const snap = snapshotUpstashEnv();
    clearUpstashEnv();
    delete process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    delete process.env.VERCEL;
    delete process.env.SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY;
    assert(!hasUpstashRedisEnv(), 'no upstash');
    assert(getRateLimitMode() === 'in-memory', 'local in-memory fallback');
    assert(isRateLimitActive(), 'local rate limit active');
    if (prevDisabled === undefined) delete process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED;
    else process.env.SHOPPING_PROXY_RATE_LIMIT_DISABLED = prevDisabled;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevInMemory === undefined) delete process.env.SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY;
    else process.env.SHOPPING_PROXY_RATE_LIMIT_IN_MEMORY = prevInMemory;
    restoreUpstashEnv(snap);
  });

  console.log('\nSprint 64 shopping proxy rate limit QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — shopping proxy rate limit');
}

void main();
