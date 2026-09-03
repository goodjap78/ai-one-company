/**
 * Sprint 11 — toddler breakfast / dinner weekly generator QA.
 * Run: npx tsx scripts/test-toddler-sprint11-weekly-generators.ts
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  classifyToddlerBreakfastCategory,
  generateToddlerBreakfastWeek,
  isToddlerBreakfastEggBased,
  listToddlerBreakfastWeekCandidates,
  TODDLER_BREAKFAST_MAX_EGG,
  TODDLER_BREAKFAST_MIN_NON_EGG,
  validateToddlerBreakfastWeekPlan,
} from '../data/recipes/toddlerBreakfastWeeklyPlan';
import {
  classifyToddlerDinnerForm,
  classifyToddlerDinnerProtein,
  generateToddlerDinnerWeek,
  listToddlerDinnerWeekCandidates,
  validateToddlerDinnerWeekPlan,
} from '../data/recipes/toddlerDinnerWeeklyPlan';
import { generateToddlerWeeklyPlan } from '../data/recipes/toddlerWeeklyPlan';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    return;
  }
  console.log(`✅ ${msg}`);
}

const recipesById = new Map(HANKKI_RECIPES.map((r) => [r.id, r]));

console.log('HANKKI Sprint 11 toddler weekly generators QA — start\n');

const bfPool = listToddlerBreakfastWeekCandidates();
const dnPool = listToddlerDinnerWeekCandidates();
assert(bfPool.length === 21, `breakfast pool 21 (got ${bfPool.length})`);
assert(dnPool.length === 24, `dinner pool 24 (got ${dnPool.length})`);
assert(bfPool.filter((c) => c.isEgg).length === 11, 'egg 11 in breakfast pool');
assert(bfPool.filter((c) => !c.isEgg).length === 10, 'non-egg 10 in breakfast pool');

// Deterministic
const a = generateToddlerBreakfastWeek(42);
const b = generateToddlerBreakfastWeek(42);
assert(a.ok && b.ok, 'breakfast seed 42 ok');
if (a.ok && b.ok) {
  assert(
    a.plan.slots.map((s) => s.recipeId).join(',') === b.plan.slots.map((s) => s.recipeId).join(','),
    'breakfast deterministic',
  );
}
const d1 = generateToddlerDinnerWeek(99);
const d2 = generateToddlerDinnerWeek(99);
assert(d1.ok && d2.ok, 'dinner seed 99 ok');
if (d1.ok && d2.ok) {
  assert(
    d1.plan.slots.map((s) => s.recipeId).join(',') === d2.plan.slots.map((s) => s.recipeId).join(','),
    'dinner deterministic',
  );
}

// Delegation
const viaLegacy = generateToddlerWeeklyPlan('breakfast', 42);
assert(viaLegacy.ok, 'legacy breakfast delegates');
if (viaLegacy.ok && a.ok) {
  assert(
    viaLegacy.plan.slots.map((s) => s.recipeId).join(',') ===
      a.plan.slots.map((s) => s.recipeId).join(','),
    'legacy breakfast matches dedicated',
  );
}

const SIM = 500;
const uniqueBf = new Set<string>();
let bfEggSum = 0;
let bfMaxEgg = 0;
let bf4Plus = 0;
let bfDup = 0;
let bfFail = 0;
let bfFallback = 0;
let bfNonEggSum = 0;
const bfCatPresent = new Set<string>();
let bfCatDiversitySum = 0;

for (let seed = 0; seed < SIM; seed += 1) {
  const result = generateToddlerBreakfastWeek(seed);
  if (!result.ok) {
    bfFail += 1;
    continue;
  }
  if (result.usedFallback || result.seed.includes(':fallback')) bfFallback += 1;
  const ids = result.plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== 7) bfDup += 1;
  uniqueBf.add([...ids].sort().join('|'));

  const v = validateToddlerBreakfastWeekPlan(result.plan, recipesById);
  if (!v.ok) {
    bfFail += 1;
    console.error(`bf seed ${seed} invalid`, v.reasons);
    continue;
  }

  const recipes = ids.map((id) => recipesById.get(id)!);
  const eggDays = recipes.filter(isToddlerBreakfastEggBased).length;
  bfEggSum += eggDays;
  bfMaxEgg = Math.max(bfMaxEgg, eggDays);
  if (eggDays >= 4) bf4Plus += 1;
  bfNonEggSum += 7 - eggDays;

  const cats = new Set(recipes.map(classifyToddlerBreakfastCategory));
  bfCatDiversitySum += cats.size;
  for (const c of cats) bfCatPresent.add(c);
}

assert(bfFail === 0, `breakfast 500 all ok (fail ${bfFail})`);
assert(bfDup === 0, `breakfast 7-day duplicates 0 (got ${bfDup})`);
assert(bfMaxEgg <= TODDLER_BREAKFAST_MAX_EGG, `breakfast max egg <=3 (got ${bfMaxEgg})`);
assert(bf4Plus === 0, `breakfast 4+ egg rate 0% (got ${bf4Plus})`);
const bfAvgEgg = bfEggSum / SIM;
const bfAvgNonEgg = bfNonEggSum / SIM;
assert(bfAvgNonEgg >= TODDLER_BREAKFAST_MIN_NON_EGG, `avg non-egg >=4 (got ${bfAvgNonEgg.toFixed(2)})`);
assert(bfCatPresent.size >= 4, `breakfast categories seen >=4 (got ${bfCatPresent.size})`);

const uniqueDn = new Set<string>();
let dnDup = 0;
let dnFail = 0;
let dnFallback = 0;
let dnFormDivSum = 0;
let dnProtDivSum = 0;
const dnForms = new Set<string>();
const dnProts = new Set<string>();

for (let seed = 0; seed < SIM; seed += 1) {
  const result = generateToddlerDinnerWeek(seed);
  if (!result.ok) {
    dnFail += 1;
    continue;
  }
  if (result.usedFallback || result.seed.includes(':fallback')) dnFallback += 1;
  const ids = result.plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== 7) dnDup += 1;
  uniqueDn.add([...ids].sort().join('|'));

  const v = validateToddlerDinnerWeekPlan(result.plan, recipesById);
  if (!v.ok) {
    dnFail += 1;
    console.error(`dn seed ${seed} invalid`, v.reasons);
    continue;
  }

  const recipes = ids.map((id) => recipesById.get(id)!);
  const forms = new Set(recipes.map(classifyToddlerDinnerForm));
  const prots = new Set(recipes.map(classifyToddlerDinnerProtein));
  dnFormDivSum += forms.size;
  dnProtDivSum += prots.size;
  for (const f of forms) dnForms.add(f);
  for (const p of prots) dnProts.add(p);
}

assert(dnFail === 0, `dinner 500 all ok (fail ${dnFail})`);
assert(dnDup === 0, `dinner 7-day duplicates 0 (got ${dnDup})`);
assert(dnForms.size >= 4, `dinner forms seen >=4 (got ${dnForms.size})`);
assert(dnProts.size >= 3, `dinner proteins seen >=3 (got ${dnProts.size})`);

// 14-day QA
const CROSS = 200;
let bf14Dup = 0;
let dn14Dup = 0;
let bf14Fail = 0;
let dn14Fail = 0;
let bf14Fallback = 0;
let dn14Fallback = 0;

for (let seed = 1000; seed < 1000 + CROSS; seed += 1) {
  const w1 = generateToddlerBreakfastWeek(seed);
  if (!w1.ok) {
    bf14Fail += 1;
    continue;
  }
  const avoid = w1.plan.slots.map((s) => s.recipeId);
  const w2 = generateToddlerBreakfastWeek(seed + 10_000, HANKKI_RECIPES, { avoidRecipeIds: avoid });
  if (!w2.ok) {
    bf14Fail += 1;
    continue;
  }
  if (w2.usedFallback || w2.seed.includes(':fallback')) bf14Fallback += 1;
  const set2 = new Set(w2.plan.slots.map((s) => s.recipeId));
  if (avoid.some((id) => set2.has(id))) bf14Dup += 1;
  if (!validateToddlerBreakfastWeekPlan(w2.plan, recipesById).ok) bf14Fail += 1;
}

for (let seed = 2000; seed < 2000 + CROSS; seed += 1) {
  const w1 = generateToddlerDinnerWeek(seed);
  if (!w1.ok) {
    dn14Fail += 1;
    continue;
  }
  const avoid = w1.plan.slots.map((s) => s.recipeId);
  const w2 = generateToddlerDinnerWeek(seed + 10_000, HANKKI_RECIPES, { avoidRecipeIds: avoid });
  if (!w2.ok) {
    dn14Fail += 1;
    continue;
  }
  if (w2.usedFallback || w2.seed.includes(':fallback')) dn14Fallback += 1;
  const set2 = new Set(w2.plan.slots.map((s) => s.recipeId));
  if (avoid.some((id) => set2.has(id))) dn14Dup += 1;
  if (!validateToddlerDinnerWeekPlan(w2.plan, recipesById).ok) dn14Fail += 1;
}

assert(bf14Fail === 0, `breakfast 14-day fail 0 (got ${bf14Fail})`);
assert(bf14Dup === 0, `breakfast 14-day cross dup 0 (got ${bf14Dup})`);
assert(dn14Fail === 0, `dinner 14-day fail 0 (got ${dn14Fail})`);
assert(dn14Dup === 0, `dinner 14-day cross dup 0 (got ${dn14Dup})`);

const summary = {
  BREAKFAST_POOL: bfPool.length,
  DINNER_POOL: dnPool.length,
  BREAKFAST_AVG_EGG: Number(bfAvgEgg.toFixed(3)),
  BREAKFAST_MAX_EGG: bfMaxEgg,
  BREAKFAST_4PLUS_EGG_RATE: `${((bf4Plus / SIM) * 100).toFixed(1)}%`,
  BREAKFAST_AVG_NON_EGG: Number(bfAvgNonEgg.toFixed(3)),
  BREAKFAST_CATEGORY_DIVERSITY: {
    avgPerWeek: Number((bfCatDiversitySum / SIM).toFixed(2)),
    seen: [...bfCatPresent].sort(),
  },
  BREAKFAST_UNIQUE_WEEKLY_SETS: uniqueBf.size,
  BREAKFAST_FALLBACK: bfFallback,
  DINNER_CATEGORY_DIVERSITY: {
    avgFormsPerWeek: Number((dnFormDivSum / SIM).toFixed(2)),
    formsSeen: [...dnForms].sort(),
  },
  DINNER_PROTEIN_DIVERSITY: {
    avgPerWeek: Number((dnProtDivSum / SIM).toFixed(2)),
    proteinsSeen: [...dnProts].sort(),
  },
  DINNER_UNIQUE_WEEKLY_SETS: uniqueDn.size,
  DINNER_FALLBACK: dnFallback,
  CROSS_14_BF_FALLBACK: bf14Fallback,
  CROSS_14_DN_FALLBACK: dn14Fallback,
  FALLBACK_COUNT: bfFallback + dnFallback + bf14Fallback + dn14Fallback,
};

console.log('\n--- SPRINT11 SUMMARY ---');
console.log(JSON.stringify(summary, null, 2));

if (failed > 0) {
  console.error(`\nHANKKI Sprint 11 — FAIL (${failed})`);
  process.exit(1);
}
console.log('\nHANKKI Sprint 11 toddler weekly generators QA — PASS');
