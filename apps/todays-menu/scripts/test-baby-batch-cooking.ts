/**
 * HANKKI v1.1 — baby multi-recipe batch cooking QA.
 * Run: npm run test:baby-batch-cooking
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BABY_FOOD_BATCH_HREF,
  BABY_FOOD_BATCH_RESULT_HREF,
} from '../constants/appRoutes';
import { babyBatchCookingCopy } from '../constants/babyBatchCookingCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  classifyBabyBatchCooking,
  classifyBabyPortionScaling,
  listBabyPortionScalingSummary,
  scaleBabyIngredientAmount,
} from '../data/recipes/babyPortionScaling';
import { generateBabyWeeklyPlan, isBabyWeeklyPlanEligible } from '../data/recipes/babyWeeklyPlan';
import {
  buildBabyBatchGroceryList,
  validateBabyBatchSelections,
} from '../services/babyFood/buildBabyBatchGroceryList';
import {
  formatBabyBatchDisplayLine,
  formatExactFraction,
} from '../services/babyFood/formatBabyBatchAmount';
import { mergeGroceryIngredients } from '../services/grocery/mergeGroceryIngredients';
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

console.log('HANKKI v1.1 baby batch cooking QA — start\n');

run('catalog portion + batch counts', () => {
  const summary = listBabyPortionScalingSummary(HANKKI_RECIPES);
  const baby = HANKKI_RECIPES.filter((r) => r.familyAudience.audiences.includes('baby'));
  const friendly = baby.filter((r) => classifyBabyBatchCooking(r) === 'friendly').length;
  assert(baby.length === 70, `baby total 70 (got ${baby.length})`);
  assert(summary.scalable.length === 61, `scalable 61 (got ${summary.scalable.length})`);
  assert(summary.reviewRequired.length === 9, `review_required 9 (got ${summary.reviewRequired.length})`);
  assert(friendly === 63, `batch friendly 63 (got ${friendly})`);
});

run('A — 3 scalable recipes × 3 portions merge same ingredient', () => {
  const plan = generateBabyWeeklyPlan('early', 42);
  assert(plan.ok, 'early plan');
  if (!plan.ok) return;
  const scalableIds = plan.plan.slots
    .map((s) => s.recipeId)
    .filter((id) => {
      const recipe = HANKKI_RECIPES.find((r) => r.id === id)!;
      return classifyBabyPortionScaling(recipe) === 'scalable';
    })
    .slice(0, 3);
  assert(scalableIds.length === 3, '3 scalable from week');

  const selections = scalableIds.map((recipeId) => ({ recipeId, portion: 3 as const }));
  const menus = selections.map((s) => ({
    recipeId: s.recipeId,
    name: HANKKI_RECIPES.find((r) => r.id === s.recipeId)!.name,
    dayLabel: '월',
    portion: s.portion,
  }));
  const result = buildBabyBatchGroceryList(selections, menus, 'early');
  assert(result.items.length > 0, 'has merged items');
  const rice = result.items.find((item) => /쌀|쌀밥/.test(item.name));
  if (rice) {
    assert(rice.quantity > 0, 'rice quantity merged');
  }
});

run('B — scalable + review_required mix keeps review at 1 portion', () => {
  const summary = listBabyPortionScalingSummary(HANKKI_RECIPES);
  const scalable = summary.scalable[0];
  const review = summary.reviewRequired[0];
  assert(Boolean(scalable && review), 'both types in catalog');
  if (!scalable || !review) return;

  const selections = [
    { recipeId: scalable.id, portion: 6 as const },
    { recipeId: review.id, portion: 6 as const },
  ];
  const reviewScaling = classifyBabyPortionScaling(review);
  const sampleIng = review.ingredients.find((ing) => /g|ml|작은술|큰술/.test(ing.amount));
  if (sampleIng) {
    const scaled = scaleBabyIngredientAmount(sampleIng.amount, 6, reviewScaling);
    assert(scaled === sampleIng.amount, 'review_required amount unchanged at 6');
  }

  const menus = selections.map((s) => ({
    recipeId: s.recipeId,
    name: HANKKI_RECIPES.find((r) => r.id === s.recipeId)!.name,
    dayLabel: '월',
    portion: s.portion,
  }));
  const result = buildBabyBatchGroceryList(selections, menus, 'early');
  assert(result.selectedMenus.length === 2, '2 menus in result');
  assert(
    validateBabyBatchSelections(
      [{ recipeId: scalable.id, portion: 1 }],
      scalable.familyAudience.babyFood!.stage,
    ),
    'scalable eligible in its stage',
  );
});

run('C — same ingredient same unit merges', () => {
  const lines: GroceryIngredientLine[] = [
    { name: '쌀', amount: '20g', recipeId: 'a' },
    { name: '쌀', amount: '20g', recipeId: 'b' },
  ];
  const merged = mergeGroceryIngredients(lines);
  assert(merged.length === 1, 'one line');
  assert(merged[0]!.quantity === 40, '40g total');
});

run('D — same ingredient different unit stays separate', () => {
  const lines: GroceryIngredientLine[] = [
    { name: '우유', amount: '100ml', recipeId: 'a' },
    { name: '우유', amount: '2큰술', recipeId: 'b' },
  ];
  const merged = mergeGroceryIngredients(lines);
  assert(merged.length === 2, 'two separate lines');
  assert(merged.some((item) => item.unit === 'ml'), 'ml line');
  assert(merged.some((item) => item.unit === '큰술'), 'spoon line');
});

run('E — fraction sum displays as 1/2', () => {
  assert(formatExactFraction(0.5) === '1/2', '0.5 → 1/2');
  const lines: GroceryIngredientLine[] = [
    { name: '소금', amount: '1/4작은술', recipeId: 'a' },
    { name: '소금', amount: '1/4작은술', recipeId: 'b' },
  ];
  const merged = mergeGroceryIngredients(lines);
  assert(merged.length === 1, 'merged fraction');
  assert(Math.abs(merged[0]!.quantity - 0.5) < 1e-6, 'quantity 0.5');
  const display = formatBabyBatchDisplayLine(merged[0]!.name, merged[0]!.quantity, merged[0]!.unit);
  assert(display.includes('1/2'), `display uses fraction (got ${display})`);
  assert(!display.includes('0.750000001'), 'no float artifact');
});

run('F — zero selection invalid', () => {
  assert(!validateBabyBatchSelections([], 'early'), 'empty invalid');
});

run('G — all 7 weekly recipes aggregate', () => {
  const plan = generateBabyWeeklyPlan('middle', 42);
  assert(plan.ok, 'middle plan');
  if (!plan.ok) return;
  const selections = plan.plan.slots.map((slot) => ({
    recipeId: slot.recipeId,
    portion: 1 as const,
  }));
  const menus = plan.plan.slots.map((slot) => ({
    recipeId: slot.recipeId,
    name: slot.recipeName,
    dayLabel: '월',
    portion: 1 as const,
  }));
  assert(validateBabyBatchSelections(selections, 'middle'), 'all eligible');
  const result = buildBabyBatchGroceryList(selections, menus, 'middle');
  assert(result.selectedMenus.length === 7, '7 menus');
  assert(result.items.length > 0, 'ingredients produced');
});

run('H — stage validation rejects wrong-stage recipe', () => {
  const early = generateBabyWeeklyPlan('early', 42);
  const middle = generateBabyWeeklyPlan('middle', 42);
  assert(early.ok && middle.ok, 'plans');
  if (!early.ok || !middle.ok) return;
  const cross = [{ recipeId: middle.plan.slots[0]!.recipeId, portion: 1 as const }];
  assert(!validateBabyBatchSelections(cross, 'early'), 'middle recipe not valid for early');
});

run('I — baby safety eligibility required', () => {
  const toddler = HANKKI_RECIPES.find((r) => r.familyAudience.audiences.includes('toddler'));
  assert(Boolean(toddler), 'toddler exists');
  if (!toddler) return;
  assert(
    !validateBabyBatchSelections([{ recipeId: toddler.id, portion: 1 }], 'early'),
    'toddler blocked',
  );
});

run('routes + UI wiring + no coupang/admob', () => {
  assert(BABY_FOOD_BATCH_HREF === '/baby-food-batch', 'batch route');
  assert(BABY_FOOD_BATCH_RESULT_HREF === '/baby-food-batch-result', 'result route');
  assert(read('app/baby-food-batch.tsx').includes('BabyBatchCookingSelectScreen'), 'batch route file');
  assert(read('app/baby-food-batch-result.tsx').includes('BabyBatchCookingResultScreen'), 'result route');
  assert(read('app/_layout.tsx').includes('baby-food-batch'), 'layout batch');
  assert(read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx').includes('BABY_FOOD_BATCH_HREF'), 'weekly entry');
  assert(read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx').includes('selected: false'), 'default off');
  assert(read('components/babyFood/BabyBatchCookingResultScreen.tsx').includes('setRecipeOpenSource'), 'detail nav');
  const result = read('components/babyFood/BabyBatchCookingResultScreen.tsx');
  assert(!result.includes('Coupang'), 'no coupang');
  assert(!result.includes('AdMob'), 'no admob');
  assert(!result.includes('coupang'), 'no coupang lower');
  assert(babyBatchCookingCopy.resultTitle === '준비할 재료', 'result title');
  assert(read('services/analytics/analyticsEvents.ts').includes('baby_batch_cooking_open'), 'analytics');
});

console.log('\n--- summary ---');
if (failed === 0) {
  console.log('PASS — baby batch cooking QA');
  process.exit(0);
}
console.error(`FAIL — ${failed} assertion(s)`);
process.exit(1);
