/**
 * Analytics V1 — shopping stub → central wrapper bridge.
 * Run: npm run test:analytics-shopping-bridge
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initAnalytics,
  resetAnalyticsContextForTests,
  resetAnalyticsForTests,
  setAnalyticsTestListener,
  setShoppingAnalyticsContext,
} from '../services/analytics';
import {
  setShoppingAnalyticsListener,
  trackShoppingEvent,
} from '../services/shopping/shoppingAnalytics';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI Analytics V1 shopping bridge QA — start\n');

run('product click is forwarded without keyword/title/productId', () => {
  resetAnalyticsForTests();
  resetAnalyticsContextForTests();
  const forwarded: Array<{ name: string; params: Record<string, string | number> }> = [];
  setAnalyticsTestListener((name, params) => {
    forwarded.push({ name, params });
  });
  initAnalytics();
  setShoppingAnalyticsContext('001', 'all');

  trackShoppingEvent('shopping_product_click', {
    productId: 'secret-product',
    keyword: '김치찌개 밀키트',
    merchant: 'coupang',
    isAffiliate: true,
  });

  assert(forwarded.length === 1, 'one firebase event');
  assert(forwarded[0]?.name === 'shopping_product_click', 'click name');
  assert(forwarded[0]?.params.recipe_id === '001', 'recipe_id from context');
  assert(forwarded[0]?.params.mode === 'all', 'mode from context');
  assert(forwarded[0]?.params.merchant === 'coupang', 'merchant kept');
  assert(forwarded[0]?.params.is_affiliate === 'true', 'affiliate kept');
  assert(forwarded[0]?.params.keyword === undefined, 'keyword dropped');
  assert(forwarded[0]?.params.productId === undefined, 'productId dropped');
  assert(forwarded[0]?.params.title === undefined, 'title dropped');
  resetAnalyticsForTests();
  resetAnalyticsContextForTests();
});

run('impression and ingredient search stay local-only', () => {
  resetAnalyticsForTests();
  const forwarded: string[] = [];
  setAnalyticsTestListener((name) => {
    forwarded.push(name);
  });
  initAnalytics();
  trackShoppingEvent('shopping_product_impression', { keyword: '양파' });
  trackShoppingEvent('shopping_ingredient_search', { keyword: '돼지고기', matchKey: 'pork' });
  assert(forwarded.length === 0, 'no firebase events for impression/search');
  resetAnalyticsForTests();
});

run('existing test listener still receives shopping events', () => {
  resetAnalyticsForTests();
  const local: string[] = [];
  setShoppingAnalyticsListener((name) => {
    local.push(name);
  });
  initAnalytics();
  trackShoppingEvent('shopping_product_click', { merchant: 'coupang', isAffiliate: false });
  assert(local.includes('shopping_product_click'), 'test listener preserved');
  resetAnalyticsForTests();
});

run('openShoppingProduct still uses shopping analytics stub', () => {
  const src = read('services/shopping/openShoppingProduct.ts');
  assert(src.includes("trackShoppingEvent('shopping_product_click'"), 'click still tracked');
  assert(src.includes('resolveOutboundProductUrl'), 'affiliate resolve unchanged');
  assert(!src.includes('@react-native-firebase'), 'no direct firebase in outbound');
  assert(!src.includes('console.log(url)'), 'still no raw url logs');
});

run('meal-kit panel still opens via openShoppingProduct', () => {
  const panel = read('components/shopping/MealKitShoppingPanel.tsx');
  assert(panel.includes('openShoppingProduct'), 'meal-kit uses same outbound');
  const screen = read('components/shopping/ShoppingScreen.tsx');
  assert(screen.includes('trackShoppingScreenView'), 'screen view tracked');
  assert(screen.includes('setShoppingAnalyticsContext'), 'context set for product click');
});

run('CTA files keep existing routes', () => {
  const prep = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert(prep.includes('trackShoppingCtaClick'), 'shopping CTA tracked');
  assert(prep.includes('trackMealKitCtaClick'), 'meal-kit CTA tracked');
  assert(prep.includes('`/shopping/${recipeId}`'), 'shopping route unchanged');
  assert(prep.includes('mode=meal-kit'), 'meal-kit route unchanged');
});

resetAnalyticsForTests();
resetAnalyticsContextForTests();
setShoppingAnalyticsListener(null);

console.log('\nHANKKI Analytics V1 shopping bridge QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS — analytics shopping bridge');
