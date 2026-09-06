/**
 * Sprint 12 — toddler breakfast/dinner weekly UI + share wiring QA.
 * Run: npx tsx scripts/test-toddler-sprint12-weekly-ui.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TODDLER_BREAKFAST_WEEK_HREF,
  TODDLER_DINNER_WEEK_HREF,
} from '../constants/appRoutes';
import { HOME_PURPOSES, HOME_WEEKLY_AUDIENCES } from '../constants/homeIaCopy';
import { toddlerBreakfastWeeklyPlanCopy } from '../constants/toddlerBreakfastWeeklyPlanCopy';
import { toddlerDinnerWeeklyPlanCopy } from '../constants/toddlerDinnerWeeklyPlanCopy';
import {
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';
import {
  SHARE_GRID_IMAGE_FLEX,
  SHARE_GRID_TEXT_FLEX,
} from '../constants/elementaryWeeklyShareCardLayout';
import { generateToddlerBreakfastWeek } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { generateToddlerDinnerWeek } from '../data/recipes/toddlerDinnerWeeklyPlan';
import {
  buildToddlerBreakfastWeeklyShareCardModel,
  buildToddlerDinnerWeeklyShareCardModel,
  resolveToddlerBfDnSlotDisplay,
} from '../services/weeklyPlan/toddlerBfDnWeeklyPlanDisplay';
import { isToddlerBreakfastEggBased } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    return;
  }
  console.log(`✅ ${msg}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI Sprint 12 toddler weekly UI QA — start\n');

assert(TODDLER_BREAKFAST_WEEK_HREF === '/toddler-breakfast-week', 'bf href');
assert(TODDLER_DINNER_WEEK_HREF === '/toddler-dinner-week', 'dn href');
assert(fs.existsSync(path.join(ROOT, 'app/toddler-breakfast-week.tsx')), 'bf route');
assert(fs.existsSync(path.join(ROOT, 'app/toddler-dinner-week.tsx')), 'dn route');
const layout = read('app/_layout.tsx');
assert(layout.includes('toddler-breakfast-week'), 'layout bf');
assert(layout.includes('toddler-dinner-week'), 'layout dn');

assert(toddlerBreakfastWeeklyPlanCopy.screenEyebrow === '유아 아침', 'bf eyebrow');
assert(toddlerBreakfastWeeklyPlanCopy.screenTitle === '7일 식단', 'bf title');
assert(toddlerBreakfastWeeklyPlanCopy.shareCardTitle === '유아 아침', 'bf share title');
assert(toddlerBreakfastWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'bf share line2');
assert(toddlerDinnerWeeklyPlanCopy.screenEyebrow === '유아 저녁', 'dn eyebrow');
assert(toddlerDinnerWeeklyPlanCopy.shareCardTitle === '유아 저녁', 'dn share title');
assert(toddlerDinnerWeeklyPlanCopy.shareCardTitleLine2 === '7일 식단', 'dn share line2');
assert(toddlerBreakfastWeeklyPlanCopy.shareCardBrandName === '한끼', 'brand');
assert(
  toddlerBreakfastWeeklyPlanCopy.shareCardBrandTagline === '우리 아이 밥 고민을 덜어드려요',
  'tagline',
);

const screen = read('components/toddlerWeekly/ToddlerBfDnWeeklyPlanScreen.tsx');
assert(screen.includes('ElementaryWeeklyMealSwitch'), 'meal switch');
assert(screen.includes('ElementaryWeeklyPlanDayCard'), 'day card');
assert(screen.includes('ElementaryWeeklyShareCard'), 'share card 5.3');
assert(screen.includes('generateToddlerBreakfastWeek'), 'bf generator');
assert(screen.includes('generateToddlerDinnerWeek'), 'dn generator');
assert(screen.includes('trackToddlerWeeklyPlanView'), 'analytics view');
assert(screen.includes('trackToddlerWeeklyPlanRefresh'), 'analytics refresh');
assert(screen.includes('router.push(`/recipe/${slot.recipeId}`)'), 'recipe detail');
assert(!screen.includes('grade'), 'no grade in UI');

assert(SHARE_GRID_IMAGE_FLEX >= 0.78 && SHARE_GRID_IMAGE_FLEX <= 0.82, `image flex ${SHARE_GRID_IMAGE_FLEX}`);
assert(SHARE_GRID_TEXT_FLEX >= 0.18 && SHARE_GRID_TEXT_FLEX <= 0.22, `text flex ${SHARE_GRID_TEXT_FLEX}`);
assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'share width');
assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'share height');

assert(screen.includes('HankkiHomeBrandLink'), 'brand home link');
assert(!screen.includes('ScreenBackButton'), 'no breadcrumb back');

const weekly = HOME_PURPOSES.find((p) => p.id === 'weekly');
assert(Boolean(weekly?.entries?.find((e) => e.id === 'toddlerBreakfast')), 'home toddler bf');
assert(Boolean(weekly?.entries?.find((e) => e.id === 'toddlerDinner')), 'home toddler dn');
assert(Boolean(weekly?.entries?.find((e) => e.id === 'elemBreakfast')), 'home elem bf');
assert(HOME_WEEKLY_AUDIENCES.length === 2, '2 audiences');

const homePanel = read('components/home/HomePurposeSubPanel.tsx');
assert(homePanel.includes('HOME_WEEKLY_AUDIENCES'), '2-step audience');
assert(homePanel.includes('HOME_WEEKLY_MEAL_LABELS'), '2-step meal');
assert(!homePanel.includes('← '), 'no arrow breadcrumb');
assert(homePanel.includes('audienceChip'), 'audience chips');

const qa = read('components/qa/ElementaryWeeklyShareQaScreen.tsx');
assert(qa.includes('toddler'), 'qa toddler');
assert(qa.includes('elementary'), 'qa elementary');
assert(qa.includes('generateToddlerBreakfastWeek'), 'qa toddler bf');
assert(read('components/qa/ElementaryWeeklyShareQaEntry.tsx').includes('isInternalQaEnabled'), 'qa gated');

const feed = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
assert(feed.includes('TODDLER_BREAKFAST_WEEK_HREF'), 'feed → breakfast week');

const bf = generateToddlerBreakfastWeek(12);
const dn = generateToddlerDinnerWeek(12);
assert(bf.ok, 'bf generate');
assert(dn.ok, 'dn generate');
if (bf.ok) {
  const ids = bf.plan.slots.map((s) => s.recipeId);
  assert(new Set(ids).size === 7, 'bf unique 7');
  const eggs = bf.plan.slots.filter((s) => {
    const r = getHankkiRecipeById(s.recipeId);
    return r ? isToddlerBreakfastEggBased(r) : false;
  }).length;
  assert(eggs <= 3, `bf egg <=3 (got ${eggs})`);
  const model = buildToddlerBreakfastWeeklyShareCardModel(bf.plan);
  assert(model.items.length === 7, 'bf share 7 items');
  assert(model.items.every((i) => i.name.trim().length > 0), 'bf names');
  const display = resolveToddlerBfDnSlotDisplay(bf.plan.slots[0]!, 'breakfast');
  assert(display.dayLabel.length > 0, 'day label');
}
if (dn.ok) {
  const ids = dn.plan.slots.map((s) => s.recipeId);
  assert(new Set(ids).size === 7, 'dn unique 7');
  const model = buildToddlerDinnerWeeklyShareCardModel(dn.plan);
  assert(model.items.length === 7, 'dn share 7 items');
}

assert(!read('app/toddler-breakfast-week.tsx').includes('AdMob'), 'no admob in route');
assert(!screen.includes('Coupang'), 'no coupang in screen');

if (failed > 0) {
  console.error(`\nHANKKI Sprint 12 — FAIL (${failed})`);
  process.exit(1);
}
console.log('\nHANKKI Sprint 12 toddler weekly UI QA — PASS');
