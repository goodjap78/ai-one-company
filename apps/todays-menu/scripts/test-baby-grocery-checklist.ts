/**
 * HANKKI v1.1 — baby grocery checklist QA.
 * Run: npm run test:baby-grocery-checklist
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { babyBatchCookingCopy } from '../constants/babyBatchCookingCopy';
import { BABY_GROCERY_CHECKLIST_STORAGE_KEY } from '../services/babyFood/babyGroceryChecklistStorage';
import {
  buildBabyGroceryShareText,
  computeBabyBatchAggregationFingerprint,
  reconcileCheckedRowIds,
} from '../services/babyFood/babyGroceryChecklist';
import {
  buildBabyBatchGroceryList,
  type BabyBatchGroceryItem,
} from '../services/babyFood/buildBabyBatchGroceryList';
import { generateBabyWeeklyPlan } from '../data/recipes/babyWeeklyPlan';
import {
  classifyBabyPortionScaling,
  listBabyPortionScalingSummary,
  scaleBabyIngredientAmount,
} from '../data/recipes/babyPortionScaling';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { mergeGroceryIngredients } from '../services/grocery/mergeGroceryIngredients';
import { formatBabyBatchDisplayLine } from '../services/babyFood/formatBabyBatchAmount';
import type { GroceryIngredientLine } from '../types/grocery';

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

function buildSampleResult(stage: 'early' | 'middle' = 'middle') {
  const plan = generateBabyWeeklyPlan(stage, 42);
  assert(plan.ok, 'weekly plan');
  if (!plan.ok) throw new Error('plan failed');
  const selections = plan.plan.slots.slice(0, 5).map((slot) => ({
    recipeId: slot.recipeId,
    portion: 1 as const,
  }));
  const menus = plan.plan.slots.slice(0, 5).map((slot) => ({
    recipeId: slot.recipeId,
    name: slot.recipeName,
    dayLabel: '월',
    portion: 1 as const,
  }));
  return buildBabyBatchGroceryList(selections, menus, stage);
}

console.log('HANKKI v1.1 baby grocery checklist QA — start\n');

run('A — 5 rows toggle progress 1/5', () => {
  const result = buildSampleResult();
  assert(result.items.length >= 5, `>= 5 rows (got ${result.items.length})`);
  const rowKeys = result.items.map((item) => item.rowKey);
  const checked = reconcileCheckedRowIds([rowKeys[0]!], rowKeys, result.fingerprint, result.fingerprint);
  assert(checked.size === 1, '1 checked');
  assert((1 / result.items.length) > 0, 'progress computable');
});

run('B — same ingredient different unit → separate row keys', () => {
  const lines: GroceryIngredientLine[] = [
    { name: '우유', amount: '100ml', recipeId: 'a' },
    { name: '우유', amount: '2큰술', recipeId: 'b' },
  ];
  const merged = mergeGroceryIngredients(lines);
  assert(merged.length === 2, 'two rows');
  const bucketKeys = merged.map((item) => `${item.normalizedName}::${item.unit}`);
  assert(bucketKeys[0] !== bucketKeys[1], 'distinct normalizedName::unit buckets');
  const result = buildSampleResult();
  const unitsByName = new Map<string, Set<string>>();
  for (const item of result.items) {
    const units = unitsByName.get(item.name) ?? new Set<string>();
    units.add(item.unit);
    unitsByName.set(item.name, units);
  }
  for (const [name, units] of unitsByName) {
    if (units.size > 1) {
      const rows = result.items.filter((item) => item.name === name);
      assert(rows.every((row, _, arr) => arr[0]!.rowKey !== row.rowKey || arr.length === 1), `${name} multi-unit rows distinct`);
      const keys = new Set(rows.map((row) => row.rowKey));
      assert(keys.size === rows.length, `${name} unique row keys per unit`);
    }
  }
});

run('C — all checked → n/n', () => {
  const result = buildSampleResult();
  const rowKeys = result.items.map((item) => item.rowKey);
  const checked = reconcileCheckedRowIds(rowKeys, rowKeys, result.fingerprint, result.fingerprint);
  assert(checked.size === rowKeys.length, 'all checked');
});

run('D — reset → 0/n', () => {
  const result = buildSampleResult();
  const rowKeys = result.items.map((item) => item.rowKey);
  const cleared = reconcileCheckedRowIds([], rowKeys, result.fingerprint, result.fingerprint);
  assert(cleared.size === 0, 'reset to 0');
});

run('E — fingerprint change clears stale checks', () => {
  const result = buildSampleResult();
  const rowKeys = result.items.map((item) => item.rowKey);
  const stale = reconcileCheckedRowIds(rowKeys, rowKeys, result.fingerprint, 'other-fingerprint');
  assert(stale.size === 0, 'stale checks removed');
});

run('F — zero ingredient result does not crash helpers', () => {
  const result = buildBabyBatchGroceryList([], [], 'early');
  assert(result.items.length === 0, '0 items');
  assert(result.groups.length === 0, '0 groups');
  assert(typeof result.fingerprint === 'string', 'fingerprint present');
  const share = buildBabyGroceryShareText(result);
  assert(share.includes('이번 주 이유식 준비 재료'), 'share text ok');
});

run('G — review_required stays 1 portion in aggregation', () => {
  const summary = listBabyPortionScalingSummary(HANKKI_RECIPES);
  const review = summary.reviewRequired[0];
  assert(Boolean(review), 'review recipe');
  if (!review) return;
  const scaling = classifyBabyPortionScaling(review);
  const sampleIng = review.ingredients.find((ing) => /g|ml|작은술|큰술/.test(ing.amount));
  if (sampleIng) {
    const scaled = scaleBabyIngredientAmount(sampleIng.amount, 6, scaling);
    assert(scaled === sampleIng.amount, 'review_required unchanged at 6');
  }
});

run('H — fraction row display preserved', () => {
  const lines: GroceryIngredientLine[] = [
    { name: '소금', amount: '1/4작은술', recipeId: 'a' },
    { name: '소금', amount: '1/4작은술', recipeId: 'b' },
  ];
  const merged = mergeGroceryIngredients(lines);
  const display = formatBabyBatchDisplayLine(merged[0]!.name, merged[0]!.quantity, merged[0]!.unit);
  assert(display.includes('1/2'), `fraction display (got ${display})`);
});

run('row keys include normalized name + unit + category', () => {
  const result = buildSampleResult();
  for (const item of result.items) {
    assert(item.rowKey.includes('::'), 'rowKey structured');
    assert(item.id === item.rowKey, 'id matches rowKey');
    assert(Boolean(item.displayCategory), 'displayCategory set');
  }
});

run('fingerprint changes when selections change', () => {
  const plan = generateBabyWeeklyPlan('early', 42);
  assert(plan.ok, 'plan');
  if (!plan.ok) return;
  const a = plan.plan.slots.slice(0, 3).map((s) => ({ recipeId: s.recipeId, portion: 1 as const }));
  const b = plan.plan.slots.slice(0, 4).map((s) => ({ recipeId: s.recipeId, portion: 1 as const }));
  const menusA = a.map((s) => ({ ...s, name: 'X', dayLabel: '월' }));
  const menusB = b.map((s) => ({ ...s, name: 'X', dayLabel: '월' }));
  const resultA = buildBabyBatchGroceryList(a, menusA, 'early');
  const resultB = buildBabyBatchGroceryList(b, menusB, 'early');
  assert(resultA.fingerprint !== resultB.fingerprint, 'different selections → different fingerprint');
});

run('category grouping uses existing labels', () => {
  const result = buildSampleResult();
  if (result.groups.length === 0) return;
  const labels = result.groups.map((group) => group.label);
  assert(labels.every((label) => ['곡류', '육류·생선', '채소·과일', '기타'].includes(label)), 'known labels');
});

run('UI wiring + storage + analytics + no shopping ads', () => {
  const resultScreen = read('components/babyFood/BabyBatchCookingResultScreen.tsx');
  assert(resultScreen.includes('ChecklistIngredientRow'), 'checklist rows');
  assert(resultScreen.includes('checklistProgress'), 'progress copy');
  assert(resultScreen.includes('resetChecksButton'), 'reset');
  assert(resultScreen.includes('Share.share'), 'OS share');
  assert(resultScreen.includes('trackBabyGroceryChecklistView'), 'checklist view analytics');
  assert(!resultScreen.includes('Coupang'), 'no coupang');
  assert(!resultScreen.includes('AdMob'), 'no admob');
  assert(
    BABY_GROCERY_CHECKLIST_STORAGE_KEY === '@hankki/baby_grocery_checklist',
    'storage key',
  );
  assert(babyBatchCookingCopy.checklistProgress(2, 7) === '준비한 재료 2 / 7', 'progress copy');
  const analytics = read('services/analytics/analyticsEvents.ts');
  assert(analytics.includes('baby_grocery_checklist_view'), 'view event');
  assert(analytics.includes('baby_grocery_item_toggle'), 'toggle event');
  assert(analytics.includes('baby_grocery_checklist_reset'), 'reset event');
  assert(analytics.includes('baby_grocery_checklist_share'), 'share event');
});

run('share text has ingredient lines not menu names', () => {
  const result = buildSampleResult();
  const share = buildBabyGroceryShareText(result);
  assert(share.includes('이번 주 이유식 준비 재료'), 'title');
  assert(!share.includes('회분'), 'no menu portion lines');
  for (const menu of result.selectedMenus) {
    assert(!share.includes(menu.name), 'no menu names in share');
  }
  if (result.items[0]) {
    assert(share.includes(result.items[0].displayLine.split(' ')[0]!), 'includes ingredient display');
  }
});

console.log('\n--- summary ---');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('PASS — baby grocery checklist QA');
