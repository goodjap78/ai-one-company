/**
 * Sprint 66-B — Meal Kit CTA layout + validated eligibility.
 * Run: npx tsx scripts/test-meal-kit-final-pilot.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isMealKitFeatureEnabled } from '../constants/featureFlags';
import { MEAL_KIT_HIGH_COUNT } from '../data/shopping/mealKitHighEligibility';
import {
  MEAL_KIT_RUNTIME_FAIL_RECIPE_IDS,
  MEAL_KIT_VALIDATED_COUNT,
  MEAL_KIT_VALIDATED_ELIGIBILITY,
} from '../data/shopping/mealKitValidatedEligibility';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import {
  explainMealKitProduct,
  isAcceptableMealKitProduct,
  MEAL_KIT_MAX_PRODUCTS,
} from '../services/shopping/mealKit/filterMealKitProducts';
import {
  isAuditHighCandidate,
  isMealKitEligible,
} from '../services/shopping/mealKit/mealKitEligibility';

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

console.log('Sprint 66-B meal kit final pilot — start\n');

run('Scenario 1 — validated eligible data kept; UI gated by feature flag', () => {
  assert.equal(isMealKitEligible('001'), true);
  assert.equal(isMealKitEligible('024'), true);
  assert.equal(isMealKitFeatureEnabled(), false);
  const cta = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert.ok(cta.includes('showMealKit'));
  assert.ok(cta.includes('isMealKitFeatureEnabled()'));
  assert.ok(cta.includes('styles.half'));
  assert.ok(cta.includes('prepChoiceShoppingTitle'));
  assert.ok(cta.includes('prepChoiceMealKitTitle'));
});

run('Release hide — meal-kit CTAs require central feature flag', () => {
  assert.equal(isMealKitFeatureEnabled(), false);
  const flags = read('constants/featureFlags.ts');
  assert.ok(flags.includes('mealKitEnabled: false'));
  const prep = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert.ok(prep.includes('isMealKitFeatureEnabled() && isMealKitEligible'));
  const fridgeCta = read('components/shopping/MealKitShoppingCta.tsx');
  assert.ok(fridgeCta.includes('!isMealKitFeatureEnabled()'));
  const panel = read('components/shopping/MealKitShoppingPanel.tsx');
  assert.ok(panel.includes('mealKitFeatureUnavailable'));
  assert.ok(panel.includes('Boolean(featureEnabled && eligibility)'));
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert.ok(ingredients.includes('RecipePrepChoiceCta'));
  assert.ok(ingredients.includes('필요한 재료') || read('constants/shoppingCopy.ts').includes('필요한 재료 장보기'));
});

run('Scenario 2 — Audit HIGH runtime FAIL → no meal-kit CTA', () => {
  assert.ok(MEAL_KIT_RUNTIME_FAIL_RECIPE_IDS.includes('028'));
  assert.equal(isAuditHighCandidate('028'), true);
  assert.equal(isMealKitEligible('028'), false);
});

run('Scenario 3 — MEDIUM not eligible', () => {
  assert.equal(isMealKitEligible('005'), false);
});

run('Scenario 4 — NONE not eligible', () => {
  assert.equal(isMealKitEligible('059'), false);
});

run('Scenario 5 — meal-kit mode still max 3 after wider fetch', () => {
  assert.equal(MEAL_KIT_MAX_PRODUCTS, 3);
  assert.equal(SHOPPING_CONFIG.maxProductsPerIngredient, 3);
  assert.ok(SHOPPING_CONFIG.maxMealKitSearchResults > 3);
  const hook = read('hooks/useMealKitProductSearch.ts');
  assert.ok(hook.includes('maxMealKitSearchResults'));
  assert.ok(hook.includes('filterMealKitProducts'));
});

run('Scenario 6 — Fridge validated recipe keeps missing primary', () => {
  const bridge = read('components/fridge/FridgeShoppingBridge.tsx');
  assert.ok(bridge.includes('MealKitShoppingCta'));
  assert.ok(bridge.includes('variant="secondary"'));
  assert.ok(bridge.includes('missingIngredientsCta'));
  assert.ok(bridge.includes('ds.colors.primary'));
});

run('Scenario 7 — ingredient shopping still main-only defaults', () => {
  const selection = read('services/shopping/shoppingSelection.ts');
  assert.ok(selection.includes("return item.group === 'main'"));
  assert.ok(selection.includes("mode === 'missing'"));
});

run('Scenario 8 — 360/390/430 responsive 2-card (flex + wrap + no stretch placeholder)', () => {
  const cta = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert.ok(cta.includes('flex: 1'));
  assert.ok(cta.includes('minWidth: 0'));
  assert.ok(cta.includes('numberOfLines={2}'));
  assert.ok(cta.includes('alignItems: \'stretch\''));
  assert.ok(!cta.includes('placeholder'));
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  const metaIdx = ingredients.indexOf('<RecipeInfoMeta');
  const ctaIdx = ingredients.indexOf('<RecipePrepChoiceCta');
  const listIdx = ingredients.indexOf('<RecipeIngredientsList');
  assert.ok(metaIdx >= 0 && ctaIdx > metaIdx && listIdx > ctaIdx);
});

run('Validated allowlist has no product payload', () => {
  assert.equal(MEAL_KIT_HIGH_COUNT, 24);
  assert.equal(MEAL_KIT_VALIDATED_COUNT, 27);
  assert.equal(MEAL_KIT_VALIDATED_ELIGIBILITY.length, 27);
  assert.equal(isMealKitEligible('recipe_0301'), true);
  assert.equal(isMealKitEligible('recipe_0302'), true);
  assert.equal(isMealKitEligible('recipe_0303'), true);
  assert.equal(isMealKitEligible('recipe_0304'), true);
  assert.equal(isMealKitEligible('024'), true);
  const src = read('data/shopping/mealKitValidatedEligibility.ts');
  assert.ok(!src.includes('productTitle'));
  assert.ok(!src.includes('affiliateUrl'));
  assert.ok(!src.includes('price:'));
});

run('Jeyuk audit title still accepted; pan rejected', () => {
  assert.equal(
    isAcceptableMealKitProduct(
      '제육볶음',
      '제육볶음 밀키트',
      '삼삼 고추장 불고기 제육볶음 두루치기 반찬 밀키트',
    ),
    true,
  );
  assert.equal(
    explainMealKitProduct(
      '제육볶음',
      '제육볶음 밀키트',
      '[로켓프레시] 하이포크 한돈 고추장 제육볶음, 2개, 700g',
    ).reason,
    'missing_meal_kit_or_ready_term',
  );
  assert.equal(
    isAcceptableMealKitProduct('오믈렛', '오믈렛 밀키트', '오믈렛팬 인덕션 프라이팬'),
    false,
  );
});

console.log(`\nSprint 66-B meal kit final pilot — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
