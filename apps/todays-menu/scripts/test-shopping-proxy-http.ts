/**
 * Sprint 64-B — shopping proxy HTTP handler QA.
 * Run: npm run test:shopping-proxy-http
 */
import path from 'node:path';
import type { ShoppingProduct } from '../types/shoppingProduct';
import { createShoppingProxyContextForTests } from '../server/shopping/http/context';
import {
  dispatchShoppingProxyRequest,
  SHOPPING_PROXY_PATHS,
} from '../server/shopping/http/dispatchShoppingProxyRequest';
import { NoOpShoppingCache } from '../server/shopping/http/cache';

const APP_ROOT = path.resolve(__dirname, '..');

const mockProduct: ShoppingProduct = {
  id: 'mock-1',
  title: '모크 대파',
  productUrl: 'https://link.coupang.com/re/AFFSDP?mock=1',
  affiliateUrl: 'https://link.coupang.com/re/AFFSDP?mock=1',
  keyword: '대파',
  isAffiliate: true,
  merchant: 'coupang',
  price: 5000,
  imageUrl: 'https://example.com/img.jpg',
};

const mockClient = {
  searchProductsByKeyword: async () => ({
    ok: true as const,
    products: [mockProduct],
  }),
};

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

async function main(): Promise<void> {
  console.log('Sprint 64-B shopping proxy HTTP QA — start\n');

  const context = createShoppingProxyContextForTests({
    appRoot: APP_ROOT,
    cache: new NoOpShoppingCache(),
    isCoupangConfigured: () => true,
    getCoupangClient: () => mockClient,
  });

  await run('A — GET health 200', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'GET',
      pathname: SHOPPING_PROXY_PATHS.health,
      headers: {},
    });
    assert(res.status === 200, 'status 200');
    const body = res.json as { ok?: boolean; coupangConfigured?: boolean };
    assert(body.ok === true, 'ok true');
    assert(typeof body.coupangConfigured === 'boolean', 'coupangConfigured boolean');
  });

  await run('B — POST search valid 200/mock', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'POST',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
      bodyRaw: JSON.stringify({ keyword: '대파', limit: 3 }),
    });
    assert(res.status === 200, 'status 200');
    const body = res.json as { products?: ShoppingProduct[] };
    assert(Array.isArray(body.products) && body.products.length === 1, 'one product');
    assert(body.products![0]!.title.includes('대파'), 'title');
  });

  await run('C — GET search → 405', async () => {
    const res = await dispatchShoppingProxyRequest(context, {
      method: 'GET',
      pathname: SHOPPING_PROXY_PATHS.search,
      headers: {},
    });
    assert(res.status === 405, 'status 405');
    assert(res.headers.Allow === 'POST', 'Allow POST');
  });

  console.log('\nSprint 64-B shopping proxy HTTP QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — shopping proxy http');
}

void main();
