/**
 * HANKKI v1.1 — toddler weekly plan QA.
 * Run: npm run test:toddler-weekly-plan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TODDLER_MEALS_WEEKLY_HREF } from '../constants/appRoutes';
import { toddlerWeeklyPlanCopy } from '../constants/toddlerWeeklyPlanCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  isEligibleToddlerMealFeedRecipe,
  listToddlerMealFeedRecipes,
  TODDLER_FEED_MEAL_TYPES,
} from '../data/recipes/toddlerMealFeed';
import {
  generateToddlerWeeklyPlan,
  isToddlerWeeklyPlanEligible,
  listToddlerWeeklyPlanCandidates,
  listToddlerWeeklyPlanMealCounts,
} from '../data/recipes/toddlerWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';
import {
  createToddlerWeeklyPlanSeed,
  isValidToddlerWeeklyPlan,
  parseToddlerWeeklyPlanState,
  TODDLER_WEEKLY_PLAN_STORAGE_KEYS,
} from '../services/weeklyPlan/toddlerWeeklyPlanStorage';
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

console.log('HANKKI v1.1 toddler weekly plan QA — start\n');

run('eligible counts breakfast 21 / lunch 19 / dinner 24 / snack 16', () => {
  const counts = listToddlerWeeklyPlanMealCounts();
  assert(counts.breakfast === 21, `breakfast 21 (got ${counts.breakfast})`);
  assert(counts.lunch === 19, `lunch 19 (got ${counts.lunch})`);
  assert(counts.dinner === 24, `dinner 24 (got ${counts.dinner})`);
  assert(counts.snack === 16, `snack 16 (got ${counts.snack})`);
  assert(
    counts.breakfast + counts.lunch + counts.dinner + counts.snack === 80,
    'slot sum 80 (6 snack↔breakfast dual)',
  );
  assert(listToddlerMealFeedRecipes().length === 74, 'feed total 74');
});

for (const mealType of TODDLER_FEED_MEAL_TYPES) {
  run(`${mealType} — eligible audit`, () => {
    const eligible = listToddlerWeeklyPlanCandidates(mealType);
    assert(eligible.length >= 7, `${mealType} >= 7 candidates`);
    assert(
      eligible.every((item) => item.recipe.familyAudience.audiences.includes('toddler')),
      'toddler audience',
    );
    assert(
      eligible.every((item) => !item.recipe.familyAudience.audiences.includes('baby')),
      'no baby mix',
    );
    assert(
      eligible.every((item) => item.recipe.familyAudience.reviewStatus === 'explicit'),
      'explicit only',
    );
    assert(
      eligible.every(
        (item) => item.recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'approved',
      ),
      'approved only',
    );
    assert(
      eligible.every((item) => isToddlerWeeklyPlanEligible(item.recipe, mealType)),
      'weekly eligible',
    );
    assert(
      eligible.every((item) => isEligibleToddlerMealFeedRecipe(item.recipe, mealType)),
      'feed eligible',
    );
    assert(
      eligible.every((item) => item.recipe.standardMetadata.mealTypes.includes(mealType)),
      'meal type match',
    );
  });

  run(`${mealType} — week generation seed 42`, () => {
    const result = generateToddlerWeeklyPlan(mealType, 42);
    assert(result.ok, `${mealType} generates`);
    if (!result.ok) return;
    const { plan } = result;
    assert(plan.audience === 'toddler', 'audience toddler');
    assert(plan.mealType === mealType, 'plan mealType');
    assert(plan.slots.length === 7, '7 slots');
    assert(
      plan.slots.every((slot, index) => slot.day === WEEKLY_PLAN_DAYS[index]),
      'MON–SUN',
    );
    assert(plan.slots.every((slot) => slot.mealType === mealType), 'slot mealType');
    const ids = plan.slots.map((slot) => slot.recipeId);
    assert(new Set(ids).size === 7, 'unique ids');
    assert(
      plan.slots.every((slot) => {
        const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
        return Boolean(recipe && isToddlerWeeklyPlanEligible(recipe, mealType));
      }),
      'slots eligible',
    );
  });

  run(`${mealType} — deterministic seed`, () => {
    const a = generateToddlerWeeklyPlan(mealType, 7);
    const b = generateToddlerWeeklyPlan(mealType, 7);
    assert(a.ok && b.ok, 'both generate');
    if (a.ok && b.ok) {
      assert(
        a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
        'same seed same week',
      );
    }
  });
}

run('refresh avoids identical plan best-effort', () => {
  const first = generateToddlerWeeklyPlan('dinner', 42);
  assert(first.ok, 'initial');
  if (!first.ok) return;
  const avoid = first.plan.slots.map((slot) => slot.recipeId);
  const second = generateToddlerWeeklyPlan('dinner', createToddlerWeeklyPlanSeed(), {
    avoidRecipeIds: avoid,
  });
  assert(second.ok, 'refresh ok');
});

run('mealType storage keys separated', () => {
  const keys = Object.values(TODDLER_WEEKLY_PLAN_STORAGE_KEYS);
  assert(keys.length === 4, '4 keys');
  assert(new Set(keys).size === 4, 'unique keys');
  assert(
    TODDLER_WEEKLY_PLAN_STORAGE_KEYS.breakfast === '@hankki/toddler_weekly_plan/breakfast',
    'breakfast key',
  );
});

run('parse stored toddler plan state', () => {
  const plan = generateToddlerWeeklyPlan('lunch', 42);
  assert(plan.ok, 'plan for parse');
  if (!plan.ok) return;
  const raw = JSON.stringify({
    version: 1,
    seed: plan.seed,
    mealType: 'lunch',
    plan: plan.plan,
  });
  assert(parseToddlerWeeklyPlanState(raw, 'lunch'), 'parses lunch');
  assert(!parseToddlerWeeklyPlanState(raw, 'dinner'), 'rejects dinner');
  assert(isValidToddlerWeeklyPlan(plan.plan, 'lunch'), 'valid plan');
});

run('wrong mealType recipe blocked cross-tab', () => {
  const breakfast = generateToddlerWeeklyPlan('breakfast', 42);
  const lunch = generateToddlerWeeklyPlan('lunch', 42);
  assert(breakfast.ok && lunch.ok, 'plans');
  if (!breakfast.ok || !lunch.ok) return;
  const crossPlan = {
    ...breakfast.plan,
    mealType: 'lunch' as const,
    slots: breakfast.plan.slots.map((s) => ({ ...s, mealType: 'lunch' as const })),
  };
  assert(!isValidToddlerWeeklyPlan(crossPlan, 'lunch'), 'breakfast recipes invalid for lunch plan');
});

run('routes UI wiring + analytics + copy', () => {
  assert(TODDLER_MEALS_WEEKLY_HREF === '/toddler-meals-week', 'legacy multi-meal route href');
  assert(read('app/toddler-meals-week.tsx').includes('ToddlerWeeklyPlanScreen'), 'legacy route file');
  assert(read('app/_layout.tsx').includes('toddler-meals-week'), 'layout legacy');
  assert(read('app/_layout.tsx').includes('toddler-breakfast-week'), 'layout breakfast week');
  assert(read('app/_layout.tsx').includes('toddler-dinner-week'), 'layout dinner week');
  const feed = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(
    feed.includes('TODDLER_BREAKFAST_WEEK_HREF') || feed.includes('TODDLER_MEALS_WEEKLY_HREF'),
    'feed weekly entry',
  );
  assert(read('components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx').includes("setRecipeOpenSource('toddler_meal_feed')"), 'detail source');
  assert(read('services/analytics/analyticsEvents.ts').includes('toddler_weekly_plan_view'), 'analytics');
  assert(toddlerWeeklyPlanCopy.screenTitle === '이번 주 유아식 메뉴', 'title');
  assert(toddlerWeeklyPlanCopy.guidanceLine.includes('알레르기'), 'safety guidance');
  const screen = read('components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx');
  assert(!screen.includes('toddlerSafetyReview'), 'no technical flags');
  assert(!screen.includes('needs_adaptation'), 'no enum exposure');
});

run('share card 1080x1350', () => {
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'width');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'height');
  assert(read('services/weeklyPlan/toddlerWeeklyPlanShare.ts').includes('captureWeeklyPlanShareCard'), 'share wrapper');
});

console.log('\n--- sample weeks seed 42 ---');
for (const mealType of TODDLER_FEED_MEAL_TYPES) {
  const sample = generateToddlerWeeklyPlan(mealType, 42);
  if (sample.ok) {
    console.log(`\n[${mealType}]`);
    for (const slot of sample.plan.slots) {
      console.log(`  ${slot.day} ${slot.recipeName} (${slot.recipeId}) ${slot.time}m`);
    }
  }
}

console.log('\n--- summary ---');
if (failed === 0) {
  console.log('PASS — toddler weekly plan QA');
  process.exit(0);
}
console.error(`FAIL — ${failed} assertion(s)`);
process.exit(1);
