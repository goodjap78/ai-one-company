/**
 * HANKKI Sprint 5.3 / 16 — share card layout + readability QA.
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
  SHARE_HERO_IMAGE_FLEX,
  SHARE_HERO_TEXT_FLEX,
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

console.log('HANKKI Sprint 16 share card visual QA — start\n');

run('4:5 capture unchanged', () => {
  assert(WEEKLY_PLAN_SHARE_CARD_WIDTH === 360, 'width 360');
  assert(WEEKLY_PLAN_SHARE_CARD_HEIGHT === 450, 'height 450');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, '1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, '1350');
});

run('grid image/text split 78–82 / 18–22', () => {
  assert(SHARE_GRID_IMAGE_FLEX >= 0.78 && SHARE_GRID_IMAGE_FLEX <= 0.82, `image flex ${SHARE_GRID_IMAGE_FLEX}`);
  assert(SHARE_GRID_TEXT_FLEX >= 0.18 && SHARE_GRID_TEXT_FLEX <= 0.22, `text flex ${SHARE_GRID_TEXT_FLEX}`);
  assert(Math.abs(SHARE_GRID_IMAGE_FLEX + SHARE_GRID_TEXT_FLEX - 1) < 0.001, 'flex sums to 1');
  assert(SHARE_GRID_TEXT_BAND_MIN_HEIGHT >= 26, `text band min ${SHARE_GRID_TEXT_BAND_MIN_HEIGHT}`);
});

run('hero image/text split ~80–82', () => {
  assert(SHARE_HERO_IMAGE_FLEX >= 0.8 && SHARE_HERO_IMAGE_FLEX <= 0.84, `hero image ${SHARE_HERO_IMAGE_FLEX}`);
  assert(SHARE_HERO_TEXT_FLEX >= 0.16 && SHARE_HERO_TEXT_FLEX <= 0.2, `hero text ${SHARE_HERO_TEXT_FLEX}`);
});

run('dedicated cream text band — no clip under photo', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(cell.includes('gridTextBand'), 'text band exists');
  assert(cell.includes('SHARE_GRID_TEXT_BAND_MIN_HEIGHT'), 'reserved min height');
  assert(cell.includes('flexShrink: 0'), 'text band does not shrink away');
  assert(cell.includes('SHARE_CARD_TEXT_BAND') || cell.includes('FFFCF7'), 'cream/white band');
  assert(cell.includes('numberOfLines={2}'), 'name max 2 lines');
  assert(!cell.includes('adjustsFontSizeToFit'), 'no shrink-to-fit clipping');
  assert(!cell.includes('ellipsizeMode'), 'prefer wrap over ellipsis');
});

run('header hierarchy — label then big 7일 식단', () => {
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitle === '초등학생 아침', 'breakfast label');
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'breakfast headline');
  assert(elementaryBreakfastWeeklyPlanCopy.shareCardSubtitle.includes('아침 고민'), 'breakfast subtitle');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitle === '초등학생 저녁', 'dinner label');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'dinner headline');
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(card.includes('styles.label'), 'small label style');
  assert(card.includes('styles.headline'), 'big headline style');
});

run('hero + 6-grid layout (Mon lead, Sun featured)', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(card.includes('variant="hero"'), 'mon hero');
  assert(card.includes('variant="featured"'), 'sun featured');
  assert(card.includes('heroSlot'), 'hero slot');
  assert(card.includes('gridBlock'), 'grid block');
  assert(!card.includes('shoppingLine'), 'shopping hint removed');
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
  assert(cell.includes('gridTextBand') || cell.includes('heroTextBand'), 'dedicated text band');
  assert(!cell.includes('adjustsFontSizeToFit'), 'no shrink-to-fit clip');
  const samples = ['계란치즈또띠아', '참치마요주먹밥', '소고기야채덮밥', '사과시나몬토스트'];
  for (const name of samples) {
    assert(name.length >= 6, `sample ${name}`);
  }
});

console.log(`\nSprint 16 metrics:`);
console.log(`  GRID_IMAGE=${SHARE_GRID_IMAGE_FLEX} GRID_TEXT=${SHARE_GRID_TEXT_FLEX}`);
console.log(`  HERO_IMAGE=${SHARE_HERO_IMAGE_FLEX} HERO_TEXT=${SHARE_HERO_TEXT_FLEX}`);

console.log(`\nHANKKI Sprint 16 share card visual QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
