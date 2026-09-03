/**
 * HANKKI v1.1 — elementary dinner weekly plan QA.
 * Run: npm run test:elementary-dinner-weekly-plan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENTARY_DINNER_WEEK_HREF } from '../constants/appRoutes';
import { elementaryDinnerWeeklyPlanCopy } from '../constants/elementaryDinnerWeeklyPlanCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  classifyDinnerWeeklyForm,
  generateElementaryDinnerWeek,
  isElementaryDinnerWeekEligible,
  listElementaryDinnerWeekCandidates,
} from '../data/recipes/elementaryDinnerWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';
import {
  ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY,
} from '../services/weeklyPlan/elementaryBreakfastWeeklyPlanStorage';
import {
  ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY,
  createElementaryDinnerWeekSeed,
  isValidElementaryDinnerWeeklyPlan,
  parseElementaryDinnerWeeklyPlanState,
} from '../services/weeklyPlan/elementaryDinnerWeeklyPlanStorage';
import {
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';

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

console.log('HANKKI v1.1 elementary dinner weekly plan QA — start\n');

run('dinner eligible candidate audit', () => {
  const eligible = listElementaryDinnerWeekCandidates();
  assert(eligible.length >= 10, `eligible >= 10 (got ${eligible.length})`);
  assert(eligible.length >= 27, `eligible >= 27 (got ${eligible.length})`);
  assert(
    eligible.every((item) => item.recipe.familyAudience.audiences.includes('elementary')),
    'every candidate is elementary',
  );
  assert(
    eligible.every((item) => item.recipe.familyAudience.reviewStatus === 'explicit'),
    'every candidate is explicit',
  );
  assert(
    eligible.every((item) => item.recipe.standardMetadata.mealTypes.includes('dinner')),
    'every candidate is dinner',
  );
});

run('week generation — seed 42', () => {
  const result = generateElementaryDinnerWeek(42);
  assert(result.ok, `generates (status ${result.status})`);
  if (!result.ok) return;
  const { plan } = result;
  assert(plan.slots.length === 7, '7 slots');
  assert(
    plan.slots.every((slot, index) => slot.day === WEEKLY_PLAN_DAYS[index]),
    'MON–SUN order',
  );
  assert(plan.slots.every((slot) => slot.mealType === 'dinner'), 'dinner only');
  const ids = plan.slots.map((slot) => slot.recipeId);
  assert(new Set(ids).size === 7, 'unique recipeIds');
  assert(
    plan.slots.every((slot) => {
      const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
      return Boolean(recipe && isElementaryDinnerWeekEligible(recipe!));
    }),
    'all slots dinner-eligible',
  );

  let riceBowlStreak = 0;
  let friedRiceStreak = 0;
  const forms = plan.slots.map((slot) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId)!;
    return classifyDinnerWeeklyForm(recipe);
  });
  for (let i = 1; i < forms.length; i += 1) {
    if (forms[i] === 'rice_bowl' && forms[i - 1] === 'rice_bowl') riceBowlStreak += 1;
    if (forms[i] === 'fried_rice' && forms[i - 1] === 'fried_rice') friedRiceStreak += 1;
  }
  assert(riceBowlStreak === 0, 'no consecutive rice_bowl');
  assert(friedRiceStreak === 0, 'no consecutive fried_rice');
});

run('deterministic seed + refresh seed helper', () => {
  const a = generateElementaryDinnerWeek(7);
  const b = generateElementaryDinnerWeek(7);
  assert(a.ok && b.ok, 'both generate');
  if (a.ok && b.ok) {
    assert(
      a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
      'same seed → same week',
    );
  }
  const refreshSeed = createElementaryDinnerWeekSeed();
  assert(refreshSeed.includes('-'), 'refresh seed format');
});

run('persistence keys separated from breakfast', () => {
  assert(
    ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY === '@hankki/elementary_dinner_weekly_plan',
    'dinner storage key',
  );
  assert(
    ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY === '@hankki/elementary_breakfast_weekly_plan',
    'breakfast storage key unchanged',
  );
  assert(
    ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY !== ELEMENTARY_BREAKFAST_WEEKLY_PLAN_STORAGE_KEY,
    'keys differ',
  );
});

run('dinner plan validation rejects breakfast mealType', () => {
  const dinner = generateElementaryDinnerWeek(42);
  assert(dinner.ok, 'dinner plan ok');
  if (!dinner.ok) return;
  assert(isValidElementaryDinnerWeeklyPlan(dinner.plan), 'valid dinner plan');
  const breakfastPlan = { ...dinner.plan, mealType: 'breakfast' as const };
  assert(!isValidElementaryDinnerWeeklyPlan(breakfastPlan), 'breakfast mealType rejected');
});

run('parse stored dinner state', () => {
  const dinner = generateElementaryDinnerWeek(42);
  assert(dinner.ok, 'plan for parse');
  if (!dinner.ok) return;
  const raw = JSON.stringify({ version: 1, seed: dinner.seed, plan: dinner.plan });
  const parsed = parseElementaryDinnerWeeklyPlanState(raw);
  assert(Boolean(parsed), 'parses valid state');
});

run('routes UI wiring + analytics mode', () => {
  assert(ELEMENTARY_DINNER_WEEK_HREF === '/elementary-dinner-week', 'route href');
  assert(read('app/elementary-dinner-week.tsx').includes('ElementaryDinnerWeeklyPlanScreen'), 'route file');
  assert(read('app/_layout.tsx').includes('elementary-dinner-week'), 'layout route');
  assert(read('components/elementary/ElementaryBrowseScreen.tsx').includes('ELEMENTARY_DINNER_WEEK_HREF'), 'browse dinner entry');
  assert(read('components/elementary/ElementaryBrowseScreen.tsx').includes('ELEMENTARY_BREAKFAST_WEEK_HREF'), 'browse breakfast entry');
  assert(read('services/analytics/analyticsEvents.ts').includes('mode: AnalyticsElementaryWeeklyPlanMode'), 'analytics mode type');
  assert(read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx').includes("mode: 'dinner'"), 'dinner analytics mode');
});

run('share card dimensions 1080x1350', () => {
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'width 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'height 1350');
  assert(read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx').includes('ElementaryWeeklyShareCard'), 'elementary share card');
  assert(read('components/elementaryWeekly/ElementaryWeeklyPlanShareCard.tsx').includes('ElementaryWeeklyPlanShareCard'), 'legacy share card for baby/toddler');
  assert(elementaryDinnerWeeklyPlanCopy.shareCardTitle.includes('저녁'), 'dinner share title');
});

console.log('\n--- sample week seed 42 ---');
const sample = generateElementaryDinnerWeek(42);
if (sample.ok) {
  for (const slot of sample.plan.slots) {
    console.log(`  ${slot.day} ${slot.recipeName} (${slot.recipeId}) ${slot.time}m`);
  }
}

console.log('\n--- summary ---');
if (failed === 0) {
  console.log('PASS — elementary dinner weekly plan QA');
  process.exit(0);
}
console.error(`FAIL — ${failed} assertion(s)`);
process.exit(1);
