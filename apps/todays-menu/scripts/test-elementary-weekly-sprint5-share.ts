/**
 * HANKKI v1.1 Sprint 5 — elementary weekly share card design QA.
 * Run: npx tsx scripts/test-elementary-weekly-sprint5-share.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';
import { elementaryBreakfastWeeklyPlanCopy } from '../constants/elementaryBreakfastWeeklyPlanCopy';
import { elementaryDinnerWeeklyPlanCopy } from '../constants/elementaryDinnerWeeklyPlanCopy';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { buildElementaryBreakfastWeeklyShareCardModel } from '../services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay';
import { buildElementaryDinnerWeeklyShareCardModel } from '../services/weeklyPlan/elementaryDinnerWeeklyPlanDisplay';
import {
  resolveWeeklyShareFoodPoint,
  resolveWeeklyShareShoppingHint,
} from '../services/weeklyPlan/elementaryWeeklyShareCardModel';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

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

console.log('HANKKI Sprint 5 elementary weekly share card QA — start\n');

run('4:5 ratio and 1080×1350 output', () => {
  assert(WEEKLY_PLAN_SHARE_CARD_WIDTH === 360, 'width 360');
  assert(WEEKLY_PLAN_SHARE_CARD_HEIGHT === 450, 'height 450');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'output 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'output 1350');
});

run('new share card component — card-news layout', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(card.includes('ElementaryWeeklyShareMealCell'), 'meal cells');
  assert(card.includes('shareCardTitleLine2'), 'header title lines');
  assert(card.includes('gridRow'), '2-column rows');
  assert(card.includes('variant="sunday"'), 'sunday full width');
  assert(!card.includes('SeedMascot'), 'no seed on share card');
  assert(!card.includes('model.shoppingHint'), 'shopping hint not rendered');
  assert(card.includes('brandName'), 'brand footer');
  assert(!card.includes('calorie'), 'no calorie text');
  assert(!card.includes('protein'), 'no protein grams');
});

run('screens use ElementaryWeeklyShareCard', () => {
  const breakfast = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const dinner = read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx');
  assert(breakfast.includes('ElementaryWeeklyShareCard'), 'breakfast share card');
  assert(dinner.includes('ElementaryWeeklyShareCard'), 'dinner share card');
  assert(breakfast.includes('buildElementaryBreakfastWeeklyShareCardModel'), 'breakfast model');
  assert(dinner.includes('buildElementaryDinnerWeeklyShareCardModel'), 'dinner model');
});

run('baby/toddler still use legacy list share card', () => {
  const baby = read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx');
  const toddler = read('components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx');
  assert(baby.includes('ElementaryWeeklyPlanShareCard'), 'baby legacy card');
  assert(toddler.includes('ElementaryWeeklyPlanShareCard'), 'toddler legacy card');
});

run('breakfast share model — 7 items + fields', () => {
  const generated = generateElementaryBreakfastWeek(42);
  assert(generated.ok === true, 'generates');
  if (!generated.ok) return;
  const model = buildElementaryBreakfastWeeklyShareCardModel(generated.plan);
  assert(model.items.length === 7, '7 items');
  assert(model.items.every((item) => item.name.length > 0), 'all names');
  assert(model.items.every((item) => item.dayLabel.length === 1), 'Korean day labels');
  assert(model.items.every((item) => item.recipeId.length > 0), 'recipe ids');
});

run('dinner share model — 7 items', () => {
  const generated = generateElementaryDinnerWeek(42);
  assert(generated.ok === true, 'generates');
  if (!generated.ok) return;
  const model = buildElementaryDinnerWeeklyShareCardModel(generated.plan);
  assert(model.items.length === 7, '7 items');
});

run('food point — no nutrition numbers', () => {
  const recipe = getHankkiRecipeById('002');
  assert(recipe != null, 'sample recipe');
  const point = resolveWeeklyShareFoodPoint(recipe, recipe.time);
  assert(point.length > 0, 'has point');
  assert(!/\d+g/.test(point), 'no gram values');
  assert(!point.includes('kcal'), 'no kcal');
});

run('shopping hint — safe extraction or omit', () => {
  const generated = generateElementaryBreakfastWeek('shop-hint');
  assert(generated.ok === true, 'generates');
  if (!generated.ok) return;
  const model = buildElementaryBreakfastWeeklyShareCardModel(generated.plan);
  if (model.shoppingHint) {
    assert(model.shoppingHint.includes('·'), 'formatted hint');
    assert(!model.shoppingHint.includes('undefined'), 'no undefined');
  }
});

run('long menu name seed does not crash model', () => {
  const generated = generateElementaryBreakfastWeek('long-name-qa-2026');
  assert(generated.ok === true, 'generates long-name seed');
  if (!generated.ok) return;
  const model = buildElementaryBreakfastWeeklyShareCardModel(generated.plan);
  assert(model.items.length === 7, 'still 7 items');
});

run('copy — breakfast and dinner meal lines', () => {
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitle.includes('아침'), 'breakfast title');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitle.includes('저녁'), 'dinner title');
  assert(
    elementaryBreakfastWeeklyPlanCopy.shareCardTitle.includes('7일 식단') ||
      elementaryBreakfastWeeklyPlanCopy.shareCardTitleLine2.includes('식단'),
    'meal line',
  );
});

run('dev QA route gated', () => {
  assert(fs.existsSync(path.join(ROOT, 'app/qa/elementary-weekly-share.tsx')), 'route file');
  const route = read('app/qa/elementary-weekly-share.tsx');
  assert(route.includes('isInternalQaEnabled'), 'qa gate');
  assert(route.includes('Redirect'), 'production redirect');
  const entry = read('components/qa/ElementaryWeeklyShareQaEntry.tsx');
  assert(entry.includes('isInternalQaEnabled'), 'entry gated');
});

run('meal cell — image fallback', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(cell.includes('showEmojiFallback'), 'fallback');
  assert(cell.includes('numberOfLines={2}'), 'long name wrap');
});

run('capture pipeline unchanged', () => {
  const breakfast = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(breakfast.includes('captureElementaryBreakfastShareCard'), 'capture');
  assert(breakfast.includes('opacity: 1'), 'opaque capture host');
});

console.log(`\nHANKKI Sprint 5 elementary weekly share card QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
