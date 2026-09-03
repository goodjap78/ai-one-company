/**
 * HANKKI Sprint 7 — elementary weekly quality integration QA.
 * Run: npx tsx scripts/test-elementary-sprint7-weekly-quality.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import {
  classifyWeeklyPlanDiversity,
  generateElementaryBreakfastWeek,
  listElementaryBreakfastWeekCandidates,
} from '../data/recipes/elementaryBreakfastWeeklyPlan';
import {
  generateElementaryDinnerWeek,
  listElementaryDinnerWeekCandidates,
} from '../data/recipes/elementaryDinnerWeeklyPlan';
import {
  SPRINT6_BREAKFAST_RECIPE_IDS,
  SPRINT6_DINNER_RECIPE_IDS,
} from '../data/recipes/elementarySprint6QualityPatches';
import { weekOverlapsAvoid } from '../data/recipes/elementaryWeeklyPlanCommon';
import {
  isWeeklyPlanQualityGradeA,
  weeklyPlanQualityScoreBoost,
} from '../data/recipes/elementaryWeeklyPlanQuality';

const SEED_COUNT = 500;
const CROSS_WEEK_SEEDS = 200;
const SCHOOL_MORNING_EXCLUDED = new Set(['recipe_0472', 'recipe_0306', 'recipe_0308']);

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

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('HANKKI Sprint 7 weekly quality integration QA — start\n');

const breakfastPool = listElementaryBreakfastWeekCandidates();
const dinnerPool = listElementaryDinnerWeekCandidates();
const breakfastAInPool = breakfastPool.filter((item) => isWeeklyPlanQualityGradeA(item.recipe)).length;
const dinnerAInPool = dinnerPool.filter((item) => isWeeklyPlanQualityGradeA(item.recipe)).length;

console.log(`Breakfast pool: ${breakfastPool.length} (A-grade in pool: ${breakfastAInPool})`);
console.log(`Dinner pool: ${dinnerPool.length} (A-grade in pool: ${dinnerAInPool})\n`);

run('quality module wired in generators', () => {
  const breakfastSrc = readFile('data/recipes/elementaryBreakfastWeeklyPlan.ts');
  const dinnerSrc = readFile('data/recipes/elementaryDinnerWeeklyPlan.ts');
  assert(breakfastSrc.includes('weeklyPlanQualityScoreBoost'), 'breakfast uses quality boost');
  assert(dinnerSrc.includes('weeklyPlanQualityScoreBoost'), 'dinner uses quality boost');
  assert(breakfastSrc.includes('weeklyPlanSchoolMorningScoreBoost'), 'breakfast school-morning boost');
});

run('quality boost is soft — non-A recipes still generate', () => {
  const nonA = breakfastPool.find((item) => !isWeeklyPlanQualityGradeA(item.recipe));
  assert(Boolean(nonA), 'non-A breakfast candidate exists');
  if (nonA) assert(weeklyPlanQualityScoreBoost(nonA.recipe) < 6, 'non-A boost < A boost');
});

// --- 500 seed breakfast simulation ---
const breakfastStats = {
  fail: 0,
  aCounts: [] as number[],
  schoolMorningCounts: [] as number[],
  duplicateWeeks: 0,
  uniqueWeekSets: new Set<string>(),
  excludedInSchoolMorningSlots: 0,
  eggHeavyWeeks: 0,
  riceHeavyWeeks: 0,
  fallbackCount: 0,
};

for (let i = 0; i < SEED_COUNT; i += 1) {
  const result = generateElementaryBreakfastWeek(`s7-bf-${i}`);
  if (!result.ok) {
    breakfastStats.fail += 1;
    continue;
  }
  if (result.seed.includes(':fallback')) breakfastStats.fallbackCount += 1;
  const ids = result.plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== 7) breakfastStats.duplicateWeeks += 1;

  const aCount = ids.filter((id) => {
    const r = getHankkiRecipeById(id);
    return r && isWeeklyPlanQualityGradeA(r);
  }).length;
  breakfastStats.aCounts.push(aCount);
  breakfastStats.schoolMorningCounts.push(
    result.plan.slots.filter((s) => s.schoolMorningFriendly === true).length,
  );
  breakfastStats.uniqueWeekSets.add(ids.slice().sort().join('|'));

  const eggDays = result.plan.slots.filter((slot) => {
    const r = getHankkiRecipeById(slot.recipeId);
    return r && classifyWeeklyPlanDiversity(r).eggCentric;
  }).length;
  if (eggDays >= 4) breakfastStats.eggHeavyWeeks += 1;

  const riceDays = result.plan.slots.filter((s) => s.diversityCategory === 'rice').length;
  if (riceDays >= 4) breakfastStats.riceHeavyWeeks += 1;

  for (const slot of result.plan.slots) {
    if (
      (slot.day === 'MON' ||
        slot.day === 'TUE' ||
        slot.day === 'WED' ||
        slot.day === 'THU' ||
        slot.day === 'FRI') &&
      SCHOOL_MORNING_EXCLUDED.has(slot.recipeId) &&
      slot.schoolMorningFriendly === true
    ) {
      breakfastStats.excludedInSchoolMorningSlots += 1;
    }
  }
}

const breakfastAAvg = avg(breakfastStats.aCounts);
const breakfastSmAvg = avg(breakfastStats.schoolMorningCounts);

console.log('\n--- Breakfast 500-seed stats ---');
console.log(`  fail=${breakfastStats.fail}/${SEED_COUNT}`);
console.log(`  A-grade avg=${breakfastAAvg.toFixed(2)}/7`);
console.log(`  schoolMorning avg=${breakfastSmAvg.toFixed(2)}/7`);
console.log(`  duplicate weeks=${breakfastStats.duplicateWeeks}`);
console.log(`  unique week sets=${breakfastStats.uniqueWeekSets.size}`);
console.log(`  egg>=4 days weeks=${breakfastStats.eggHeavyWeeks}`);
console.log(`  rice>=4 days weeks=${breakfastStats.riceHeavyWeeks}`);
console.log(`  fallback=${breakfastStats.fallbackCount}`);

run('breakfast 500 seeds — all generate', () => {
  assert(breakfastStats.fail === 0, `breakfast fail=0 (got ${breakfastStats.fail})`);
});

run('breakfast A-grade priority visible', () => {
  assert(breakfastAAvg >= 2.5, `A avg >= 2.5/7 (got ${breakfastAAvg.toFixed(2)})`);
  assert(breakfastAAvg <= 6.5, `A avg <= 6.5/7 — not forced 7/7 (got ${breakfastAAvg.toFixed(2)})`);
});

run('breakfast seed variety', () => {
  assert(
    breakfastStats.uniqueWeekSets.size >= 80,
    `unique weeks >= 80 (got ${breakfastStats.uniqueWeekSets.size})`,
  );
});

run('breakfast 7-day duplicates = 0', () => {
  assert(breakfastStats.duplicateWeeks === 0, `in-week duplicates=0 (got ${breakfastStats.duplicateWeeks})`);
});

run('school-morning excluded recipes not flagged true', () => {
  assert(
    breakfastStats.excludedInSchoolMorningSlots === 0,
    '0472/0306/0308 never schoolMorning=true in plan',
  );
});

// --- 500 seed dinner simulation ---
const dinnerStats = {
  fail: 0,
  aCounts: [] as number[],
  duplicateWeeks: 0,
  uniqueWeekSets: new Set<string>(),
  proteinHeavyWeeks: 0,
  fallbackCount: 0,
};

for (let i = 0; i < SEED_COUNT; i += 1) {
  const result = generateElementaryDinnerWeek(`s7-dn-${i}`);
  if (!result.ok) {
    dinnerStats.fail += 1;
    continue;
  }
  if (result.seed.includes(':fallback')) dinnerStats.fallbackCount += 1;
  const ids = result.plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== 7) dinnerStats.duplicateWeeks += 1;

  const aCount = ids.filter((id) => {
    const r = getHankkiRecipeById(id);
    return r && isWeeklyPlanQualityGradeA(r);
  }).length;
  dinnerStats.aCounts.push(aCount);
  dinnerStats.uniqueWeekSets.add(ids.slice().sort().join('|'));

  const proteins = ids.map((id) => dinnerPool.find((c) => c.recipe.id === id)?.proteinGroup ?? 'other');
  const maxProtein = proteins.reduce(
    (acc, p) => {
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  if (Math.max(...Object.values(maxProtein)) >= 4) dinnerStats.proteinHeavyWeeks += 1;
}

const dinnerAAvg = avg(dinnerStats.aCounts);

console.log('\n--- Dinner 500-seed stats ---');
console.log(`  fail=${dinnerStats.fail}/${SEED_COUNT}`);
console.log(`  A-grade avg=${dinnerAAvg.toFixed(2)}/7`);
console.log(`  duplicate weeks=${dinnerStats.duplicateWeeks}`);
console.log(`  unique week sets=${dinnerStats.uniqueWeekSets.size}`);
console.log(`  protein>=4 weeks=${dinnerStats.proteinHeavyWeeks}`);
console.log(`  fallback=${dinnerStats.fallbackCount}`);

run('dinner 500 seeds — all generate', () => {
  assert(dinnerStats.fail === 0, `dinner fail=0 (got ${dinnerStats.fail})`);
});

run('dinner A-grade priority visible', () => {
  assert(dinnerAAvg >= 2.5, `A avg >= 2.5/7 (got ${dinnerAAvg.toFixed(2)})`);
  assert(dinnerAAvg <= 6.5, `A avg <= 6.5/7 (got ${dinnerAAvg.toFixed(2)})`);
});

run('dinner seed variety', () => {
  assert(dinnerStats.uniqueWeekSets.size >= 80, `unique weeks >= 80 (got ${dinnerStats.uniqueWeekSets.size})`);
});

run('dinner 7-day duplicates = 0', () => {
  assert(dinnerStats.duplicateWeeks === 0, `in-week duplicates=0 (got ${dinnerStats.duplicateWeeks})`);
});

// --- 14-day cross-week ---
let bf14Dup = 0;
let bf14Fail = 0;
let dn14Dup = 0;
let dn14Fail = 0;
let bf14Fallback = 0;
let dn14Fallback = 0;

for (let i = 0; i < CROSS_WEEK_SEEDS; i += 1) {
  const w1b = generateElementaryBreakfastWeek(`s7-14-bf-w1-${i}`);
  if (!w1b.ok || !w1b.plan) {
    bf14Fail += 1;
    continue;
  }
  const ids1b = w1b.plan.slots.map((s) => s.recipeId);
  const w2b = generateElementaryBreakfastWeek(`s7-14-bf-w2-${i}`, undefined, { avoidRecipeIds: ids1b });
  if (!w2b.ok || !w2b.plan) {
    bf14Fail += 1;
    continue;
  }
  if (w2b.seed?.includes(':fallback')) bf14Fallback += 1;
  const ids2b = w2b.plan.slots.map((s) => s.recipeId);
  if (weekOverlapsAvoid(ids2b, ids1b)) bf14Dup += 1;

  const w1d = generateElementaryDinnerWeek(`s7-14-dn-w1-${i}`);
  if (!w1d.ok || !w1d.plan) {
    dn14Fail += 1;
    continue;
  }
  const ids1d = w1d.plan.slots.map((s) => s.recipeId);
  const w2d = generateElementaryDinnerWeek(`s7-14-dn-w2-${i}`, undefined, { avoidRecipeIds: ids1d });
  if (!w2d.ok || !w2d.plan) {
    dn14Fail += 1;
    continue;
  }
  if (w2d.seed?.includes(':fallback')) dn14Fallback += 1;
  const ids2d = w2d.plan.slots.map((s) => s.recipeId);
  if (weekOverlapsAvoid(ids2d, ids1d)) dn14Dup += 1;
}

console.log('\n--- 14-day cross-week (200 seeds each) ---');
console.log(`  breakfast: fail=${bf14Fail} cross_dup=${bf14Dup} fallback=${bf14Fallback}`);
console.log(`  dinner: fail=${dn14Fail} cross_dup=${dn14Dup} fallback=${dn14Fallback}`);

run('14-day breakfast cross-week duplicate = 0', () => {
  assert(bf14Dup === 0, `breakfast cross-week dup=0 (got ${bf14Dup})`);
  assert(bf14Fail === 0, `breakfast 14-day fail=0 (got ${bf14Fail})`);
});

run('14-day dinner cross-week duplicate = 0', () => {
  assert(dn14Dup === 0, `dinner cross-week dup=0 (got ${dn14Dup})`);
  assert(dn14Fail === 0, `dinner 14-day fail=0 (got ${dn14Fail})`);
});

run('deterministic seed unchanged', () => {
  const a = generateElementaryBreakfastWeek(42);
  const b = generateElementaryBreakfastWeek(42);
  assert(a.ok && b.ok, 'breakfast generates');
  if (a.ok && b.ok) {
    assert(
      a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
      'breakfast seed 42 deterministic',
    );
  }
  const c = generateElementaryDinnerWeek(42);
  const d = generateElementaryDinnerWeek(42);
  assert(c.ok && d.ok, 'dinner generates');
  if (c.ok && d.ok) {
    assert(
      c.plan.slots.map((s) => s.recipeId).join(',') === d.plan.slots.map((s) => s.recipeId).join(','),
      'dinner seed 42 deterministic',
    );
  }
});

run('UI does not expose quality grade', () => {
  const browse = readFile('components/elementary/ElementaryBrowseScreen.tsx');
  const weekly = readFile('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(!browse.includes('recipeQualityGrade'), 'browse no grade');
  assert(!weekly.includes('recipeQualityGrade'), 'weekly no grade');
  assert(!browse.includes('contentVerificationStatus'), 'browse no verification status');
});

run('sprint6 core IDs remain in pools', () => {
  for (const id of SPRINT6_BREAKFAST_RECIPE_IDS) {
    assert(breakfastPool.some((c) => c.recipe.id === id), `${id} in breakfast pool`);
  }
  for (const id of SPRINT6_DINNER_RECIPE_IDS) {
    assert(dinnerPool.some((c) => c.recipe.id === id), `${id} in dinner pool`);
  }
});

// Export summary for report tooling
const summary = {
  breakfastAAvg,
  breakfastSmAvg,
  dinnerAAvg,
  breakfastUniqueWeeks: breakfastStats.uniqueWeekSets.size,
  dinnerUniqueWeeks: dinnerStats.uniqueWeekSets.size,
  bf14Dup,
  dn14Dup,
  bf14Fallback,
  dn14Fallback,
  breakfastFallback: breakfastStats.fallbackCount,
  dinnerFallback: dinnerStats.fallbackCount,
};

console.log('\n--- SPRINT7_SUMMARY_JSON ---');
console.log(JSON.stringify(summary, null, 2));

console.log(`\nHANKKI Sprint 7 weekly quality integration QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
