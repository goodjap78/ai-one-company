/**
 * Sprint 64 — App client → Production Shopping Proxy E2E (no device UI).
 * Uses the same client path as the app: shoppingProxyClient / coupang adapter.
 * Never prints secrets or full affiliate URLs.
 */
import { getShoppingApiBaseUrl } from '../services/shopping/shoppingApiConfig';
import { fetchShoppingProductsFromProxy } from '../services/shopping/shoppingProxyClient';
import { getShoppingProductAdapter } from '../services/shopping/productAdapter';
import { resolveOutboundProductUrl } from '../services/shopping/resolveOutboundProductUrl';
import { searchProductsForRequests } from '../services/shopping/searchProductsForRequests';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import fs from 'node:fs';
import path from 'node:path';

const PROD = 'https://hankki-shopping-proxy.vercel.app';
process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL = PROD;

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
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  console.log('Sprint 64 app→production shopping E2E — start\n');
  console.log('EXPO_PUBLIC_SHOPPING_API_BASE_URL: SET (production proxy for this run)\n');

  await run('App base URL points to production proxy', () => {
    const base = getShoppingApiBaseUrl();
    assert(base === PROD, 'base URL is production proxy');
  });

  await run('Client path search — 대파', async () => {
    const products = await fetchShoppingProductsFromProxy('대파', 3);
    assert(products.length > 0, 'products > 0');
    const p = products[0]!;
    assert(Boolean(p.title?.trim()), 'title');
    assert(typeof p.price === 'number' && p.price > 0, 'price');
    assert(Boolean(p.imageUrl?.trim()), 'imageUrl');
    const outbound = resolveOutboundProductUrl(p);
    assert(Boolean(outbound && outbound.includes('coupang')), 'affiliate/outbound coupang');
    assert(Boolean(p.affiliateUrl?.includes('coupang')), 'affiliateUrl present');
  });

  await run('Adapter path — getShoppingProductAdapter', async () => {
    const adapter = getShoppingProductAdapter();
    assert(adapter.availability === 'available', 'adapter available');
    const products = await adapter.searchProducts({
      shoppingKeyword: '계란',
      ingredientName: '계란',
      limit: 3,
    });
    assert(products.length > 0, 'adapter products');
    assert(Boolean(products[0]!.imageUrl), 'image');
    assert(typeof products[0]!.price === 'number', 'price');
  });

  await run('Batch searchProductsForRequests — controlled error status', async () => {
    assert(SHOPPING_CONFIG.productProviderEnabled, 'provider enabled');
    const results = await searchProductsForRequests([
      {
        selectionKey: 'test:고추장',
        matchKey: 'gochujang',
        ingredientName: '고추장',
        shoppingKeyword: '고추장',
      },
    ]);
    assert(results.length === 1, 'one result');
    assert(results[0]!.status === 'success', 'success status');
    assert(results[0]!.products.length > 0, 'products');
  });

  await run('Error handling — invalid keyword yields controlled status', async () => {
    const results = await searchProductsForRequests([
      {
        selectionKey: 'test:empty',
        matchKey: 'x',
        ingredientName: 'x',
        shoppingKeyword: '   ',
      },
    ]);
    // empty keyword should error from proxy (400) → status error, not throw
    assert(results[0]!.status === 'error' || results[0]!.status === 'empty', 'no crash');
    assert(Array.isArray(results[0]!.products), 'products array');
  });

  await run('Secret exposure — client shopping paths', () => {
    const roots = [
      'services/shopping',
      'hooks',
      'components/shopping',
      'constants/shoppingConfig.ts',
    ];
    const forbidden = [
      'COUPANG_PARTNERS_SECRET_KEY',
      'COUPANG_PARTNERS_ACCESS_KEY',
      'buildCoupangAuthorization',
      'api-gateway.coupang.com',
    ];
    const appRoot = path.resolve(__dirname, '..');

    function walk(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      const st = fs.statSync(dir);
      if (st.isFile()) return [dir];
      const out: string[] = [];
      for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules') continue;
        out.push(...walk(path.join(dir, name)));
      }
      return out;
    }

    for (const root of roots) {
      const full = path.join(appRoot, root);
      for (const file of walk(full)) {
        if (!/\.(ts|tsx)$/.test(file)) continue;
        if (file.includes(`${path.sep}server${path.sep}`)) continue;
        const text = fs.readFileSync(file, 'utf8');
        for (const token of forbidden) {
          assert(!text.includes(token), `${token} not in ${path.relative(appRoot, file)}`);
        }
      }
    }
  });

  console.log('\nSprint 64 app→production shopping E2E — done');
  if (failed > 0) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log('\nPASS — app production shopping E2E');
}

void main();
