/**
 * HANKKI v1.1 — Child Meal Planning Integrated QA.
 * Run: npm run test:child-meal-planning-integrated
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BABY_FOOD_WEEKLY_HREF,
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
  TODDLER_MEALS_WEEKLY_HREF,
} from '../constants/appRoutes';
import { BABY_FOOD_FEED_STAGE_LABELS } from '../constants/babyFoodFeedCopy';
import { TODDLER_FEED_MEAL_TYPE_LABELS } from '../constants/toddlerMealFeedCopy';
import { childSearchCopy } from '../constants/childSearchCopy';
import { listBabyFoodFeedRecipes } from '../data/recipes/babyFoodFeed';
import { EMPTY_BABY_FILTERS } from '../data/recipes/childSearchFilters';
import { listElementaryBrowseRecipes } from '../data/recipes/elementaryBrowseFeed';
import { generateBabyWeeklyPlan } from '../data/recipes/babyWeeklyPlan';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listToddlerMealFeedRecipes } from '../data/recipes/toddlerMealFeed';
import { generateToddlerWeeklyPlan } from '../data/recipes/toddlerWeeklyPlan';
import {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_EVENTS,
  FORBIDDEN_ANALYTICS_PARAM_KEYS,
} from '../services/analytics/analyticsEvents';
import { BABY_WEEKLY_PLAN_STORAGE_KEYS } from '../services/weeklyPlan/babyWeeklyPlanStorage';
import { ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY } from '../services/weeklyPlan/elementaryBreakfastWeeklyPlanStorage';
import { ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY } from '../services/weeklyPlan/elementaryDinnerWeeklyPlanStorage';
import {
  TODDLER_WEEKLY_PLAN_LAST_MEAL_KEY,
  TODDLER_WEEKLY_PLAN_STORAGE_KEYS,
} from '../services/weeklyPlan/toddlerWeeklyPlanStorage';
import {
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';
import { searchBabyFeedRecipes } from '../services/search/childRecipeSearch';

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

console.log('HANKKI v1.1 child meal planning integrated QA — start\n');

run('catalog audience counts', () => {
  assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
  assert(listBabyFoodFeedRecipes().length === 70, `baby 70 (got ${listBabyFoodFeedRecipes().length})`);
  assert(
    listToddlerMealFeedRecipes().length === 74,
    `toddler 74 (got ${listToddlerMealFeedRecipes().length})`,
  );
  assert(
    listElementaryBrowseRecipes().length === 78,
    `elementary 78 (got ${listElementaryBrowseRecipes().length})`,
  );
});

run('weekly storage keys are unique and audience-scoped', () => {
  const keys = [
    ...Object.values(BABY_WEEKLY_PLAN_STORAGE_KEYS),
    ...Object.values(TODDLER_WEEKLY_PLAN_STORAGE_KEYS),
    TODDLER_WEEKLY_PLAN_LAST_MEAL_KEY,
    ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY,
    ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY,
  ];
  assert(keys.length === new Set(keys).size, 'all storage keys unique');
  assert(
    !Object.values(TODDLER_WEEKLY_PLAN_STORAGE_KEYS).some((key) =>
      Object.values(BABY_WEEKLY_PLAN_STORAGE_KEYS).includes(key),
    ),
    'baby and toddler weekly keys disjoint',
  );
  assert(
    ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY !== ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY,
    'elementary breakfast/dinner keys differ',
  );
});

run('weekly generators do not import search/filter modules', () => {
  for (const rel of [
    'data/recipes/babyWeeklyPlan.ts',
    'data/recipes/toddlerWeeklyPlan.ts',
    'data/recipes/elementaryBreakfastWeeklyPlan.ts',
    'data/recipes/elementaryDinnerWeeklyPlan.ts',
  ]) {
    const src = read(rel);
    assert(!src.includes('childSearchFilters'), `${rel} no childSearchFilters`);
    assert(!src.includes('childRecipeSearch'), `${rel} no childRecipeSearch`);
    assert(!src.includes('applyBabyFilters'), `${rel} no applyBabyFilters`);
    assert(!src.includes('applyToddlerFilters'), `${rel} no applyToddlerFilters`);
    assert(!src.includes('applyElementaryFilters'), `${rel} no applyElementaryFilters`);
  }
});

run('search/filter state does not shrink weekly candidate pools', () => {
  const earlyFeed = listBabyFoodFeedRecipes('early');
  const searched = searchBabyFeedRecipes('early', '당근', EMPTY_BABY_FILTERS);
  assert(searched.length < earlyFeed.length, 'baby search narrows feed pool');
  const weekly = generateBabyWeeklyPlan('early', 42);
  assert(weekly.ok, 'baby weekly still generates from full pool');
  assert(
    weekly.ok && weekly.eligibleCount === earlyFeed.length,
    'weekly eligibleCount matches unfiltered feed pool',
  );
});

run('batch cooking session is in-memory only', () => {
  const src = read('services/babyFood/babyBatchCookingSession.ts');
  assert(!src.includes('AsyncStorage'), 'batch session no AsyncStorage');
  assert(!src.includes('@hankki/baby_weekly_plan'), 'batch session no weekly key writes');
});

run('cross-audience weekly generation is independent (seed 42)', () => {
  const baby = generateBabyWeeklyPlan('early', 42);
  const toddler = generateToddlerWeeklyPlan('dinner', 42);
  const breakfast = generateElementaryBreakfastWeek(42);
  const dinner = generateElementaryDinnerWeek(42);
  assert(baby.ok, 'baby week ok');
  assert(toddler.ok, 'toddler week ok');
  assert(breakfast.ok, 'elementary breakfast ok');
  assert(dinner.ok, 'elementary dinner ok');
  assert(baby.ok && baby.plan.audience === 'baby', 'baby audience');
  assert(toddler.ok && toddler.plan.audience === 'toddler', 'toddler audience');
  assert(breakfast.ok && breakfast.plan.audience === 'elementary', 'breakfast audience');
  assert(dinner.ok && dinner.plan.audience === 'elementary', 'dinner audience');
});

run('all four weekly share flows use 1080×1350', () => {
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'share width 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'share height 1350');
  const shared = read('services/weeklyPlan/weeklyPlanShare.ts');
  assert(shared.includes('WEEKLY_PLAN_SHARE_OUTPUT_WIDTH'), 'weeklyPlanShare uses width constant');
  assert(shared.includes('WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT'), 'weeklyPlanShare uses height constant');
  for (const rel of [
    'services/weeklyPlan/babyWeeklyPlanShare.ts',
    'services/weeklyPlan/toddlerWeeklyPlanShare.ts',
    'services/weeklyPlan/elementaryBreakfastWeeklyPlanShare.ts',
    'services/weeklyPlan/elementaryDinnerWeeklyPlanShare.ts',
  ]) {
    const src = read(rel);
    assert(
      src.includes('weeklyPlanShare') || src.includes('WEEKLY_PLAN_SHARE_OUTPUT'),
      `${rel} delegates to shared share module or dimensions`,
    );
  }
});

run('weekly screens wrap share/save in try/catch', () => {
  for (const rel of [
    'components/babyFood/BabyFoodWeeklyPlanScreen.tsx',
    'components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx',
    'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
    'components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx',
  ]) {
    const src = read(rel);
    assert(src.includes('try {'), `${rel} has try block`);
    assert(src.includes('catch'), `${rel} has catch`);
  }
});

run('baby batch cooking has no Coupang/AdMob', () => {
  for (const rel of [
    'components/babyFood/BabyBatchCookingSelectScreen.tsx',
    'components/babyFood/BabyBatchCookingResultScreen.tsx',
  ]) {
    const src = read(rel).toLowerCase();
    assert(!src.includes('coupang'), `${rel} no coupang`);
    assert(!src.includes('admob'), `${rel} no admob`);
  }
});

run('child routes wired for full flows', () => {
  assert(BABY_FOOD_WEEKLY_HREF === '/baby-food-week', 'baby weekly route');
  assert(TODDLER_MEALS_WEEKLY_HREF === '/toddler-meals-week', 'toddler weekly route');
  assert(ELEMENTARY_BREAKFAST_WEEK_HREF === '/elementary-breakfast-week', 'elem breakfast route');
  assert(ELEMENTARY_DINNER_WEEK_HREF === '/elementary-dinner-week', 'elem dinner route');
  const layout = read('app/_layout.tsx');
  assert(layout.includes('baby-food-week'), 'layout baby weekly');
  assert(layout.includes('toddler-meals-week'), 'layout toddler weekly');
  assert(layout.includes('elementary-breakfast-week'), 'layout elem breakfast');
  assert(layout.includes('elementary-dinner-week'), 'layout elem dinner');
});

run('user-facing copy uses Korean labels, not internal enums', () => {
  assert(BABY_FOOD_FEED_STAGE_LABELS.early === '시작기', 'early → 시작기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.middle === '적응기', 'middle → 적응기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.late === '확장기', 'late → 확장기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.completion === '전환기', 'completion → 전환기');
  assert(TODDLER_FEED_MEAL_TYPE_LABELS.breakfast === '아침', 'breakfast → 아침');
  assert(TODDLER_FEED_MEAL_TYPE_LABELS.lunch === '점심', 'lunch → 점심');
  assert(TODDLER_FEED_MEAL_TYPE_LABELS.dinner === '저녁', 'dinner → 저녁');
  assert(TODDLER_FEED_MEAL_TYPE_LABELS.snack === '간식', 'snack → 간식');
  assert(childSearchCopy.elementaryBrowseTitle === '초등 메뉴 골라보기', 'elementary browse title');

  for (const rel of [
    'components/babyFood/BabyFoodWeeklyPlanScreen.tsx',
    'components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx',
    'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
    'components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx',
  ]) {
    const src = read(rel);
    assert(!src.includes('review_required'), `${rel} no review_required in UI`);
    assert(!src.includes('batch_friendly'), `${rel} no batch_friendly in UI`);
  }
});

run('analytics — 45 events, child events present, forbidden params blocked', () => {
  assert(Object.keys(ANALYTICS_EVENTS).length === 49, `49 event keys (got ${Object.keys(ANALYTICS_EVENTS).length})`);
  assert(ANALYTICS_EVENT_NAMES.length === 49, `49 event names`);
  assert(ANALYTICS_EVENT_NAMES.length === new Set(ANALYTICS_EVENT_NAMES).size, 'no duplicate event names');

  const childEvents = [
    ANALYTICS_EVENTS.babyWeeklyPlanView,
    ANALYTICS_EVENTS.toddlerWeeklyPlanView,
    ANALYTICS_EVENTS.elementaryWeeklyPlanView,
    ANALYTICS_EVENTS.childSearch,
    ANALYTICS_EVENTS.childFilterChange,
    ANALYTICS_EVENTS.childSearchRecipeClick,
    ANALYTICS_EVENTS.babyBatchCookingOpen,
    ANALYTICS_EVENTS.babyGroceryChecklistView,
    ANALYTICS_EVENTS.babyGroceryItemToggle,
    ANALYTICS_EVENTS.babyGroceryChecklistReset,
    ANALYTICS_EVENTS.babyGroceryChecklistShare,
  ];
  for (const name of childEvents) {
    assert(ANALYTICS_EVENT_NAMES.includes(name), `${name} registered`);
  }

  const searchSrc = read('services/analytics/analytics.ts');
  assert(searchSrc.includes('query_length'), 'analytics uses query_length');
  assert(!searchSrc.includes("query:"), 'analytics track helpers no raw query param key');
  assert(FORBIDDEN_ANALYTICS_PARAM_KEYS.includes('query'), 'query forbidden in analytics');
  assert(FORBIDDEN_ANALYTICS_PARAM_KEYS.includes('title'), 'title forbidden in analytics');
});

run('child search analytics uses query_length not query text', () => {
  const babyFeed = read('components/babyFood/BabyFoodFeedScreen.tsx');
  assert(babyFeed.includes('query_length'), 'baby feed query_length');
  assert(babyFeed.includes('trackChildSearch'), 'baby feed trackChildSearch');
  const toddlerFeed = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(toddlerFeed.includes('query_length'), 'toddler feed query_length');
  const elemBrowse = read('components/elementary/ElementaryBrowseScreen.tsx');
  assert(elemBrowse.includes('query_length'), 'elementary browse query_length');
});

run('empty step slots render text-only (no broken placeholder)', () => {
  const stepSlots = read('components/recipe/ChildStepImageSlots.tsx');
  assert(stepSlots.includes('return null'), 'ChildStepImageSlots returns null when empty');
  const stepsList = read('components/recipe/RecipeStepsList.tsx');
  assert(stepsList.includes('imageSource ?'), 'RecipeStepsList branches on imageSource');
  assert(stepsList.includes('styles.textOnly'), 'RecipeStepsList text-only fallback');
});

run('toddler feed saves meal type when entering weekly', () => {
  const src = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(src.includes('saveToddlerWeeklyPlanLastMeal(mealType)'), 'saves current meal on weekly entry');
  assert(src.includes('TODDLER_MEALS_WEEKLY_HREF'), 'navigates to weekly route');
});

run('baby stage shared between feed and weekly only within baby', () => {
  const stageKey = read('services/babyFood/babyFoodFeedStageStorage.ts');
  assert(stageKey.includes('@hankki/baby_food_feed_stage'), 'baby stage key scoped');
  assert(!stageKey.includes('toddler'), 'baby stage key no toddler');
  assert(!stageKey.includes('elementary'), 'baby stage key no elementary');
});

console.log('\n--- summary ---');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('PASS — child meal planning integrated QA');
