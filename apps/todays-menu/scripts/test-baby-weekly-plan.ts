/**
 * HANKKI v1.1 — baby food weekly plan QA.
 * Run: npm run test:baby-weekly-plan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BABY_FOOD_WEEKLY_HREF } from '../constants/appRoutes';
import { babyWeeklyPlanCopy } from '../constants/babyWeeklyPlanCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  BABY_FOOD_FEED_STAGES,
  isEligibleBabyFoodFeedRecipe,
} from '../data/recipes/babyFoodFeed';
import {
  generateBabyWeeklyPlan,
  isBabyWeeklyPlanEligible,
  listBabyWeeklyPlanCandidates,
  listBabyWeeklyPlanStageCounts,
} from '../data/recipes/babyWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';
import {
  BABY_WEEKLY_PLAN_STORAGE_KEYS,
  createBabyWeeklyPlanSeed,
  isValidBabyWeeklyPlan,
  parseBabyWeeklyPlanState,
} from '../services/weeklyPlan/babyWeeklyPlanStorage';
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

console.log('HANKKI v1.1 baby weekly plan QA — start\n');

run('stage candidate counts early 17 / middle 17 / late 17 / completion 19', () => {
  const counts = listBabyWeeklyPlanStageCounts();
  assert(counts.early === 17, `early 17 (got ${counts.early})`);
  assert(counts.middle === 17, `middle 17 (got ${counts.middle})`);
  assert(counts.late === 17, `late 17 (got ${counts.late})`);
  assert(counts.completion === 19, `completion 19 (got ${counts.completion})`);
  assert(
    counts.early + counts.middle + counts.late + counts.completion === 70,
    'total eligible 70',
  );
});

for (const stage of BABY_FOOD_FEED_STAGES) {
  run(`${stage} — eligible audit`, () => {
    const eligible = listBabyWeeklyPlanCandidates(stage);
    assert(eligible.length >= 7, `${stage} has >= 7 candidates`);
    assert(
      eligible.every((item) => item.recipe.familyAudience.audiences.includes('baby')),
      `${stage} baby audience only`,
    );
    assert(
      eligible.every((item) => item.recipe.familyAudience.reviewStatus === 'explicit'),
      `${stage} explicit only`,
    );
    assert(
      eligible.every(
        (item) => item.recipe.familyAudience.babySafetyReview?.reviewStatus === 'approved',
      ),
      `${stage} approved only`,
    );
    assert(
      eligible.every((item) => isBabyWeeklyPlanEligible(item.recipe, stage)),
      `${stage} weekly eligibility`,
    );
    assert(
      eligible.every((item) => isEligibleBabyFoodFeedRecipe(item.recipe, stage)),
      `${stage} feed eligibility`,
    );
    assert(
      eligible.every((item) => item.recipe.familyAudience.babyFood?.stage === stage),
      `${stage} stage match`,
    );
  });

  run(`${stage} — week generation seed 42`, () => {
    const result = generateBabyWeeklyPlan(stage, 42);
    assert(result.ok, `${stage} generates (status ${result.status})`);
    if (!result.ok) return;
    const { plan } = result;
    assert(plan.audience === 'baby', `${stage} audience baby`);
    assert(plan.babyStage === stage, `${stage} babyStage`);
    assert(plan.slots.length === 7, `${stage} 7 slots`);
    assert(
      plan.slots.every((slot, index) => slot.day === WEEKLY_PLAN_DAYS[index]),
      `${stage} MON–SUN order`,
    );
    const ids = plan.slots.map((slot) => slot.recipeId);
    assert(new Set(ids).size === 7, `${stage} unique recipeIds`);
    assert(
      plan.slots.every((slot) => {
        const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
        return Boolean(recipe && isBabyWeeklyPlanEligible(recipe, stage));
      }),
      `${stage} all slots weekly-eligible`,
    );
  });

  run(`${stage} — deterministic seed`, () => {
    const a = generateBabyWeeklyPlan(stage, 7);
    const b = generateBabyWeeklyPlan(stage, 7);
    assert(a.ok && b.ok, `${stage} both generate`);
    if (a.ok && b.ok) {
      assert(
        a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
        `${stage} same seed → same week`,
      );
    }
  });
}

run('refresh avoids identical plan best-effort', () => {
  const first = generateBabyWeeklyPlan('early', 42);
  assert(first.ok, 'initial plan');
  if (!first.ok) return;
  const avoid = first.plan.slots.map((slot) => slot.recipeId);
  const second = generateBabyWeeklyPlan('early', createBabyWeeklyPlanSeed(), { avoidRecipeIds: avoid });
  assert(second.ok, 'refresh generates');
  if (!second.ok) return;
  const same =
    first.plan.slots.map((s) => s.recipeId).join(',') ===
    second.plan.slots.map((s) => s.recipeId).join(',');
  assert(!same || avoid.length < 7, 'refresh differs when possible');
});

run('stage-scoped persistence keys', () => {
  assert(BABY_WEEKLY_PLAN_STORAGE_KEYS.early === '@hankki/baby_weekly_plan/early', 'early key');
  assert(BABY_WEEKLY_PLAN_STORAGE_KEYS.middle === '@hankki/baby_weekly_plan/middle', 'middle key');
  assert(BABY_WEEKLY_PLAN_STORAGE_KEYS.late === '@hankki/baby_weekly_plan/late', 'late key');
  assert(
    BABY_WEEKLY_PLAN_STORAGE_KEYS.completion === '@hankki/baby_weekly_plan/completion',
    'completion key',
  );
  const keys = Object.values(BABY_WEEKLY_PLAN_STORAGE_KEYS);
  assert(new Set(keys).size === 4, 'keys are unique');
});

run('parse stored baby weekly state', () => {
  const generated = generateBabyWeeklyPlan('middle', 42);
  assert(generated.ok, 'plan for parse');
  if (!generated.ok) return;
  const raw = JSON.stringify({
    version: 1,
    seed: generated.seed,
    stage: 'middle',
    plan: generated.plan,
  });
  const parsed = parseBabyWeeklyPlanState(raw, 'middle');
  assert(Boolean(parsed), 'parses valid state');
  assert(isValidBabyWeeklyPlan(generated.plan, 'middle'), 'valid plan');
  const wrongStage = parseBabyWeeklyPlanState(raw, 'early');
  assert(!wrongStage, 'rejects wrong stage');
});

run('routes UI wiring + analytics + copy', () => {
  assert(BABY_FOOD_WEEKLY_HREF === '/baby-food-week', 'route href');
  assert(read('app/baby-food-week.tsx').includes('BabyFoodWeeklyPlanScreen'), 'route file');
  assert(read('app/_layout.tsx').includes('baby-food-week'), 'layout route');
  assert(read('components/babyFood/BabyFoodFeedScreen.tsx').includes('BABY_FOOD_WEEKLY_HREF'), 'feed entry');
  assert(read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx').includes('BABY_FOOD_HREF'), 'weekly → feed link');
  assert(read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx').includes("setRecipeOpenSource('baby_food_feed')"), 'detail source');
  assert(read('services/analytics/analyticsEvents.ts').includes('baby_weekly_plan_view'), 'analytics view');
  assert(babyWeeklyPlanCopy.screenTitle === '이번 주 이유식 메뉴', 'screen title');
  assert(babyWeeklyPlanCopy.refreshButton === '다른 일주일 골라보기', 'refresh label');
  assert(
    babyWeeklyPlanCopy.guidanceLines.some((line) => line.includes('이미 먹어본 재료')),
    'non-prescriptive guidance',
  );
  const screen = read('components/babyFood/BabyFoodWeeklyPlanScreen.tsx');
  assert(!screen.includes('fully_cooked_required'), 'no internal enum on screen');
  assert(!screen.includes('thin_puree'), 'no texture enum on screen');
});

run('share card reuses 1080x1350 layout', () => {
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'width 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'height 1350');
  assert(
    read('components/elementaryWeekly/ElementaryWeeklyPlanShareCard.tsx').includes('shareCardStageLine'),
    'stage line on share card',
  );
  assert(read('services/weeklyPlan/babyWeeklyPlanShare.ts').includes('captureWeeklyPlanShareCard'), 'share wrapper');
});

console.log('\n--- sample weeks seed 42 ---');
for (const stage of BABY_FOOD_FEED_STAGES) {
  const sample = generateBabyWeeklyPlan(stage, 42);
  if (sample.ok) {
    console.log(`\n[${stage}]`);
    for (const slot of sample.plan.slots) {
      console.log(`  ${slot.day} ${slot.recipeName} (${slot.recipeId}) ${slot.time}m`);
    }
  }
}

console.log('\n--- summary ---');
if (failed === 0) {
  console.log('PASS — baby weekly plan QA');
  process.exit(0);
}
console.error(`FAIL — ${failed} assertion(s)`);
process.exit(1);
