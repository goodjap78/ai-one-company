/**
 * Sprint 10 — toddler breakfast diversity expansion QA + 500-week simulation.
 * Run: npx tsx scripts/test-toddler-sprint10-breakfast-diversity.ts
 */
import { listToddlerMealFeedRecipes } from '../data/recipes/toddlerMealFeed';
import {
  TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS,
  TODDLER_SPRINT10_PATCHES,
} from '../data/recipes/toddlerSprint10QualityPatches';
import type { Recipe } from '../data/recipes/types';

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    return;
  }
  console.log(`✅ ${message}`);
}

function isEggBased(recipe: Recipe): boolean {
  if (recipe.standardMetadata.allergyTags.includes('egg')) return true;
  return recipe.ingredients.some((item) => /계란|달걀|egg/i.test(item.name));
}

type Category =
  | 'bread'
  | 'potatoSweet'
  | 'oatFruit'
  | 'tofu'
  | 'rice'
  | 'egg'
  | 'soup'
  | 'other';

function categoriesOf(recipe: Recipe): Category[] {
  const cats = new Set<Category>();
  const blob = `${recipe.name} ${recipe.category.join(' ')} ${recipe.searchTags.join(' ')}`.toLowerCase();
  if (/토스트|식빵|또띠아/.test(blob)) cats.add('bread');
  if (/고구마|감자|단호박/.test(blob)) cats.add('potatoSweet');
  if (/오트|요거트|바나나|과일|배|사과|블루베리/.test(blob)) cats.add('oatFruit');
  if (/두부|순두부|연두부/.test(blob)) cats.add('tofu');
  if (/밥|주먹밥|덮밥|볶음밥|죽/.test(blob)) cats.add('rice');
  if (/국|수프/.test(blob)) cats.add('soup');
  if (isEggBased(recipe)) cats.add('egg');
  if (/팬케이크|치즈전/.test(blob) && !cats.has('bread')) cats.add('other');
  if (cats.size === 0) cats.add('other');
  return [...cats];
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeek(pool: Recipe[], rng: () => number): Recipe[] {
  const copy = [...pool];
  const week: Recipe[] = [];
  for (let i = 0; i < 7; i += 1) {
    const idx = Math.floor(rng() * copy.length);
    week.push(copy.splice(idx, 1)[0]!);
  }
  return week;
}

console.log('HANKKI Sprint 10 toddler breakfast diversity QA — start\n');

assert(TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS.length === 6, 'promoted 6');
assert(Object.keys(TODDLER_SPRINT10_PATCHES).length === 6, '6 quality patches');

const breakfast = listToddlerMealFeedRecipes('breakfast');
const snack = listToddlerMealFeedRecipes('snack');
assert(breakfast.length === 21, `breakfast 21 (got ${breakfast.length})`);
assert(snack.length === 16, `snack 16 (got ${snack.length})`);

for (const id of TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS) {
  const recipe = breakfast.find((item) => item.id === id);
  assert(Boolean(recipe), `${id} in breakfast pool`);
  if (!recipe) continue;
  assert(recipe.standardMetadata.mealTypes.includes('breakfast'), `${id} mealTypes breakfast`);
  assert(recipe.standardMetadata.mealTypes.includes('snack'), `${id} mealTypes snack`);
  assert(
    recipe.familyAudience.toddlerSafetyReview?.intendedMealTypes?.includes('breakfast') === true,
    `${id} intended breakfast`,
  );
  assert(!isEggBased(recipe), `${id} non-egg`);
  assert(recipe.elementaryQuality?.recipeQualityGrade === 'A', `${id} grade A`);
  assert(recipe.elementaryQuality?.targetAudience === 'toddler', `${id} toddler audience`);
  assert(recipe.nutrition.source === 'unverified', `${id} nutrition unverified`);
  assert(Boolean(recipe.elementaryQuality?.prerequisites), `${id} prerequisites`);
  assert(Boolean(recipe.elementaryQuality?.storageInfo), `${id} storage`);
  assert(Boolean(recipe.elementaryQuality?.reheatingMethod), `${id} reheat`);
  assert(Boolean(recipe.prepTimeMinutes && recipe.prepTimeMinutes > 0), `${id} prepTime`);
  assert(!/1꼬집/.test(JSON.stringify(recipe.ingredients) + JSON.stringify(recipe.recipe.steps)), `${id} no pinch`);
}

const egg = breakfast.filter(isEggBased);
const nonEgg = breakfast.filter((r) => !isEggBased(r));
assert(egg.length === 11, `egg 11 (got ${egg.length})`);
assert(nonEgg.length >= 10, `non-egg >=10 (got ${nonEgg.length})`);
assert(nonEgg.length === 10, `non-egg 10 (got ${nonEgg.length})`);

const categoryHits: Record<string, number> = {};
for (const recipe of breakfast) {
  for (const cat of categoriesOf(recipe)) {
    categoryHits[cat] = (categoryHits[cat] ?? 0) + 1;
  }
}
assert((categoryHits.potatoSweet ?? 0) >= 2, 'potato/sweet category present');
assert((categoryHits.oatFruit ?? 0) >= 2, 'oat/fruit category present');

const trueBreadToast = breakfast.filter((r) =>
  /토스트|식빵|또띠아/.test(`${r.name} ${r.category.join(' ')}`),
);
assert(trueBreadToast.length === 0, 'true bread/toast still 0 (documented gap)');
assert(
  nonEgg.some((r) => /두부/.test(r.name)),
  'tofu breakfast present in pool',
);
assert(
  nonEgg.some((r) => /밥|주먹밥/.test(r.name)),
  'rice/non-egg breakfast present',
);

const SIM = 500;
const rng = mulberry32(10_2026);
let eggDayTotal = 0;
let weeksEggGe5 = 0;
let weeksEggGe6 = 0;
let maxEggInWeek = 0;
const categoryWeekMax: Record<string, number> = {};
const mainIngredientStreakHeavy = { count: 0 };

for (let w = 0; w < SIM; w += 1) {
  const week = pickWeek(breakfast, rng);
  const eggDays = week.filter(isEggBased).length;
  eggDayTotal += eggDays;
  maxEggInWeek = Math.max(maxEggInWeek, eggDays);
  if (eggDays >= 5) weeksEggGe5 += 1;
  if (eggDays >= 6) weeksEggGe6 += 1;

  const catCounts: Record<string, number> = {};
  for (const recipe of week) {
    for (const cat of categoriesOf(recipe)) {
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
  }
  for (const [cat, n] of Object.entries(catCounts)) {
    categoryWeekMax[cat] = Math.max(categoryWeekMax[cat] ?? 0, n);
  }

  const mains = week.map((r) => r.standardMetadata.mainIngredients[0] ?? r.name);
  const mainCounts = mains.reduce<Record<string, number>>((acc, m) => {
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});
  if (Object.values(mainCounts).some((n) => n >= 4)) mainIngredientStreakHeavy.count += 1;
}

const avgEggDays = eggDayTotal / SIM;
const eggRepeatRate = eggDayTotal / (SIM * 7);

assert(avgEggDays <= 4.2, `avg egg days/week <=4.2 (got ${avgEggDays.toFixed(2)})`);
assert(maxEggInWeek <= 7, `max egg in week recorded ${maxEggInWeek}`);
assert(nonEgg.length / breakfast.length >= 0.45, 'non-egg share >=45%');

console.log('\n--- SPRINT10 SIMULATION ---');
console.log(
  JSON.stringify(
    {
      breakfastPool: breakfast.length,
      egg: egg.length,
      nonEgg: nonEgg.length,
      categoryHits,
      sim: SIM,
      avgEggDaysPerWeek: Number(avgEggDays.toFixed(3)),
      eggRepeatRate: Number(eggRepeatRate.toFixed(3)),
      maxEggInWeek,
      weeksEggGe5Pct: Number(((weeksEggGe5 / SIM) * 100).toFixed(1)),
      weeksEggGe6Pct: Number(((weeksEggGe6 / SIM) * 100).toFixed(1)),
      categoryWeekMax,
      weeksMainIngredientGe4Pct: Number(((mainIngredientStreakHeavy.count / SIM) * 100).toFixed(1)),
      trueBreadToastCount: trueBreadToast.length,
      weekReady: nonEgg.length >= 10 && avgEggDays <= 4.2 ? 'YES' : 'NO',
      note: 'Pure random can still spike eggs; weekly egg-cap rules belong in next Weekly sprint.',
    },
    null,
    2,
  ),
);

if (failed > 0) {
  console.error(`\nHANKKI Sprint 10 — FAIL (${failed})`);
  process.exit(1);
}
console.log('\nHANKKI Sprint 10 toddler breakfast diversity QA — PASS');
