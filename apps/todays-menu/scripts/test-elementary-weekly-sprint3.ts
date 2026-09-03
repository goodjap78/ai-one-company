/**
 * HANKKI v1.1 Sprint 3 — elementary weekly 14-day + avoidRecipeIds QA.
 * Run: npx tsx scripts/test-elementary-weekly-sprint3.ts
 */
import {
  generateElementaryBreakfastWeek,
  listElementaryBreakfastWeekCandidates,
} from '../data/recipes/elementaryBreakfastWeeklyPlan';
import {
  generateElementaryDinnerWeek,
  listElementaryDinnerWeekCandidates,
} from '../data/recipes/elementaryDinnerWeeklyPlan';
import { ELEMENTARY_DINNER_PROMOTED_RECIPE_IDS } from '../data/recipes/elementaryDinnerPoolPromotions';
import { ELEMENTARY_WEEKLY_EXCLUDED_RECIPE_IDS } from '../data/recipes/elementaryWeeklyPlanExclusions';
import { weekOverlapsAvoid } from '../data/recipes/elementaryWeeklyPlanCommon';

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

function test14Day(
  label: string,
  generate: (
    seed?: string | number,
    recipes?: readonly never[],
    options?: { avoidRecipeIds?: readonly string[] },
  ) => { ok: boolean; plan?: { slots: { recipeId: string }[] }; seed?: string },
): { success: number; duplicate: number; fallback: number; fail: number } {
  let success = 0;
  let duplicate = 0;
  let fallback = 0;
  let fail = 0;
  const seeds = 200;

  for (let i = 0; i < seeds; i += 1) {
    const w1 = generate(`s3-${label}-w1-${i}`);
    if (!w1.ok || !w1.plan) {
      fail += 1;
      continue;
    }
    const ids1 = w1.plan.slots.map((s) => s.recipeId);
    const w2 = generate(`s3-${label}-w2-${i}`, undefined, { avoidRecipeIds: ids1 });
    if (!w2.ok || !w2.plan) {
      fail += 1;
      continue;
    }
    if (w2.seed?.includes(':fallback')) fallback += 1;
    const ids2 = w2.plan.slots.map((s) => s.recipeId);
    if (weekOverlapsAvoid(ids2, ids1)) duplicate += 1;
    const all = [...ids1, ...ids2];
    if (new Set(all).size === 14) success += 1;
  }

  console.log(
    `  ${label}: success=${success}/${seeds} duplicate_overlap=${duplicate} fallback=${fallback} fail=${fail}`,
  );
  return { success, duplicate, fallback, fail };
}

console.log('HANKKI Sprint 3 elementary weekly QA — start\n');

run('dinner pool expanded', () => {
  const pool = listElementaryDinnerWeekCandidates();
  assert(pool.length >= 27, `dinner pool >= 27 (got ${pool.length})`);
  assert(
    ELEMENTARY_DINNER_PROMOTED_RECIPE_IDS.length === 10,
    `10 dinner promotions configured`,
  );
});

run('weekly exclusion — recipe_0512 not in pools', () => {
  const dinner = listElementaryDinnerWeekCandidates();
  const breakfast = listElementaryBreakfastWeekCandidates();
  assert(
    !dinner.some((item) => item.recipe.id === 'recipe_0512'),
    '0512 excluded from dinner weekly',
  );
  assert(
    !breakfast.some((item) => item.recipe.id === 'recipe_0512'),
    '0512 excluded from breakfast weekly',
  );
  assert(ELEMENTARY_WEEKLY_EXCLUDED_RECIPE_IDS.includes('recipe_0512'), 'exclusion list documents 0512');
});

run('avoidRecipeIds — week2 does not reuse week1 ids', () => {
  const w1 = generateElementaryDinnerWeek('avoid-test-1');
  assert(w1.ok && w1.plan, 'week1 generates');
  if (!w1.ok || !w1.plan) return;
  const ids1 = w1.plan.slots.map((s) => s.recipeId);
  const w2 = generateElementaryDinnerWeek('avoid-test-2', undefined, { avoidRecipeIds: ids1 });
  assert(w2.ok && w2.plan, 'week2 generates with avoid');
  if (!w2.ok || !w2.plan) return;
  const ids2 = w2.plan.slots.map((s) => s.recipeId);
  assert(!weekOverlapsAvoid(ids2, ids1), 'no overlap between weeks');
});

run('deterministic seed preserved (no avoid)', () => {
  const a = generateElementaryDinnerWeek(42);
  const b = generateElementaryDinnerWeek(42);
  assert(a.ok && b.ok, 'both generate');
  if (a.ok && b.ok) {
    assert(
      a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
      'same seed → same dinner week',
    );
  }
  const ba = generateElementaryBreakfastWeek(42);
  const bb = generateElementaryBreakfastWeek(42);
  assert(ba.ok && bb.ok, 'breakfast both generate');
  if (ba.ok && bb.ok) {
    assert(
      ba.plan.slots.map((s) => s.recipeId).join(',') === bb.plan.slots.map((s) => s.recipeId).join(','),
      'same seed → same breakfast week',
    );
  }
});

run('7-day unique within week', () => {
  for (const seed of [1, 7, 42, 99, 202]) {
    const d = generateElementaryDinnerWeek(seed);
    assert(d.ok, `dinner seed ${seed} ok`);
    if (d.ok) {
      const ids = d.plan.slots.map((s) => s.recipeId);
      assert(new Set(ids).size === 7, `dinner seed ${seed} has 7 unique`);
    }
    const b = generateElementaryBreakfastWeek(seed);
    assert(b.ok, `breakfast seed ${seed} ok`);
    if (b.ok) {
      const ids = b.plan.slots.map((s) => s.recipeId);
      assert(new Set(ids).size === 7, `breakfast seed ${seed} has 7 unique`);
    }
  }
});

console.log('\n14-day cross-week tests (200 seeds each):');
const breakfast14 = test14Day('breakfast', generateElementaryBreakfastWeek);
const dinner14 = test14Day('dinner', generateElementaryDinnerWeek);

run('breakfast 14-day success rate 100%', () => {
  assert(breakfast14.success === 200, `breakfast 14-day ${breakfast14.success}/200`);
  assert(breakfast14.duplicate === 0, `breakfast overlap ${breakfast14.duplicate}`);
});

run('dinner 14-day success rate 100%', () => {
  assert(dinner14.success === 200, `dinner 14-day ${dinner14.success}/200`);
  assert(dinner14.duplicate === 0, `dinner overlap ${dinner14.duplicate}`);
});

console.log(`\nHANKKI Sprint 3 elementary weekly QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
