/**
 * HANKKI v1.1 — Child route static audit (pre device QA).
 * Run: npx tsx scripts/test-child-route-audit.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BABY_FOOD_BATCH_HREF,
  BABY_FOOD_BATCH_RESULT_HREF,
  BABY_FOOD_HREF,
  BABY_FOOD_WEEKLY_HREF,
  ELEMENTARY_BROWSE_HREF,
  ELEMENTARY_BREAKFAST_WEEK_HREF,
  ELEMENTARY_DINNER_WEEK_HREF,
  TODDLER_MEALS_HREF,
  TODDLER_MEALS_WEEKLY_HREF,
} from '../constants/appRoutes';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
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
    console.log(`✅ ${name}\n`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function routePath(href: string): string {
  return href.replace(/^\//, '');
}

const CHILD_ROUTES = [
  { href: BABY_FOOD_HREF, appFile: 'app/baby-food.tsx', screen: 'BabyFoodFeedScreen' },
  { href: BABY_FOOD_WEEKLY_HREF, appFile: 'app/baby-food-week.tsx', screen: 'BabyFoodWeeklyPlanScreen' },
  { href: BABY_FOOD_BATCH_HREF, appFile: 'app/baby-food-batch.tsx', screen: 'BabyBatchCookingSelectScreen' },
  {
    href: BABY_FOOD_BATCH_RESULT_HREF,
    appFile: 'app/baby-food-batch-result.tsx',
    screen: 'BabyBatchCookingResultScreen',
  },
  { href: TODDLER_MEALS_HREF, appFile: 'app/toddler-meals.tsx', screen: 'ToddlerMealFeedScreen' },
  {
    href: TODDLER_MEALS_WEEKLY_HREF,
    appFile: 'app/toddler-meals-week.tsx',
    screen: 'ToddlerWeeklyPlanScreen',
  },
  { href: ELEMENTARY_BROWSE_HREF, appFile: 'app/elementary-browse.tsx', screen: 'ElementaryBrowseScreen' },
  {
    href: ELEMENTARY_BREAKFAST_WEEK_HREF,
    appFile: 'app/elementary-breakfast-week.tsx',
    screen: 'ElementaryBreakfastWeeklyPlanScreen',
  },
  {
    href: ELEMENTARY_DINNER_WEEK_HREF,
    appFile: 'app/elementary-dinner-week.tsx',
    screen: 'ElementaryDinnerWeeklyPlanScreen',
  },
] as const;

console.log('HANKKI child route audit — start\n');

run('Stack registers all child routes', () => {
  const layout = read('app/_layout.tsx');
  for (const route of CHILD_ROUTES) {
    assert(layout.includes(`name="${routePath(route.href)}"`), `stack ${route.href}`);
  }
});

run('Route files mount expected screens', () => {
  for (const route of CHILD_ROUTES) {
    const src = read(route.appFile);
    assert(fs.existsSync(path.join(ROOT, route.appFile)), `${route.appFile} exists`);
    assert(src.includes(route.screen), `${route.appFile} → ${route.screen}`);
  }
});

run('Child screens have back navigation fallback', () => {
  const checks: Array<{ file: string; need: string[] }> = [
    {
      file: 'components/babyFood/BabyFoodFeedScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/babyFood/BabyFoodWeeklyPlanScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/babyFood/BabyBatchCookingSelectScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'BABY_FOOD_WEEKLY_HREF'],
    },
    {
      file: 'components/babyFood/BabyBatchCookingResultScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'BABY_FOOD_WEEKLY_HREF', 'emptyPlanTitle'],
    },
    {
      file: 'components/toddlerMeals/ToddlerMealFeedScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/elementary/ElementaryBrowseScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
    {
      file: 'components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx',
      need: ['ScreenBackButton', 'fallbackHref', 'APP_HOME_HREF'],
    },
  ];
  for (const { file, need } of checks) {
    const src = read(file);
    for (const token of need) {
      assert(src.includes(token), `${file} has ${token}`);
    }
  }
});

run('Batch result handles missing in-memory session', () => {
  const src = read('components/babyFood/BabyBatchCookingResultScreen.tsx');
  assert(src.includes('getBabyBatchCookingSession'), 'reads session');
  assert(src.includes('getBabyBatchCookingResult'), 'reads result');
  assert(src.includes('if (!result || !session)'), 'empty fallback guard');
  assert(src.includes('router.replace(BABY_FOOD_BATCH_HREF)'), 'redirect to select');
});

run('Child routes do not require URL params', () => {
  for (const route of CHILD_ROUTES) {
    const src = read(route.appFile);
    assert(!src.includes('useLocalSearchParams'), `${route.appFile} no required params`);
  }
});

if (failed > 0) {
  console.error(`FAIL — ${failed}`);
  process.exit(1);
}
console.log('PASS — child route audit');
