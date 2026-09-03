/**
 * HANKKI Sprint 6.2 — recipe reality fix QA.
 * Run: npx tsx scripts/test-elementary-sprint6-2-recipe-reality.ts
 */
import {
  SPRINT6_BREAKFAST_RECIPE_IDS,
  SPRINT6_REVIEWED_RECIPE_IDS,
} from '../data/recipes/elementarySprint6QualityPatches';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const VAGUE = /^(적당량|조금|약간|한 줌|1꼬집)$/;
const SCHOOL_MORNING_EXCLUDED = ['recipe_0472', 'recipe_0306', 'recipe_0308'] as const;
const ORIGINAL_A = [
  'recipe_0477',
  'recipe_0312',
  'recipe_0396',
  'recipe_0441',
  'recipe_0500',
  'recipe_0442',
  'recipe_0444',
  'recipe_0508',
] as const;

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

console.log('HANKKI Sprint 6.2 recipe reality QA — start\n');

run('school-morning exclusions applied', () => {
  for (const id of SCHOOL_MORNING_EXCLUDED) {
    const recipe = getHankkiRecipeById(id)!;
    assert(recipe.familyAudience.childMeal?.schoolMorningFriendly === false, `${id} schoolMorning=false`);
  }
});

run('no vague ingredient amounts on reviewed set', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    const recipe = getHankkiRecipeById(id)!;
    for (const ing of recipe.ingredients) {
      assert(!VAGUE.test(ing.amount.trim()), `${id} ${ing.name} "${ing.amount}"`);
      assert(!/1꼬집/.test(ing.amount), `${id} ${ing.name} no pinch`);
    }
  }
});

run('0405 salt reduced for child serving', () => {
  const r = getHankkiRecipeById('recipe_0405')!;
  const salt = r.ingredients.find((i) => i.name === '소금');
  assert(salt?.amount === '1/4작은술', '0405 salt 1/4tsp');
  assert(r.recipe.steps[3]?.instruction.includes('1/4작은술'), '0405 step salt');
});

run('0447 pan/microwave alternative + lower priority', () => {
  const r = getHankkiRecipeById('recipe_0447')!;
  assert(r.recommendationPriority === 62, '0447 priority lowered');
  assert(/팬|전자레인지/.test(r.recipe.steps[4]?.instruction ?? ''), '0447 alt cook method');
});

run('0305 egg fully cooked in steps', () => {
  const r = getHankkiRecipeById('recipe_0305')!;
  assert(r.recipe.steps[2]?.instruction.includes('완전히'), '0305 fully cooked');
  assert(!r.recipe.steps[2]?.instruction.includes('반숙'), '0305 no semi-cooked');
});

run('0313 overnight vs fresh path in steps', () => {
  const r = getHankkiRecipeById('recipe_0313')!;
  assert(/전날 찐|생고구마/.test(r.elementaryQuality?.prerequisites ?? ''), '0313 prereq paths');
  assert(/생고구마/.test(r.recipe.steps[1]?.instruction ?? ''), '0313 step branch');
});

run('all 30 have internal recipeQualityGrade A', () => {
  for (const id of SPRINT6_REVIEWED_RECIPE_IDS) {
    const grade = getHankkiRecipeById(id)?.elementaryQuality?.recipeQualityGrade;
    assert(grade === 'A', `${id} grade A (got ${grade})`);
  }
});

run('original A recipes still present unchanged in name/id', () => {
  for (const id of ORIGINAL_A) {
    assert(getHankkiRecipeById(id) != null, `${id} exists`);
  }
});

run('0406 udon weight specified', () => {
  const udon = getHankkiRecipeById('recipe_0406')!.ingredients.find((i) => i.name === '우동면');
  assert(udon?.amount.includes('200g'), '0406 udon grams');
});

run('0507 water in ml', () => {
  const water = getHankkiRecipeById('recipe_0507')!.ingredients.find((i) => i.name === '물');
  assert(water?.amount === '120ml', '0507 water ml');
});

console.log(`\nBreakfast school-morning true count among sprint6 breakfast:`);
for (const id of SPRINT6_BREAKFAST_RECIPE_IDS) {
  const sm = getHankkiRecipeById(id)?.familyAudience.childMeal?.schoolMorningFriendly;
  console.log(`  ${id}: ${sm}`);
}

console.log(`\nHANKKI Sprint 6.2 recipe reality QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
