/**
 * Sprint v1.1 #5 — elementary breakfast weekly plan UI QA.
 * Run: npm run test:weekly-plan-ui
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENTARY_BREAKFAST_WEEK_HREF } from '../constants/appRoutes';
import { northStarHomeCopy } from '../constants/northStarHomeCopy';
import { HOME_PURPOSES } from '../constants/homeIaCopy';
import {
  ELEMENTARY_BREAKFAST_WEEKDAY_KO,
  elementaryBreakfastWeeklyPlanCopy,
} from '../constants/elementaryBreakfastWeeklyPlanCopy';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';
import {
  createElementaryBreakfastWeekSeed,
  isValidElementaryBreakfastWeeklyPlan,
  parseElementaryBreakfastWeeklyPlanState,
} from '../services/weeklyPlan/elementaryBreakfastWeeklyPlanStorage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
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

console.log('Sprint v1.1 elementary breakfast weekly plan UI QA — start\n');

run('entry copy — weekly purpose exposes elementary breakfast', () => {
  const weeklyPurpose = HOME_PURPOSES.find((purpose) => purpose.id === 'weekly');
  const breakfast = weeklyPurpose?.entries?.find((entry) => entry.id === 'elemBreakfast');
  assert(Boolean(breakfast), 'breakfast week entry exists');
  assert(breakfast?.title.includes('초등'), 'home entry mentions elementary breakfast');
});

run('route and screen files exist', () => {
  assert(ELEMENTARY_BREAKFAST_WEEK_HREF === '/elementary-breakfast-week', 'canonical href');
  assert(fs.existsSync(path.join(ROOT, 'app/elementary-breakfast-week.tsx')), 'route file');
  assert(
    fs.existsSync(path.join(ROOT, 'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx')),
    'screen file',
  );
  const layout = read('app/_layout.tsx');
  assert(layout.includes('elementary-breakfast-week'), 'stack registers route');
});

run('home purpose panel — weekly opens breakfast week, kids opens browse', () => {
  const src = read('components/home/HomePurposeSubPanel.tsx');
  assert(src.includes('ELEMENTARY_BREAKFAST_WEEK_HREF') || src.includes('homeIaCopy'), 'breakfast week href');
  assert(src.includes('ELEMENTARY_BROWSE_HREF') || src.includes('homeIaCopy'), 'elementary browse href');
  assert(src.includes('elemBreakfast') || src.includes('elementary'), 'weekly/kids entries wired');
});

run('week display — Korean weekdays and required fields', () => {
  assert(ELEMENTARY_BREAKFAST_WEEKDAY_KO.MON === '월', '월');
  assert(ELEMENTARY_BREAKFAST_WEEKDAY_KO.SUN === '일', '일');
  assert(WEEKLY_PLAN_DAYS.length === 7, '7 days');
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(screen.includes('ElementaryWeeklyPlanDayCard'), 'uses shared day card');
  assert(screen.includes('ElementaryWeeklyMealSwitch'), 'meal type switch');
  assert(screen.includes('ElementaryWeeklyPlanFooter'), 'sticky footer');
  assert(screen.includes('resolveElementaryBreakfastSlotDisplay'), 'uses shared slot display');
  assert(screen.includes('copy.cookTime'), 'shows cook time');
  assert(screen.includes('ingredientHint'), 'shows main ingredients');
  assert(!screen.includes('ELEMENTARY_BROWSE_HREF'), 'browse chip removed from weekly screen');
  assert(!screen.includes('schoolMorningFriendly'), 'does not expose tech flag');
  assert(elementaryBreakfastWeeklyPlanCopy.screenTitle === '7일 식단', 'screen title');
  assert(elementaryBreakfastWeeklyPlanCopy.screenEyebrow.includes('아침'), 'screen eyebrow');
  assert(elementaryBreakfastWeeklyPlanCopy.saveImageButton === '이미지 저장', 'save CTA');
  assert(elementaryBreakfastWeeklyPlanCopy.shareButton === '공유하기', 'share CTA');
  assert(elementaryBreakfastWeeklyPlanCopy.refreshButton === '다른 일주일 추천', 'refresh copy');
});

run('recipe detail reuses existing recipe route', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(screen.includes('`/recipe/${slot.recipeId}`'), 'recipeId detail route');
  assert(!screen.includes('ElementaryBreakfastRecipeDetail'), 'no new detail screen');
});

run('refresh uses generator with a new seed and guards double tap', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(screen.includes('generateElementaryBreakfastWeek'), 'calls generator');
  assert(screen.includes('createElementaryBreakfastWeekSeed'), 'new seed on refresh');
  assert(screen.includes('inFlightRef'), 'in-flight guard');
  assert(screen.includes('disabled={busy}'), 'disables while loading');
  assert(screen.includes('Alert.alert'), 'safe error alert');
});

run('persistence round-trip of current week + seed', () => {
  const generated = generateElementaryBreakfastWeek(42);
  assert(generated.ok === true, 'seed 42 generates');
  if (!generated.ok) return;
  assert(isValidElementaryBreakfastWeeklyPlan(generated.plan), 'generated plan is valid');
  const serialized = JSON.stringify({
    version: 1,
    seed: generated.seed,
    plan: generated.plan,
  });
  const parsed = parseElementaryBreakfastWeeklyPlanState(serialized);
  assert(parsed?.seed === generated.seed, 'seed restored');
  assert(parsed?.plan.slots.length === 7, '7 slots restored');
  assert(
    parsed?.plan.slots.map((slot) => slot.recipeId).join(',') ===
      generated.plan.slots.map((slot) => slot.recipeId).join(','),
    'recipe ids restored',
  );
  assert(parseElementaryBreakfastWeeklyPlanState('not-json') === null, 'invalid json ignored');
  assert(createElementaryBreakfastWeekSeed().length > 0, 'seed helper');
});

run('generated week has unique ids and no crash without images', () => {
  const generated = generateElementaryBreakfastWeek('ui-qa');
  assert(generated.ok === true, 'ui-qa seed generates');
  if (!generated.ok) return;
  const ids = generated.plan.slots.map((slot) => slot.recipeId);
  assert(new Set(ids).size === 7, 'unique recipe ids');
  assert(
    generated.plan.slots.every((slot) => WEEKLY_PLAN_DAYS.includes(slot.day)),
    'days are MON-SUN',
  );
});

run('home recommendation flow is not imported', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const comingSoon = read('components/home/HomeComingSoonSection.tsx');
  const purposePanel = read('components/home/HomePurposeSubPanel.tsx');
  const home = read('components/home/HomeScreen.tsx');
  assert(!screen.includes('getMealTimeSlotHomeRecommendation'), 'weekly UI not wired to home rec');
  assert(!screen.includes('recommendationEngine'), 'no home engine');
  assert(!comingSoon.includes('generateElementaryBreakfastWeek'), 'coming soon does not generate');
  assert(!purposePanel.includes('generateElementaryBreakfastWeek'), 'purpose panel does not generate');
  assert(!home.includes('generateElementaryBreakfastWeek'), 'HomeScreen does not generate');
  assert(home.includes('<TodayMealCard'), 'home rec card still present');
});

run('analytics wrapper only, structured params', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(screen.includes('trackElementaryWeeklyPlanView'), 'view event');
  assert(screen.includes("mode: 'breakfast'"), 'breakfast analytics mode');
  assert(screen.includes('trackElementaryWeeklyPlanRefresh'), 'refresh event');
  assert(screen.includes('trackElementaryWeeklyPlanRecipeClick'), 'click event');
  assert(screen.includes("setRecipeOpenSource('kids_weekly_plan')"), 'recipe open source');
  assert(!screen.includes('@react-native-firebase/analytics'), 'no direct firebase');
  assert(screen.includes('recipe_id: slot.recipeId'), 'click payload uses recipeId');
  assert(screen.includes('seed: plan.seed'), 'click payload uses seed');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — elementary breakfast weekly plan UI');
