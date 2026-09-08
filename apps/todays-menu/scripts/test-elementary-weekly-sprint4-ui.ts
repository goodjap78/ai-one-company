/**
 * HANKKI v1.1 Sprint 4 — elementary weekly plan UI upgrade QA.
 * Run: npx tsx scripts/test-elementary-weekly-sprint4-ui.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
} from '../constants/appRoutes';
import { elementaryBreakfastWeeklyPlanCopy as breakfastCopy } from '../constants/elementaryBreakfastWeeklyPlanCopy';
import { elementaryDinnerWeeklyPlanCopy as dinnerCopy } from '../constants/elementaryDinnerWeeklyPlanCopy';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../data/recipes/elementaryDinnerWeeklyPlan';
import {
  formatWeeklyPlanIngredientHints,
  resolveWeeklyPlanMainIngredientHints,
} from '../services/weeklyPlan/elementaryWeeklyPlanDisplayCommon';
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

console.log('HANKKI Sprint 4 elementary weekly UI QA — start\n');

run('shared weekly UI components exist', () => {
  const files = [
    'components/elementaryWeekly/ElementaryWeeklyPlanHeader.tsx',
    'components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx',
    'components/elementaryWeekly/ElementaryWeeklyPlanFooter.tsx',
    'components/elementaryWeekly/ElementaryWeeklyMealSwitch.tsx',
    'components/elementaryWeekly/ElementaryWeeklyShareCard.tsx',
  ];
  for (const file of files) {
    assert(fs.existsSync(path.join(ROOT, file)), `${file} exists`);
  }
});

run('header copy — breakfast', () => {
  assert(breakfastCopy.screenEyebrow === '초등학생 아침', 'eyebrow');
  assert(breakfastCopy.screenTitle === '7일 식단', 'title');
  assert(breakfastCopy.screenSubtitle.includes('한 번에 해결'), 'subtitle');
});

run('header copy — dinner', () => {
  assert(dinnerCopy.screenEyebrow === '초등학생 저녁', 'eyebrow');
  assert(dinnerCopy.screenTitle === '7일 식단', 'title');
  assert(dinnerCopy.screenSubtitle.includes('한 번에 해결'), 'subtitle');
});

run('CTA labels shortened', () => {
  assert(breakfastCopy.saveImageButton === '이미지 저장', 'save label');
  assert(breakfastCopy.shareButton === '공유하기', 'share label');
  assert(dinnerCopy.saveImageButton === '이미지 저장', 'dinner save');
  assert(dinnerCopy.shareButton === '공유하기', 'dinner share');
});

run('breakfast screen — shared layout + meal switch', () => {
  const src = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(src.includes('ElementaryWeeklyPlanHeader'), 'header');
  assert(src.includes('ElementaryWeeklyMealSwitch'), 'switch');
  assert(src.includes('ElementaryWeeklyPlanDayCard'), 'day card');
  assert(src.includes('ElementaryWeeklyPlanFooter'), 'footer');
  assert(src.includes('useSafeAreaInsets'), 'safe area insets');
  assert(src.includes('elementaryWeeklyPlanFooterScrollPadding'), 'footer scroll padding');
  assert(src.includes('ELEMENTARY_DINNER_WEEK_HREF'), 'dinner navigation');
  assert(!src.includes('ELEMENTARY_BROWSE_HREF'), 'browse chip removed');
  assert(src.includes('weeklyRecipeDetailHref(slot.recipeId)'), 'recipe detail route');
  assert(src.includes('seed: plan.seed'), 'seed in analytics');
});

run('dinner screen — shared layout + meal switch', () => {
  const src = read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx');
  assert(src.includes('ElementaryWeeklyPlanHeader'), 'header');
  assert(src.includes('ElementaryWeeklyMealSwitch'), 'switch');
  assert(src.includes('mode="dinner"'), 'dinner mode');
  assert(src.includes('ELEMENTARY_BREAKFAST_WEEK_HREF'), 'breakfast navigation');
  assert(!src.includes('ELEMENTARY_BROWSE_HREF'), 'browse chip removed');
});

run('day card uses hero image + ingredient hints', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx');
  assert(card.includes('MealImageView'), 'meal image');
  assert(card.includes('showEmojiFallback'), 'fallback preserved');
  assert(card.includes('resolveMealHeroImage'), 'hero image resolver');
  const display = read('services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay.ts');
  assert(display.includes('ingredientHint'), 'ingredient hint field');
});

run('share card — required content fields', () => {
  const share = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(share.includes('shareCardTitle') || share.includes('shareCardTitleLine2'), 'share header copy');
});

run('routes unchanged', () => {
  assert(ELEMENTARY_BREAKFAST_WEEK_HREF === '/elementary-breakfast-week', 'breakfast href');
  assert(ELEMENTARY_DINNER_WEEK_HREF === '/elementary-dinner-week', 'dinner href');
});

run('generators still produce 7 unique slots', () => {
  const b = generateElementaryBreakfastWeek(42);
  const d = generateElementaryDinnerWeek(42);
  assert(b.ok === true, 'breakfast generates');
  assert(d.ok === true, 'dinner generates');
  if (b.ok) {
    const ids = b.plan.slots.map((s) => s.recipeId);
    assert(new Set(ids).size === 7, 'breakfast 7 unique');
  }
  if (d.ok) {
    const ids = d.plan.slots.map((s) => s.recipeId);
    assert(new Set(ids).size === 7, 'dinner 7 unique');
  }
});

run('ingredient hint helper', () => {
  const recipe = getHankkiRecipeById('002');
  assert(recipe != null, 'sample recipe');
  const hints = resolveWeeklyPlanMainIngredientHints(recipe);
  assert(hints.length >= 1, 'has main ingredients');
  assert(formatWeeklyPlanIngredientHints(hints).includes('·') || hints.length === 1, 'formats hint');
});

run('no Coming Soon labels in weekly screens', () => {
  const breakfast = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const dinner = read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx');
  assert(!breakfast.includes('Coming Soon'), 'no coming soon breakfast');
  assert(!dinner.includes('Coming Soon'), 'no coming soon dinner');
  assert(!breakfast.includes('14일'), 'no 14-day UI');
  assert(!dinner.includes('14일'), 'no 14-day UI dinner');
});

console.log(`\nHANKKI Sprint 4 elementary weekly UI QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
