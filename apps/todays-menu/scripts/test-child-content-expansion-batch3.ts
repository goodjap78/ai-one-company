/**
 * Child Content Expansion Batch #3 — consistency gate for recipe_0448–0483.
 * Run: npm run test:child-content-expansion-batch3
 */
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { runConsistencyGate } from './new-recipe-preparation/consistencyGate';

const NEW_IDS = Array.from({ length: 36 }, (_, i) => `recipe_${String(448 + i).padStart(4, '0')}`);

let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Child Content Expansion Batch #3 consistency gate — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
assert(NEW_IDS.every((id) => Boolean(getHankkiRecipeById(id))), 'all 36 new recipe ids exist');

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

const baby = recipes.filter((r) => r.familyAudience.audiences.includes('baby'));
const toddler = recipes.filter((r) => r.familyAudience.audiences.includes('toddler'));
const elementary = recipes.filter((r) => r.familyAudience.audiences.includes('elementary'));
assert(baby.length === 10, `batch3 baby 10 (got ${baby.length})`);
assert(toddler.length === 14, `batch3 toddler 14 (got ${toddler.length})`);
assert(elementary.length === 12, `batch3 elementary 12 (got ${elementary.length})`);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}
console.log('\nChild Content Expansion Batch #3 consistency gate — pass');
console.log('READY_FOR_BATCH4=YES');
