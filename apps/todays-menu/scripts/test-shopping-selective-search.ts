/**
 * Shopping V1 selective search — default selection + search trigger QA.
 * Run: npm run test:shopping-selective-search
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { buildPantrySnapshotFromStore } from '../services/pantry/buildPantrySnapshot';
import {
  buildMissingRecipeShoppingList,
  buildRecipeShoppingList,
} from '../services/shopping/buildRecipeShoppingList';
import { buildProductSearchRequests } from '../services/shopping/buildProductSearchRequests';
import {
  applyFetchedProductResults,
  invalidateNonSuccessProductCache,
  planProductSearches,
  productRequestKey,
} from '../services/shopping/productResultCache';
import {
  buildDefaultSelectedKeys,
  defaultIngredientSelected,
  shoppingItemSelectionKey,
} from '../services/shopping/shoppingSelection';
import type { PantryStore } from '../types/pantry';
import type { IngredientProductResult, ProductSearchRequest } from '../types/shoppingProduct';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

function emptyPantry() {
  const now = new Date().toISOString();
  const store: PantryStore = {
    version: 2,
    updatedAt: now,
    extensions: {},
    items: [],
  };
  return buildPantrySnapshotFromStore(store);
}

function initialRequestCount(
  items: ReturnType<typeof buildRecipeShoppingList>['items'],
  mode: 'all' | 'missing',
): number {
  const keys = buildDefaultSelectedKeys(items, mode);
  return buildProductSearchRequests(items, keys).length;
}

function success(request: ProductSearchRequest): IngredientProductResult {
  return {
    request,
    status: 'success',
    products: [
      {
        id: `${request.matchKey}-1`,
        title: request.ingredientName,
        productUrl: 'https://link.coupang.com/p/test',
        affiliateUrl: 'https://link.coupang.com/p/test',
        keyword: request.shoppingKeyword,
        isAffiliate: true,
        merchant: 'coupang',
      },
    ],
  };
}

console.log('Shopping selective search QA — start\n');

run('Scenario 1 — general recipe: main only selected + search requests', () => {
  const list = buildRecipeShoppingList('001');
  const defaults = buildDefaultSelectedKeys(list.items, 'all');
  const mains = list.items.filter((item) => item.group === 'main');
  const subs = list.items.filter((item) => item.group === 'sub');
  const seasonings = list.items.filter((item) => item.group === 'seasoning');

  assert(mains.length > 0, 'recipe has main ingredients');
  assert(subs.length > 0, 'recipe has sub ingredients');
  assert(seasonings.length > 0, 'recipe has seasoning ingredients');

  for (const item of mains) {
    if (!defaultIngredientSelected(item, 'all')) continue;
    assert(defaults.has(shoppingItemSelectionKey(item)), `main selected: ${item.ingredientName}`);
  }
  for (const item of subs) {
    assert(!defaults.has(shoppingItemSelectionKey(item)), `sub deselected: ${item.ingredientName}`);
  }
  for (const item of seasonings) {
    if (defaultIngredientSelected(item, 'all')) continue;
    assert(!defaults.has(shoppingItemSelectionKey(item)), `seasoning deselected: ${item.ingredientName}`);
  }

  const requests = buildProductSearchRequests(list.items, defaults);
  assert(requests.length === defaults.size, 'requests match selection');
  assert(requests.every((r) => mains.some((m) => m.matchKey === r.matchKey)), 'only main searched');
});

run('Scenario 2 — sub ingredient select triggers search', () => {
  const list = buildRecipeShoppingList('001');
  const selected = buildDefaultSelectedKeys(list.items, 'all');
  const sub = list.items.find((item) => item.group === 'sub');
  assert(sub !== undefined, 'sub item exists');

  const before = buildProductSearchRequests(list.items, selected).length;
  selected.add(shoppingItemSelectionKey(sub));
  const after = buildProductSearchRequests(list.items, selected).length;
  assert(after === before + 1, 'one new search request for sub');
});

run('Scenario 3 — seasoning select triggers search', () => {
  const list = buildRecipeShoppingList('001');
  const selected = buildDefaultSelectedKeys(list.items, 'all');
  const seasoning = list.items.find(
    (item) => item.group === 'seasoning' && defaultIngredientSelected(item, 'all') === false,
  );
  assert(seasoning !== undefined, 'non-staple seasoning exists');

  const before = buildProductSearchRequests(list.items, selected).length;
  selected.add(shoppingItemSelectionKey(seasoning));
  const after = buildProductSearchRequests(list.items, selected).length;
  assert(after === before + 1, 'one new search request for seasoning');
});

run('Scenario 4 — deselect hides product (no request)', () => {
  const list = buildRecipeShoppingList('001');
  const selected = buildDefaultSelectedKeys(list.items, 'all');
  const main = list.items.find((item) => item.group === 'main');
  assert(main !== undefined, 'main exists');
  const key = shoppingItemSelectionKey(main);
  assert(selected.has(key), 'main selected initially');

  selected.delete(key);
  const requests = buildProductSearchRequests(list.items, selected);
  assert(!requests.some((r) => r.matchKey === main.matchKey), 'main not in requests');
});

run('Scenario 5 — reselect restores SUCCESS cache without refetch', () => {
  const list = buildRecipeShoppingList('001');
  const main = list.items.find((item) => item.group === 'main');
  assert(main !== undefined, 'main exists');
  const key = shoppingItemSelectionKey(main);
  const selected = new Set<string>();

  selected.add(key);
  const requests = buildProductSearchRequests(list.items, selected);
  assert(requests.length === 1, 'one request');

  const cache = new Map<string, IngredientProductResult>();
  const fetched = [success(requests[0]!)];
  applyFetchedProductResults(requests, cache, fetched);

  selected.delete(key);
  assert(buildProductSearchRequests(list.items, selected).length === 0, 'deselected');

  invalidateNonSuccessProductCache(cache, productRequestKey(requests[0]!));
  selected.add(key);
  const plan = planProductSearches(buildProductSearchRequests(list.items, selected), cache);
  assert(plan.toFetch.length === 0, 'SUCCESS cache reused');
  assert(plan.visible.length === 1, 'product visible again');
});

run('Scenario 6 — fridge missing mode: main/sub auto-selected', () => {
  const pantry = emptyPantry();
  const missing = buildMissingRecipeShoppingList('001', pantry);
  const defaults = buildDefaultSelectedKeys(missing.items, 'missing');

  assert(defaults.size > 0, 'missing defaults non-empty');
  assert(
    missing.items.every((item) => item.group === 'main' || item.group === 'sub'),
    'missing list core only',
  );
  for (const item of missing.items) {
    const expected = defaultIngredientSelected(item, 'missing');
    assert(
      defaults.has(shoppingItemSelectionKey(item)) === expected,
      `missing default for ${item.ingredientName}`,
    );
  }

  const requests = buildProductSearchRequests(missing.items, defaults);
  assert(requests.length === defaults.size, 'missing auto-search core only');
});

run('Performance snapshot — initial request count (recipe 001)', () => {
  const list = buildRecipeShoppingList('001');
  const allMainOnly = initialRequestCount(list.items, 'all');
  const nonStapleCount = list.items.filter((item) => defaultIngredientSelected(item, 'missing')).length;

  console.log(`--- Recipe 001 initial requests ---`);
  console.log(`all mode (main only): ${allMainOnly}`);
  console.log(`missing mode baseline (non-staple): ${nonStapleCount}`);

  assert(allMainOnly < nonStapleCount, 'main-only fewer than full non-staple');
  assert(allMainOnly === list.items.filter((item) => item.group === 'main').length, 'main count match');
});

run('Catalog average — all mode request reduction', () => {
  let totalMainOnly = 0;
  let totalNonStaple = 0;
  for (const recipe of HANKKI_RECIPES) {
    const list = buildRecipeShoppingList(recipe.id);
    totalMainOnly += initialRequestCount(list.items, 'all');
    totalNonStaple += list.items.filter((item) => defaultIngredientSelected(item, 'missing')).length;
  }
  console.log(`--- Catalog totals ---`);
  console.log(`all mode initial requests: ${totalMainOnly}`);
  console.log(`non-staple (old all-mode): ${totalNonStaple}`);
  assert(totalMainOnly < totalNonStaple, 'catalog-wide reduction');
});

run('ShoppingScreen wires mode into buildDefaultSelectedKeys', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../components/shopping/ShoppingScreen.tsx'),
    'utf8',
  );
  assert(src.includes('buildDefaultSelectedKeys(list.items, mode)'), 'mode passed to defaults');
});

console.log('\nShopping selective search QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — shopping selective search');
