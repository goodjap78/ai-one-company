/**
 * HANKKI Sprint 5.3 — share card text readability QA.
 * Run: npx tsx scripts/test-elementary-weekly-sprint5-3-share.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SHARE_CARD_QA_PREVIEW_MAX_WIDTH,
  SHARE_GRID_IMAGE_FLEX,
  SHARE_GRID_TEXT_BAND_MIN_HEIGHT,
  SHARE_GRID_TEXT_FLEX,
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

console.log('HANKKI Sprint 5.3 share card text readability QA — start\n');

run('4:5 capture unchanged', () => {
  assert(WEEKLY_PLAN_SHARE_CARD_WIDTH === 360, 'width 360');
  assert(WEEKLY_PLAN_SHARE_CARD_HEIGHT === 450, 'height 450');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, '1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, '1350');
});

run('image/text split 72–75 / 25–28', () => {
  assert(SHARE_GRID_IMAGE_FLEX >= 0.72 && SHARE_GRID_IMAGE_FLEX <= 0.75, `image flex ${SHARE_GRID_IMAGE_FLEX}`);
  assert(SHARE_GRID_TEXT_FLEX >= 0.25 && SHARE_GRID_TEXT_FLEX <= 0.28, `text flex ${SHARE_GRID_TEXT_FLEX}`);
  assert(
    Math.abs(SHARE_GRID_IMAGE_FLEX + SHARE_GRID_TEXT_FLEX - 1) < 0.001,
    'flex sums to 1',
  );
  assert(SHARE_GRID_TEXT_BAND_MIN_HEIGHT >= 28, `text band min ${SHARE_GRID_TEXT_BAND_MIN_HEIGHT}`);
});

run('dedicated cream text band — no clip under photo', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(cell.includes('gridTextBand'), 'text band exists');
  assert(cell.includes('SHARE_GRID_TEXT_BAND_MIN_HEIGHT'), 'reserved min height');
  assert(cell.includes('flexShrink: 0'), 'text band does not shrink away');
  assert(cell.includes('#FFFCF7') || cell.includes('FFFCF7') || cell.includes('SHARE_CARD_TEXT_BAND'), 'cream/white band');
  assert(cell.includes('numberOfLines={2}'), 'name max 2 lines');
  assert(!cell.includes('adjustsFontSizeToFit'), 'no shrink-to-fit clipping');
  assert(!cell.includes('ellipsizeMode'), 'prefer wrap over ellipsis');
});

run('titles are card-news header lines', () => {
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitle === '초등학생 아침', 'breakfast title');
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'breakfast line2');
  assert(
    elementaryBreakfastWeeklyPlanCopy.shareCardSubtitle.includes('아침 고민'),
    'breakfast subtitle',
  );
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitle === '초등학생 저녁', 'dinner title');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'dinner line2');
  assert(
    elementaryDinnerWeeklyPlanCopy.shareCardSubtitle.includes('저녁 고민'),
    'dinner subtitle',
  );
});

run('sunday full-width + brand footer (no shopping hint)', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(card.includes('variant="sunday"'), 'sunday variant');
  assert(cell.includes('sundayTextBand'), 'sunday text band');
  assert(SHARE_SUNDAY_CARD_HEIGHT >= 90, `sunday height ${SHARE_SUNDAY_CARD_HEIGHT}`);
  assert(!card.includes('shoppingLine'), 'shopping hint removed from share card');
  assert(!card.includes('model.shoppingHint'), 'no shopping hint render');
  assert(card.includes('brandName'), 'brand kept');
  assert(cell.includes('resizeMode="cover"'), 'natural food crop');
  assert(cell.includes('dayBadgeOnImage'), 'day badge on photo');
});

run('breakfast + dinner models readable', () => {
  for (const [label, generate, build] of [
    ['breakfast', generateElementaryBreakfastWeek, buildElementaryBreakfastWeeklyShareCardModel],
    ['dinner', generateElementaryDinnerWeek, buildElementaryDinnerWeeklyShareCardModel],
  ] as const) {
    const result = generate(42);
    assert(result.ok && Boolean(result.plan), `${label} generates`);
    if (!result.ok || !result.plan) continue;
    const model = build(result.plan);
    assert(model.items.length === 7, `${label} 7 days`);
    for (const item of model.items) {
      assert(item.name.trim().length > 0, `${label} ${item.day} has name`);
    }
  }
});

run('preview matches capture card', () => {
  const preview = read('components/elementaryWeekly/ElementaryWeeklyShareCardPreview.tsx');
  const breakfast = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const dinner = read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx');
  assert(preview.includes('ElementaryWeeklyShareCard'), 'preview same card');
  assert(SHARE_CARD_QA_PREVIEW_MAX_WIDTH >= 540, 'qa preview width');
  assert(breakfast.includes('<ElementaryWeeklyShareCard'), 'breakfast capture');
  assert(dinner.includes('<ElementaryWeeklyShareCard'), 'dinner capture');
});

run('long menu names stay 2-line wrap safe', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(cell.includes('numberOfLines={2}'), 'max 2 lines');
  assert(cell.includes('gridTextBand') || cell.includes('SHARE_GRID_TEXT_BAND'), 'dedicated text band');
  assert(!cell.includes('adjustsFontSizeToFit'), 'no shrink-to-fit clip');
  const samples = ['계란치즈또띠아', '참치마요주먹밥', '소고기야채덮밥', '사과시나몬토스트'];
  for (const name of samples) {
    assert(name.length >= 6, `sample ${name}`);
  }
});

console.log(`\nSprint 5.3 metrics:`);
console.log(`  IMAGE_FLEX=${SHARE_GRID_IMAGE_FLEX} TEXT_FLEX=${SHARE_GRID_TEXT_FLEX}`);
console.log(`  TEXT_BAND_MIN=${SHARE_GRID_TEXT_BAND_MIN_HEIGHT}`);
console.log(`  SUNDAY_HEIGHT=${SHARE_SUNDAY_CARD_HEIGHT}`);

console.log(`\nHANKKI Sprint 5.3 share card text readability QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
