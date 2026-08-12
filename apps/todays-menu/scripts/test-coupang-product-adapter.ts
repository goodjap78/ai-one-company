/**
 * Sprint 63-E — Coupang product adapter QA (mock proxy).
 * Run: npm run test:coupang-product-adapter
 */
import http from 'node:http';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import {
  coupangProductAdapter,
  isCoupangProductAdapterReady,
} from '../services/shopping/productAdapter/coupangProductAdapter';
import { getShoppingProductAdapter } from '../services/shopping/productAdapter/getShoppingProductAdapter';
import { fetchShoppingProductsFromProxy } from '../services/shopping/shoppingProxyClient';

let failed = 0;
let mockServer: http.Server | null = null;

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

async function startMockProxy(): Promise<string> {
  const products = [
    {
      id: 'mock-1',
      title: '모크 대파 500g',
      imageUrl: 'https://example.com/onion.jpg',
      price: 4500,
      productUrl: 'https://link.coupang.com/re/AFFSDP?mock=1',
      affiliateUrl: 'https://link.coupang.com/re/AFFSDP?mock=1',
      merchant: 'coupang',
      keyword: '대파',
      isAffiliate: true,
    },
  ];

  mockServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/shopping/coupang/search') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ products }));
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise<void>((resolve) => {
    mockServer!.listen(0, '127.0.0.1', () => resolve());
  });

  const address = mockServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('mock_server_address');
  }

  return `http://127.0.0.1:${address.port}`;
}

async function stopMockProxy(): Promise<void> {
  if (!mockServer) return;
  await new Promise<void>((resolve, reject) => {
    mockServer!.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  mockServer = null;
}

async function main(): Promise<void> {
  console.log('Sprint 63-E Coupang product adapter QA — start\n');

  await run('Production config — provider flag', () => {
    assert(SHOPPING_CONFIG.productProviderEnabled === true, 'provider enabled in config');
    assert(SHOPPING_CONFIG.provider === 'coupang', 'coupang provider');
    const adapter = getShoppingProductAdapter();
    assert(adapter.availability === 'disabled' || adapter.availability === 'available', 'adapter resolved');
  });

  const baseUrl = await startMockProxy();
  const previousBaseUrl = process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL;
  process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL = baseUrl;

  try {
    await run('Proxy client fetch', async () => {
      assert(isCoupangProductAdapterReady(), 'api base configured');
      const products = await fetchShoppingProductsFromProxy('대파', 3);
      assert(products.length === 1, 'one mock product');
      assert(products[0]!.title.includes('대파'), 'title');
      assert(products[0]!.productUrl.includes('link.coupang.com'), 'affiliate productUrl');
    });

    await run('Coupang adapter via mock proxy', async () => {
      const products = await coupangProductAdapter.searchProducts({
        shoppingKeyword: '대파',
        ingredientName: '대파',
        limit: 3,
      });
      assert(products.length === 1, 'adapter returns products');
      if (SHOPPING_CONFIG.affiliateEnabled) {
        assert(Boolean(products[0]!.affiliateUrl), 'affiliate url when enabled');
        assert(products[0]!.isAffiliate === true, 'isAffiliate when enabled');
      } else {
        assert(products[0]!.affiliateUrl === null, 'affiliate stripped when disabled');
      }
    });

    await run('Adapter does not embed secrets', () => {
      const source = coupangProductAdapter.searchProducts.toString();
      assert(!source.includes('SECRET'), 'no secret in adapter fn');
      assert(!source.includes('COUPANG_PARTNERS'), 'no env key names in adapter fn');
    });
  } finally {
    if (previousBaseUrl) {
      process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL = previousBaseUrl;
    } else {
      delete process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL;
    }
    await stopMockProxy();
  }

  console.log('\nSprint 63-E Coupang product adapter QA — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — coupang product adapter');
}

void main();
