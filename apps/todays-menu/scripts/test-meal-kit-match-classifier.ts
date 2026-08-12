/**
 * Meal kit match classifier unit tests (no live API).
 * Run: npx tsx scripts/test-meal-kit-match-classifier.ts
 */
import assert from 'node:assert/strict';
import type { ShoppingProduct } from '../types/shoppingProduct';
import {
  buildMealKitSearchKeywords,
  classifyMealKitMatch,
  inferFoodCategory,
  mergeSearchResults,
} from './mealKitAudit/classifyMealKitMatch';

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

function product(title: string, keyword: string): ShoppingProduct {
  return {
    id: title,
    title,
    productUrl: 'https://example.com/p',
    affiliateUrl: 'https://example.com/a',
    keyword,
    isAffiliate: true,
    price: 9900,
  };
}

console.log('Meal kit classifier — start\n');

run('HIGH — explicit meal kit with recipe name', () => {
  const result = classifyMealKitMatch('부대찌개', '부대찌개 밀키트', [
    product(' CJ 부대찌개 밀키트 2인분', '부대찌개 밀키트'),
  ]);
  assert.equal(result.matchQuality, 'HIGH');
});

run('MEDIUM — ready meal without meal-kit label', () => {
  const result = classifyMealKitMatch('제육볶음', '제육볶음 간편식', [
    product('제육볶음 즉석조리 간편식 300g', '제육볶음 간편식'),
  ]);
  assert.equal(result.matchQuality, 'MEDIUM');
});

run('FALSE POSITIVE — omelette pan excluded', () => {
  const result = classifyMealKitMatch('오믈렛', '오믈렛 밀키트', [
    product('오믈렛팬 인덕션 프라이팬', '오믈렛 밀키트'),
  ]);
  assert.equal(result.matchQuality, 'LOW');
  assert.ok(result.notes.includes('weak_or_unrelated') || result.notes.some((n) => n.includes('filtered')));
});

run('FALSE POSITIVE — egg only excluded', () => {
  const result = classifyMealKitMatch('오믈렛', '오믈렛 간편식', [
    product('유기농 계란 30구', '오믈렛 간편식'),
  ]);
  assert.notEqual(result.matchQuality, 'HIGH');
});

run('buildMealKitSearchKeywords order', () => {
  const keys = buildMealKitSearchKeywords('밀푀유나베');
  assert.deepEqual(keys.slice(0, 2), ['밀푀유나베 밀키트', '밀푀유나베 간편식']);
});

run('inferFoodCategory — stew', () => {
  assert.equal(inferFoodCategory('김치찌개', ['한식']), '찌개/전골/국');
});

run('mergeSearchResults prefers HIGH from first keyword', () => {
  const merged = mergeSearchResults('부대찌개', [
    {
      keyword: '부대찌개 밀키트',
      products: [product('부대찌개 밀키트', '부대찌개 밀키트')],
    },
    {
      keyword: '부대찌개 간편식',
      products: [product('unrelated pan', '부대찌개 간편식')],
    },
  ]);
  assert.equal(merged.matchQuality, 'HIGH');
});

console.log(`\nMeal kit classifier — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
