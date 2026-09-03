/**
 * Child Content Expansion Batch #4 — consistency gate for recipe_0484–0517.
 * Run: npm run test:child-content-expansion-batch4
 */
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { runConsistencyGate } from './new-recipe-preparation/consistencyGate';

const NEW_IDS = Array.from({ length: 34 }, (_, i) => `recipe_${String(484 + i).padStart(4, '0')}`);

let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Child Content Expansion Batch #4 consistency gate — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
assert(NEW_IDS.every((id) => Boolean(getHankkiRecipeById(id))), 'all 34 new recipe ids exist');

const names = HANKKI_RECIPES.map((r) => r.name);
assert(new Set(names).size === names.length, 'no duplicate recipe names in catalog');

const recipes = NEW_IDS.map((id) => getHankkiRecipeById(id)!);
const findings = runConsistencyGate(recipes);
const critical = findings.filter((f) => f.severity === 'CRITICAL');
const high = findings.filter((f) => f.severity === 'HIGH');
const medium = findings.filter((f) => f.severity === 'MEDIUM');

console.log('\nCRITICAL:', critical.length);
for (const f of critical) console.log(`  ${f.recipeId} ${f.recipeName} — ${f.code}: ${f.issue}`);
console.log('HIGH:', high.length);
for (const f of high) console.log(`  ${f.recipeId} ${f.recipeName} — ${f.code}: ${f.issue}`);
console.log('MEDIUM:', medium.length);
for (const f of medium) console.log(`  ${f.recipeId} ${f.recipeName} — ${f.code}: ${f.issue}`);

assert(critical.length === 0, 'CRITICAL_COUNT 0');
assert(high.length === 0, 'HIGH_COUNT 0');
assert(medium.length === 0, 'MEDIUM_COUNT 0');

const toddler = recipes.filter((r) => r.familyAudience.audiences.includes('toddler'));
const elementary = recipes.filter((r) => r.familyAudience.audiences.includes('elementary'));
assert(toddler.length === 16, `batch4 toddler 16 (got ${toddler.length})`);
assert(elementary.length === 18, `batch4 elementary 18 (got ${elementary.length})`);

const toddlerBreakfast = toddler.filter(
  (r) => r.familyAudience.toddlerSafetyReview?.intendedMealTypes.includes('breakfast'),
);
const toddlerSnack = toddler.filter(
  (r) => r.familyAudience.toddlerSafetyReview?.intendedMealTypes.includes('snack'),
);
assert(toddlerBreakfast.length === 8, `toddler breakfast 8 (got ${toddlerBreakfast.length})`);
assert(toddlerSnack.length === 8, `toddler snack 8 (got ${toddlerSnack.length})`);

const elemDinner = elementary.filter((r) => r.standardMetadata.mealTypes.includes('dinner'));
const elemSnack = elementary.filter((r) => r.standardMetadata.mealTypes.includes('snack'));
assert(elemDinner.length === 10, `elementary dinner 10 (got ${elemDinner.length})`);
assert(elemSnack.length === 8, `elementary snack 8 (got ${elemSnack.length})`);

assert(
  elementary.every((r) => r.familyAudience.childMeal?.schoolMorningFriendly !== true),
  'elementary batch4 not school-morning',
);
assert(
  toddler.every((r) => r.familyAudience.toddlerSafetyReview?.reviewStatus === 'approved'),
  'toddler approved',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}
console.log('\nChild Content Expansion Batch #4 consistency gate — pass');
console.log('READY_FOR_BATCH4_IMAGE_SPRINT=YES');
