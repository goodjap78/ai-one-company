/**
 * HANKKI Sprint 6 — elementary recipe quality upgrade QA.
 * Run: npx tsx scripts/test-elementary-sprint6-recipe-quality.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ELEMENTARY_SPRINT6_PATCHES,
  SPRINT6_BREAKFAST_RECIPE_IDS,
  SPRINT6_DINNER_RECIPE_IDS,
  SPRINT6_REVIEWED_RECIPE_IDS,
} from '../data/recipes/elementarySprint6QualityPatches';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

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

const VAGUE = /^(적당량|조금|약간|한 줌)$/;

console.log('HANKKI Sprint 6 elementary recipe quality QA — start\n');

run('selection counts', () => {
  assert(SPRINT6_BREAKFAST_RECIPE_IDS.length === 15, '15 breakfast');
  assert(SPRINT6_DINNER_RECIPE_IDS.length === 15, '15 dinner');
  assert(SPRINT6_REVIEWED_RECIPE_IDS.length === 30, '30 total');
  assert(Object.keys(ELEMENTARY_SPRINT6_PATCHES).length === 30, '30 patches');
});

run('all selected recipes exist in catalog', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    assert(getHankkiRecipeById(id) != null, `recipe ${id} exists`);
  }
});

run('reviewed quality applied to all 30', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    const recipe = getHankkiRecipeById(id)!;
    assert(recipe.elementaryQuality?.contentVerificationStatus === 'reviewed', `${id} reviewed`);
    assert(recipe.prepTimeMinutes != null && recipe.prepTimeMinutes > 0, `${id} prepTime`);
    assert(recipe.elementaryQuality?.kidAdjustmentTip != null, `${id} kid tip`);
    assert(recipe.elementaryQuality?.storageInfo != null, `${id} storage`);
    assert(recipe.elementaryQuality?.reheatingMethod != null, `${id} reheat`);
    assert(recipe.serving >= 1, `${id} serving`);
    assert(recipe.recipe.steps.length >= 4 && recipe.recipe.steps.length <= 6, `${id} step count`);
  }
});

run('nutrition stays unverified — not fabricated', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    const recipe = getHankkiRecipeById(id)!;
    assert(recipe.nutrition.source === 'unverified', `${id} nutrition unverified`);
  }
});

run('no vague ingredient amounts on reviewed set', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    const recipe = getHankkiRecipeById(id)!;
    for (const ing of recipe.ingredients) {
      assert(!VAGUE.test(ing.amount.trim()), `${id} ${ing.name} amount "${ing.amount}"`);
    }
  }
});

run('schema + UI wiring', () => {
  const types = read('data/recipes/types.ts');
  assert(types.includes('prepTimeMinutes'), 'prepTime on Recipe');
  assert(types.includes('elementaryQuality'), 'elementaryQuality on Recipe');
  const ui = read('components/recipe/ChildDetailSections.tsx');
  assert(ui.includes('elementaryQuality'), 'detail UI reads quality');
  assert(ui.includes('elementaryPrepTitle'), 'prep time UI');
  const template = read('data/recipes/recipeMasterTemplate.ts');
  assert(template.includes('applyElementarySprint6QualityPatch'), 'patch applied at create');
});

run('weekly generator uses soft quality boost (Sprint 7)', () => {
  const breakfast = read('data/recipes/elementaryBreakfastWeeklyPlan.ts');
  const quality = read('data/recipes/elementaryWeeklyPlanQuality.ts');
  assert(breakfast.includes('weeklyPlanQualityScoreBoost'), 'breakfast quality boost wired');
  assert(quality.includes('recipeQualityGrade'), 'quality module reads grade');
  assert(!breakfast.includes('elementaryQuality?.contentVerificationStatus'), 'no hard filter on verification');
});

console.log('\nSelected breakfast:');
for (const id of SPRINT6_BREAKFAST_RECIPE_IDS) {
  console.log(`  ${id} — ${getHankkiRecipeById(id)?.name}`);
}
console.log('\nSelected dinner:');
for (const id of SPRINT6_DINNER_RECIPE_IDS) {
  console.log(`  ${id} — ${getHankkiRecipeById(id)?.name}`);
}

console.log(`\nHANKKI Sprint 6 elementary recipe quality QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
