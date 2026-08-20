/**
 * Offline helpers for final meal-kit audit (no live API).
 * Run: npx tsx scripts/test-meal-kit-final-audit-helpers.ts
 */
import assert from 'node:assert/strict';
import { findCatalogDuplicate } from './mealKitAudit/catalogNameMatch';
import { extractDishNameFromTitle } from './mealKitAudit/extractDishFromTitle';

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

const catalog = [
  { recipeId: '003', recipeName: '김치찌개' },
  { recipeId: '024', recipeName: '부대찌개' },
  { recipeId: '012', recipeName: '닭볶음탕' },
  { recipeId: '047', recipeName: '순대국' },
];

console.log('Meal kit final audit helpers — start\n');

run('extract dish from live-style title', () => {
  const stew = extractDishNameFromTitle('소온 돼지김치찌개 밀키트 5분요리, 4개, 650g');
  assert.ok(stew && stew.includes('김치찌개'));
  const hotpot = extractDishNameFromTitle('프레시지 서울식 불고기 전골 밀키트 2인분');
  assert.ok(hotpot && hotpot.includes('전골'));
});

run('duplicate: 돼지고기 김치찌개 ≈ 김치찌개', () => {
  const hit = findCatalogDuplicate('돼지고기 김치찌개', catalog);
  assert.equal(hit.status, 'POSSIBLE_DUPLICATE');
  assert.equal(hit.matchedRecipeId, '003');
});

run('duplicate: 닭도리탕 ≈ 닭볶음탕', () => {
  const hit = findCatalogDuplicate('닭도리탕', catalog);
  assert.equal(hit.status, 'POSSIBLE_DUPLICATE');
});

run('new menu is not duplicate', () => {
  const hit = findCatalogDuplicate('밀푀유나베', catalog);
  assert.equal(hit.status, 'NEW');
});

console.log(`\nMeal kit final audit helpers — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
