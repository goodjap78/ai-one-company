/**
 * Shopping reselect / product result cache QA.
 * Run: npx tsx scripts/test-shopping-reselect.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type {
  IngredientProductResult,
  ProductSearchRequest,
  ShoppingProduct,
} from '../types/shoppingProduct';
import {
  applyFetchedProductResults,
  invalidateNonSuccessProductCache,
  planProductSearches,
  productRequestKey,
  shouldReuseProductResult,
} from '../services/shopping/productResultCache';

const APP_ROOT = path.resolve(__dirname, '..');
let failed = 0;

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function req(id: string): ProductSearchRequest {
  return {
    ingredientName: id,
    shoppingKeyword: id,
    matchKey: id,
  };
}

function product(id: string, keyword: string): ShoppingProduct {
  return {
    id,
    title: id,
    productUrl: `https://link.coupang.com/p/${id}`,
    affiliateUrl: `https://link.coupang.com/p/${id}`,
    keyword,
    isAffiliate: true,
    merchant: 'coupang',
  };
}

function success(request: ProductSearchRequest): IngredientProductResult {
  return {
    request,
    status: 'success',
    products: [product(`${request.matchKey}-1`, request.shoppingKeyword)],
  };
}

function empty(request: ProductSearchRequest): IngredientProductResult {
  return { request, status: 'empty', products: [] };
}

function errorResult(request: ProductSearchRequest): IngredientProductResult {
  return { request, status: 'error', products: [], errorMessage: 'fail' };
}

console.log('Shopping reselect QA — start\n');

run('Scenario 1 — SUCCESS cache reused on reselect', () => {
  const a = req('onion');
  const cache = new Map<string, IngredientProductResult>();
  cache.set(productRequestKey(a), success(a));

  // deselect → no requests
  let plan = planProductSearches([], cache);
  assert.equal(plan.toFetch.length, 0);
  assert.equal(plan.visible.length, 0);
  assert.ok(shouldReuseProductResult(cache.get(productRequestKey(a))));

  // reselect → reuse SUCCESS, no fetch
  plan = planProductSearches([a], cache);
  assert.equal(plan.toFetch.length, 0);
  assert.equal(plan.visible.length, 1);
  assert.equal(plan.visible[0]?.status, 'success');
  assert.ok((plan.visible[0]?.products.length ?? 0) > 0);
});

run('Scenario 2 — EMPTY then reselect retries', () => {
  const a = req('rare_spice');
  const cache = new Map<string, IngredientProductResult>();
  cache.set(productRequestKey(a), empty(a));

  assert.equal(shouldReuseProductResult(cache.get(productRequestKey(a))), false);

  invalidateNonSuccessProductCache(cache, productRequestKey(a));
  assert.equal(cache.has(productRequestKey(a)), false);

  const plan = planProductSearches([a], cache);
  assert.equal(plan.toFetch.length, 1);
  assert.equal(plan.visible[0]?.status, 'loading');

  const fetched = success(a);
  const next = applyFetchedProductResults([a], cache, [fetched]);
  assert.equal(next[0]?.status, 'success');
});

run('Scenario 2b — ERROR then reselect retries', () => {
  const a = req('garlic');
  const cache = new Map<string, IngredientProductResult>();
  cache.set(productRequestKey(a), errorResult(a));
  invalidateNonSuccessProductCache(cache, productRequestKey(a));
  const plan = planProductSearches([a], cache);
  assert.equal(plan.toFetch.length, 1);
});

run('Scenario 3 — A deselect/reselect keeps B SUCCESS', () => {
  const a = req('pork');
  const b = req('onion');
  const cache = new Map<string, IngredientProductResult>();
  cache.set(productRequestKey(a), success(a));
  cache.set(productRequestKey(b), success(b));

  // deselect A — only B selected
  let plan = planProductSearches([b], cache);
  assert.equal(plan.toFetch.length, 0);
  assert.equal(plan.visible.length, 1);
  assert.equal(plan.visible[0]?.request.matchKey, 'onion');

  // B cache untouched
  assert.equal(cache.get(productRequestKey(b))?.status, 'success');

  // reselect A — A from cache, B from cache, no fetch
  plan = planProductSearches([a, b], cache);
  assert.equal(plan.toFetch.length, 0);
  assert.equal(plan.visible.length, 2);
  assert.ok(plan.visible.every((r) => r.status === 'success'));
});

run('Scenario 3b — new select fetches only missing, keeps others', () => {
  const a = req('pork');
  const b = req('onion');
  const cache = new Map<string, IngredientProductResult>();
  cache.set(productRequestKey(b), success(b));

  const plan = planProductSearches([a, b], cache);
  assert.equal(plan.toFetch.length, 1);
  assert.equal(plan.toFetch[0]?.matchKey, 'pork');
  assert.equal(plan.visible.find((r) => r.request.matchKey === 'onion')?.status, 'success');
  assert.equal(plan.visible.find((r) => r.request.matchKey === 'pork')?.status, 'loading');
});

run('Scenario 4 — reused SUCCESS product keeps affiliate outbound fields', () => {
  const a = req('egg');
  const cached = success(a);
  const p = cached.products[0]!;
  assert.ok(p.affiliateUrl?.includes('coupang'));
  assert.equal(p.isAffiliate, true);

  const plan = planProductSearches([a], new Map([[productRequestKey(a), cached]]));
  const shown = plan.visible[0]?.products[0];
  assert.equal(shown?.affiliateUrl, p.affiliateUrl);
  assert.equal(shown?.isAffiliate, true);
});

run('Hook wiring — uses productResultCache helpers', () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, 'hooks/useShoppingProductResults.ts'),
    'utf8',
  );
  assert.ok(src.includes('planProductSearches'));
  assert.ok(src.includes('invalidateNonSuccessProductCache'));
  assert.ok(src.includes('applyFetchedProductResults'));
  assert.ok(src.includes('selectionSig'));
});

run('openShoppingProduct outbound path unchanged', () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, 'services/shopping/openShoppingProduct.ts'),
    'utf8',
  );
  assert.ok(src.includes('isHttpOrHttpsUrl'));
  assert.ok(src.includes('Linking.openURL'));
});

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — shopping reselect');
