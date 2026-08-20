/**
 * Sprint 66-A — Meal Kit Limited Pilot (HIGH only).
 * Run: npx tsx scripts/test-meal-kit-limited-pilot.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MEAL_KIT_HIGH_COUNT, MEAL_KIT_HIGH_ELIGIBILITY } from '../data/shopping/mealKitHighEligibility';
import { parseShoppingListMode } from '../constants/shoppingConfig';
import { SHOPPING_COPY } from '../constants/shoppingCopy';
import {
  filterMealKitProducts,
  isAcceptableMealKitProduct,
  MEAL_KIT_MAX_PRODUCTS,
} from '../services/shopping/mealKit/filterMealKitProducts';
import {
  getMealKitEligibility,
  getMealKitSearchKeyword,
  isMealKitEligible,
  listMealKitHighRecipeIds,
} from '../services/shopping/mealKit/mealKitEligibility';
import type { ShoppingProduct } from '../types/shoppingProduct';

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

function read(rel: string): string {
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

function product(title: string): ShoppingProduct {
  return {
    id: title,
    title,
    productUrl: 'https://example.com/p',
    affiliateUrl: 'https://example.com/a',
    keyword: 'test',
    isAffiliate: true,
    price: 10000,
  };
}

console.log('Sprint 66-A meal kit limited pilot — start\n');

run('Scenario A — HIGH recipe eligible', () => {
  assert.equal(isMealKitEligible('024'), true);
  assert.equal(getMealKitSearchKeyword('024'), '부대찌개 밀키트');
  assert.equal(getMealKitEligibility('024')?.recipeName, '부대찌개');
});

run('Scenario B — MEDIUM recipe not eligible (김치찌개 is HIGH; 비빔밥 was MEDIUM)', () => {
  assert.equal(isMealKitEligible('005'), false);
  assert.equal(getMealKitEligibility('005'), null);
});

run('Scenario C — LOW/NONE not eligible', () => {
  assert.equal(isMealKitEligible('059'), false);
  assert.equal(isMealKitEligible('041'), false);
  assert.equal(isMealKitEligible('unknown'), false);
});

run('HIGH count is 24 only', () => {
  assert.equal(MEAL_KIT_HIGH_COUNT, 24);
  assert.equal(MEAL_KIT_HIGH_ELIGIBILITY.length, 24);
  assert.equal(listMealKitHighRecipeIds().length, 24);
  for (const entry of MEAL_KIT_HIGH_ELIGIBILITY) {
    assert.equal(entry.quality, 'HIGH');
    assert.ok(entry.searchKeyword.trim().length > 0);
    assert.ok(!('price' in entry));
    assert.ok(!('productUrl' in entry));
  }
});

run('Eligibility has no product price/URL static data', () => {
  const src = read('data/shopping/mealKitHighEligibility.ts');
  assert.ok(!src.includes('productTitle'));
  assert.ok(!src.includes('affiliateUrl'));
  assert.ok(!src.includes('price:'));
});

run('Scenario D — mode meal-kit parse + ShoppingScreen branch', () => {
  assert.equal(parseShoppingListMode('meal-kit'), 'meal-kit');
  assert.equal(parseShoppingListMode('mealKit'), 'meal-kit');
  const screen = read('components/shopping/ShoppingScreen.tsx');
  assert.ok(screen.includes("mode === 'meal-kit'"));
  assert.ok(screen.includes('MealKitShoppingPanel'));
  const panel = read('components/shopping/MealKitShoppingPanel.tsx');
  assert.ok(panel.includes('useMealKitProductSearch'));
  assert.ok(panel.includes('ShoppingProductCard'));
  assert.ok(panel.includes('openShoppingProduct'));
  assert.ok(panel.includes('MEAL_KIT') || panel.includes('mealKitEmpty') || panel.includes('SHOPPING_COPY.mealKitEmpty'));
});

run('Scenario E — empty copy present', () => {
  assert.ok(SHOPPING_COPY.mealKitEmpty.includes('밀키트'));
});

run('Scenario F — affiliate outbound reused (no new link builder)', () => {
  const panel = read('components/shopping/MealKitShoppingPanel.tsx');
  assert.ok(panel.includes('openShoppingProduct'));
  assert.ok(!panel.includes('buildAffiliate'));
  assert.ok(panel.includes('affiliateDisclosureText') || panel.includes('disclosureText'));
});

run('Scenario G — Fridge secondary CTA after missing primary', () => {
  const bridge = read('components/fridge/FridgeShoppingBridge.tsx');
  assert.ok(bridge.includes('MealKitShoppingCta'));
  assert.ok(bridge.includes('variant="secondary"'));
  assert.ok(bridge.includes('missingIngredientsCta'));
  assert.ok(bridge.includes('ds.colors.primary'));
  const cta = read('components/shopping/MealKitShoppingCta.tsx');
  assert.ok(cta.includes('secondaryButton'));
  assert.ok(cta.includes("variant === 'secondary'"));
  // Meal kit CTA never uses solid primary fill (missing CTA remains primary).
  assert.ok(cta.includes('ds.colors.secondaryButton'));
  assert.ok(!cta.includes('backgroundColor: ds.colors.primary'));
});

run('Scenario H — Ingredients 2-card prep choice above ingredients', () => {
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert.ok(ingredients.includes('RecipePrepChoiceCta'));
  assert.ok(!ingredients.includes('IngredientsShoppingCta'));
  assert.ok(!ingredients.includes('MealKitShoppingCta'));
  const prepIdx = ingredients.indexOf('<RecipePrepChoiceCta');
  const listIdx = ingredients.indexOf('<RecipeIngredientsList');
  assert.ok(prepIdx > 0 && listIdx > prepIdx);
  const cta = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert.ok(cta.includes('isMealKitEligible'));
  assert.ok(cta.includes('mode=meal-kit'));
});

run('Runtime match guard — meal kit ok, pan rejected', () => {
  assert.equal(
    isAcceptableMealKitProduct('부대찌개', '부대찌개 밀키트', '의정부식 부대찌개 밀키트 1kg'),
    true,
  );
  assert.equal(
    isAcceptableMealKitProduct('오믈렛', '오믈렛 밀키트', '오믈렛팬 인덕션 프라이팬'),
    false,
  );
  const filtered = filterMealKitProducts('김치찌개', '김치찌개 밀키트', [
    product('소온 돼지김치찌개 밀키트'),
    product('김치찌개 소스만'),
    product('프라이팬'),
    product('MYCHEF 김치찌개 밀키트 2인분'),
    product('또 다른 김치찌개 밀키트'),
    product('네 번째 김치찌개 밀키트'),
  ]);
  assert.ok(filtered.length <= MEAL_KIT_MAX_PRODUCTS);
  assert.equal(filtered.length, 3);
  assert.ok(filtered.every((p) => p.title.includes('밀키트')));
});

run('Hook searches single keyword only', () => {
  const hook = read('hooks/useMealKitProductSearch.ts');
  assert.ok(hook.includes('searchProducts'));
  assert.ok(hook.includes('filterMealKitProducts'));
  assert.ok(hook.includes('shoppingKeyword: searchKeyword'));
});

console.log(`\nSprint 66-A meal kit limited pilot — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
