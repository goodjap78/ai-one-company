/**
 * Sprint v1.1 #4 — elementary breakfast weekly plan QA.
 * Run: npm run test:weekly-plan
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  classifyWeeklyPlanDiversity,
  generateElementaryBreakfastWeek,
  listElementaryBreakfastWeekCandidates,
} from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Sprint v1.1 elementary breakfast weekly plan QA — start\n');

const eligible = listElementaryBreakfastWeekCandidates();
assert(eligible.length >= 7, `eligible candidates >= 7 (got ${eligible.length})`);
assert(
  eligible.every((item) => item.recipe.familyAudience.audiences.includes('elementary')),
  'every candidate is elementary',
);
assert(
  eligible.every((item) => item.recipe.familyAudience.reviewStatus === 'explicit'),
  'every candidate is explicit',
);
assert(
  eligible.every((item) => item.recipe.standardMetadata.mealTypes.includes('breakfast')),
  'every candidate is breakfast',
);
assert(
  eligible.every((item) => !item.recipe.familyAudience.safetySignals.isSideDish),
  'no side-dish-only candidates',
);
assert(
  eligible.every(
    (item) =>
      !item.recipe.familyAudience.collisionFlags.some((flag) =>
        ['spicy', 'hangover', 'drinking_snack', 'late_night', 'side_dish'].includes(flag),
      ),
  ),
  'no collision-flagged candidates',
);

const riceBall = eligible.find((item) => item.recipe.id === 'recipe_0306');
assert(Boolean(riceBall) && riceBall?.formGroup === 'rice_ball', '참치계란주먹밥 is rice_ball');
const toast = eligible.find((item) => item.recipe.id === 'recipe_0173');
assert(Boolean(toast) && toast?.formGroup === 'sandwich_toast', '햄치즈토스트 is sandwich_toast');
const cereal = eligible.find((item) => item.recipe.id === 'recipe_0312');
assert(
  Boolean(cereal) && cereal?.diversityCategory === 'oatmeal_cereal',
  '바나나우유시리얼 is oatmeal_cereal',
);

const result = generateElementaryBreakfastWeek(42);
assert(result.ok, `week generates for seed 42 (status ${result.status})`);
if (result.ok) {
  const { plan } = result;
  assert(plan.slots.length === 7, `week has 7 slots (got ${plan.slots.length})`);
  assert(
    plan.slots.every((slot, index) => slot.day === WEEKLY_PLAN_DAYS[index]),
    'slots are MON–SUN in order',
  );
  assert(
    plan.slots.every((slot) => slot.mealType === 'breakfast'),
    'every slot is breakfast',
  );
  const ids = plan.slots.map((slot) => slot.recipeId);
  assert(new Set(ids).size === ids.length, 'recipeId duplicates = 0');

  const forms = plan.slots.map((slot) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
    return recipe ? classifyWeeklyPlanDiversity(recipe).formGroup : 'other';
  });
  let toastStreak = 0;
  let riceBallStreak = 0;
  for (let i = 1; i < forms.length; i += 1) {
    if (forms[i] === 'sandwich_toast' && forms[i - 1] === 'sandwich_toast') toastStreak += 1;
    if (forms[i] === 'rice_ball' && forms[i - 1] === 'rice_ball') riceBallStreak += 1;
  }
  assert(toastStreak === 0, 'toast/sandwich consecutive = 0');
  assert(riceBallStreak === 0, 'rice-ball consecutive = 0');

  assert(
    plan.slots.every((slot) => {
      const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
      return Boolean(recipe && recipe.familyAudience.audiences.includes('elementary'));
    }),
    'no non-elementary recipes',
  );
  assert(
    plan.slots.every((slot) => {
      const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
      return Boolean(recipe && recipe.standardMetadata.mealTypes.includes('breakfast'));
    }),
    'no non-breakfast recipes',
  );
  assert(
    plan.slots.every((slot) => {
      const recipe = HANKKI_RECIPES.find((item) => item.id === slot.recipeId);
      return Boolean(
        recipe &&
          !recipe.familyAudience.collisionFlags.some((flag) =>
            ['spicy', 'hangover', 'drinking_snack', 'late_night', 'side_dish'].includes(flag),
          ),
      );
    }),
    'collision recipes in week = 0',
  );
  assert(
    plan.slots.every((slot) => slot.recipeName.trim().length > 0 && slot.time > 0),
    'each slot has recipeName and time',
  );

  const categories = plan.slots.map((slot) => slot.diversityCategory);
  const riceCount = categories.filter((item) => item === 'rice').length;
  const breadCount = categories.filter((item) => item === 'bread').length;
  const oatmealCount = categories.filter((item) => item === 'oatmeal_cereal').length;
  const otherCount = categories.filter((item) => item === 'other').length;
  const schoolMorningCount = plan.slots.filter((slot) => slot.schoolMorningFriendly === true).length;
  const poolHasOatmeal = eligible.some((item) => item.diversityCategory === 'oatmeal_cereal');
  const poolHasOther = eligible.some((item) => item.diversityCategory === 'other');
  assert(schoolMorningCount <= 4, `seed 42 schoolMorningFriendly=true <= 4 (got ${schoolMorningCount})`);
  assert(riceCount <= 3, `seed 42 rice <= 3 (got ${riceCount})`);
  assert(breadCount <= 3, `seed 42 bread <= 3 (got ${breadCount})`);
  assert(!poolHasOatmeal || oatmealCount >= 1, 'seed 42 includes oatmeal_cereal when candidates exist');
  assert(!poolHasOther || otherCount >= 1, 'seed 42 includes other when candidates exist');
}

const again = generateElementaryBreakfastWeek(42);
assert(again.ok && result.ok, 'second seed-42 run succeeds');
if (again.ok && result.ok) {
  assert(
    JSON.stringify(again.plan.slots.map((slot) => slot.recipeId)) ===
      JSON.stringify(result.plan.slots.map((slot) => slot.recipeId)),
    'same seed is deterministic',
  );
}

const otherSeeds = [1, 7, 99, 2026, 'reroll-a', 'reroll-b'].map((seed) =>
  generateElementaryBreakfastWeek(seed),
);
assert(
  otherSeeds.every((item) => item.ok),
  'alternate seeds also generate',
);
if (result.ok) {
  const baseline = result.plan.slots.map((slot) => slot.recipeId).join('|');
  const changed = otherSeeds.some(
    (item) => item.ok && item.plan.slots.map((slot) => slot.recipeId).join('|') !== baseline,
  );
  assert(changed, 'a different seed can change the week');
}

const shortPool = HANKKI_RECIPES.filter((recipe) =>
  eligible.slice(0, 6).some((item) => item.recipe.id === recipe.id),
);
const insufficient = generateElementaryBreakfastWeek('too-few', shortPool);
assert(insufficient.ok === false, 'under-7 pool fails');
assert(
  insufficient.status === 'INSUFFICIENT_CANDIDATES',
  'under-7 pool returns INSUFFICIENT_CANDIDATES',
);
assert(insufficient.eligibleCount === 6, `fail-safe eligibleCount is 6 (got ${insufficient.eligibleCount})`);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

function formatWeek(label: string, week: ReturnType<typeof generateElementaryBreakfastWeek>): string {
  if (!week.ok) return `${label}: ${week.status} eligible=${week.eligibleCount}`;
  const categories = week.plan.slots.map((slot) => slot.diversityCategory);
  const schoolMorning = week.plan.slots.filter((slot) => slot.schoolMorningFriendly === true).length;
  const counts = `rice=${categories.filter((item) => item === 'rice').length} bread=${categories.filter((item) => item === 'bread').length} oatmeal=${categories.filter((item) => item === 'oatmeal_cereal').length} other=${categories.filter((item) => item === 'other').length} schoolMorning=${schoolMorning}`;
  const lines = week.plan.slots
    .map(
      (slot) =>
        `  ${slot.day} ${slot.recipeName} (${slot.recipeId}) ${slot.time}m ${slot.diversityCategory} schoolMorning=${slot.schoolMorningFriendly}`,
    )
    .join('\n');
  return `${label}\n${counts}\n${lines}`;
}

console.log('\nSprint v1.1 elementary breakfast weekly plan QA — pass');
if (result.ok) {
  console.log(`eligible: ${result.eligibleCount}`);
  console.log(formatWeek('sample week (seed 42):', result));
  for (const seed of [1, 7, 99]) {
    console.log(formatWeek(`compare seed ${seed}:`, generateElementaryBreakfastWeek(seed)));
  }
}
