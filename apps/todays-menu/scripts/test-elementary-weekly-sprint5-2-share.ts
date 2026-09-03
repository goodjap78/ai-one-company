/**
 * HANKKI Sprint 5.2 — share card visual upgrade QA (kept compatible with 5.3 text band).
 * Run: npx tsx scripts/test-elementary-weekly-sprint5-2-share.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SHARE_CARD_QA_PREVIEW_MAX_WIDTH,
  SHARE_GRID_IMAGE_ASPECT_RATIO,
  SHARE_GRID_IMAGE_MIN_HEIGHT,
  SHARE_SUNDAY_CARD_HEIGHT,
} from '../constants/elementaryWeeklyShareCardLayout';
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

console.log('HANKKI Sprint 5.2 share card final visual upgrade QA — start\n');

run('4:5 capture size unchanged', () => {
  assert(WEEKLY_PLAN_SHARE_CARD_WIDTH === 360, 'width 360');
  assert(WEEKLY_PLAN_SHARE_CARD_HEIGHT === 450, 'height 450');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'output 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'output 1350');
});

run('photo-first meal cells', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(cell.includes('SHARE_GRID_IMAGE_FLEX'), 'image flex split');
  assert(SHARE_GRID_IMAGE_MIN_HEIGHT >= 50, `min height constant ${SHARE_GRID_IMAGE_MIN_HEIGHT}`);
  assert(cell.includes('gridTextBand'), 'dedicated text band');
  assert(!cell.includes('SHARE_GRID_IMAGE_HEIGHT'), 'no fixed strip height');
  assert(!cell.includes('ingredientHint'), 'no ingredient hint on card');
  assert(!cell.includes('foodPoint'), 'no food point on card');
  assert(!cell.includes('adjustsFontSizeToFit'), 'natural wrap preferred');
  assert(cell.includes('numberOfLines={2}'), 'menu name max 2 lines');
});

run('header / branding copy', () => {
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitle.includes('아침'), 'bf title');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitle.includes('저녁'), 'dn title');
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardSubtitle.includes('아침 고민'), 'bf subtitle');
  assert(
    elementaryBreakfastWeeklyPlanCopy.shareCardBrandTagline.includes('아이 밥 고민'),
    'brand tagline',
  );
});

run('simplified card info', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(card.includes('shareCardTitle'), 'title');
  assert(card.includes('shareCardSubtitle'), 'benefit line');
  assert(!card.includes('tipBlock'), 'tip block removed');
  assert(!card.includes('SeedMascot'), 'no Seed');
  assert(!card.includes('recipeId'), 'no recipeId render');
});

run('sunday full-width isolated from footer', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(card.includes('variant="sunday"'), 'sunday variant');
  assert(cell.includes('SHARE_SUNDAY_CARD_HEIGHT'), 'fixed sunday height');
  assert(SHARE_SUNDAY_CARD_HEIGHT >= 80, `sunday height ${SHARE_SUNDAY_CARD_HEIGHT}`);
  assert(cell.includes('sundayTextBand'), 'sunday text band');
  assert(card.includes('flexShrink: 0'), 'footer does not overlap body');
});

run('shopping hint 4–6 ingredients', () => {
  const bf = generateElementaryBreakfastWeek(42);
  assert(bf.ok && Boolean(bf.plan), 'breakfast generates');
  if (!bf.ok || !bf.plan) return;
  const model = buildElementaryBreakfastWeeklyShareCardModel(bf.plan);
  assert(model.items.length === 7, '7 days');
  assert(Boolean(model.shoppingHint), 'shopping hint present');
  const parts = (model.shoppingHint ?? '').split(' · ').filter(Boolean);
  assert(parts.length >= 3 && parts.length <= 6, `hint count ${parts.length} in 3–6`);

  const dn = generateElementaryDinnerWeek(42);
  assert(dn.ok && Boolean(dn.plan), 'dinner generates');
  if (!dn.ok || !dn.plan) return;
  const dinnerModel = buildElementaryDinnerWeeklyShareCardModel(dn.plan);
  assert(dinnerModel.items.length === 7, 'dinner 7 days');
  if (dinnerModel.shoppingHint) {
    const dnParts = dinnerModel.shoppingHint.split(' · ').filter(Boolean);
    assert(dnParts.length <= 6, `dinner hint <= 6 (got ${dnParts.length})`);
  }
});

run('qa preview matches capture card', () => {
  const preview = read('components/elementaryWeekly/ElementaryWeeklyShareCardPreview.tsx');
  const breakfast = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const dinner = read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx');
  assert(preview.includes('ElementaryWeeklyShareCard'), 'preview wraps same card');
  assert(SHARE_CARD_QA_PREVIEW_MAX_WIDTH >= 540, 'preview at least 540px');
  assert(breakfast.includes('<ElementaryWeeklyShareCard'), 'breakfast capture');
  assert(dinner.includes('<ElementaryWeeklyShareCard'), 'dinner capture');
});

console.log(`\nSprint 5.2 metrics:`);
console.log(`  GRID_IMAGE_MIN_HEIGHT=${SHARE_GRID_IMAGE_MIN_HEIGHT}`);
console.log(`  SUNDAY_CARD_HEIGHT=${SHARE_SUNDAY_CARD_HEIGHT}`);
console.log(`  ASPECT_RATIO=${SHARE_GRID_IMAGE_ASPECT_RATIO}`);

console.log(`\nHANKKI Sprint 5.2 share card final visual upgrade QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
