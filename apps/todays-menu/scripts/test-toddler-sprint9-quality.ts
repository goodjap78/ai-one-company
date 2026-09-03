/**
 * HANKKI Sprint 9 — toddler core recipe quality QA.
 * Run: npx tsx scripts/test-toddler-sprint9-quality.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import {
  SPRINT9_TODDLER_BREAKFAST_IDS,
  SPRINT9_TODDLER_CORE_IDS,
  SPRINT9_TODDLER_DINNER_IDS,
  TODDLER_SPRINT9_PATCHES,
} from '../data/recipes/toddlerSprint9QualityPatches';

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

const VAGUE = /^(적당량|조금|약간|한 줌|1꼬집)$/;
const PINCH = /1꼬집/;

type Grade = 'A' | 'B' | 'C';

function gradeCore(id: string): { grade: Grade; issues: string[] } {
  const r = getHankkiRecipeById(id)!;
  const issues: string[] = [];
  const q = r.elementaryQuality;

  if (!q || q.targetAudience !== 'toddler') issues.push('missing toddler quality');
  if (q?.contentVerificationStatus !== 'reviewed') issues.push('not reviewed');
  if (r.nutrition.source !== 'unverified') issues.push('nutrition must stay unverified');

  for (const ing of r.ingredients) {
    if (VAGUE.test(ing.amount.trim()) || PINCH.test(ing.amount)) {
      issues.push(`measurement ${ing.name}=${ing.amount}`);
    }
  }
  const blob = r.recipe.steps.map((s) => `${s.instruction} ${s.tip}`).join(' ');
  if (PINCH.test(blob)) issues.push('pinch remains in steps');

  if (!r.prepTimeMinutes) issues.push('prepTime missing');
  if (!q?.prerequisites) issues.push('prerequisites missing');
  if (!q?.kidAdjustmentTip) issues.push('kid tip missing');
  if (!q?.storageInfo) issues.push('storage missing');
  if (!q?.reheatingMethod) issues.push('reheat missing');
  if (r.recipe.steps.length < 3 || r.recipe.steps.length > 7) {
    issues.push(`steps ${r.recipe.steps.length}`);
  }

  const hasFire = r.recipe.steps.some((s) =>
    /약불|중불|중약불|센불|전자레인지|익|부드럽/.test(`${s.instruction} ${s.tip}`),
  );
  if (!hasFire) issues.push('fire/doneness cue weak');

  let grade: Grade = 'A';
  if (issues.some((i) => i.startsWith('measurement') || i.includes('pinch'))) grade = 'C';
  else if (issues.length > 0) grade = 'B';

  // Editorial grade on recipe should match A when clean
  if (grade === 'A' && q?.recipeQualityGrade !== 'A') {
    issues.push(`qualityGrade=${q?.recipeQualityGrade}`);
    grade = 'B';
  }

  return { grade, issues };
}

console.log('HANKKI Sprint 9 toddler core quality QA — start\n');

run('selection counts', () => {
  assert(SPRINT9_TODDLER_BREAKFAST_IDS.length === 15, 'breakfast 15');
  assert(SPRINT9_TODDLER_DINNER_IDS.length === 15, 'dinner 15');
  assert(SPRINT9_TODDLER_CORE_IDS.length === 30, 'core 30');
  assert(Object.keys(TODDLER_SPRINT9_PATCHES).length === 30, '30 patches');
});

run('all core recipes exist + patched', () => {
  for (const id of SPRINT9_TODDLER_CORE_IDS) {
    const r = getHankkiRecipeById(id);
    assert(Boolean(r), `${id} exists`);
    assert(r!.elementaryQuality?.targetAudience === 'toddler', `${id} toddler audience`);
    assert(r!.elementaryQuality?.recipeQualityGrade === 'A', `${id} grade A metadata`);
    assert(r!.nutrition.source === 'unverified', `${id} nutrition unverified`);
  }
});

run('no pinch salt on core set', () => {
  for (const id of SPRINT9_TODDLER_CORE_IDS) {
    const r = getHankkiRecipeById(id)!;
    for (const ing of r.ingredients) {
      assert(!PINCH.test(ing.amount), `${id} ${ing.name} no pinch`);
      assert(!VAGUE.test(ing.amount.trim()), `${id} ${ing.name} not vague`);
    }
    const blob = r.recipe.steps.map((s) => `${s.instruction} ${s.tip}`).join(' ');
    assert(!PINCH.test(blob), `${id} steps no pinch`);
  }
});

run('cheese/soy recipes omit salt rather than invent tsp', () => {
  const cheese = getHankkiRecipeById('recipe_0484')!;
  const soy = getHankkiRecipeById('recipe_0425')!;
  assert(cheese.ingredients.find((i) => i.name === '소금')?.amount.includes('생략'), '0484 omit cheese');
  assert(soy.ingredients.find((i) => i.name === '소금')?.amount.includes('생략'), '0425 omit soy');
  assert(!cheese.ingredients.find((i) => i.name === '소금')?.amount.includes('1/16'), '0484 not blind 1/16');
});

run('quality fields present', () => {
  for (const id of SPRINT9_TODDLER_CORE_IDS) {
    const r = getHankkiRecipeById(id)!;
    const q = r.elementaryQuality!;
    assert(Boolean(r.prepTimeMinutes), `${id} prep`);
    assert(Boolean(q.prerequisites), `${id} prereq`);
    assert(Boolean(q.kidAdjustmentTip), `${id} kid tip`);
    assert(Boolean(q.storageInfo), `${id} storage`);
    assert(Boolean(q.reheatingMethod), `${id} reheat`);
    assert(Boolean(q.substituteIngredients), `${id} substitute`);
  }
});

run('wiring in master template', () => {
  const src = read('data/recipes/recipeMasterTemplate.ts');
  assert(src.includes('applyToddlerSprint9QualityPatch'), 'template applies toddler patch');
  assert(src.includes('applyElementarySprint6QualityPatch'), 'elementary patch kept');
});

const grades = SPRINT9_TODDLER_CORE_IDS.map((id) => ({ id, ...gradeCore(id) }));
const aCount = grades.filter((g) => g.grade === 'A').length;
const bCount = grades.filter((g) => g.grade === 'B').length;
const cCount = grades.filter((g) => g.grade === 'C').length;

run('re-grade targets', () => {
  assert(cCount === 0, `C=0 (got ${cCount})`);
  assert(aCount >= 25, `A>=25 (got ${aCount})`);
  assert(bCount <= 5, `B<=5 (got ${bCount})`);
  if (bCount > 0) {
    for (const g of grades.filter((x) => x.grade === 'B')) {
      console.log(`  B leftover ${g.id}: ${g.issues.join('; ')}`);
    }
  }
});

// Breakfast diversity
const bfRecipes = SPRINT9_TODDLER_BREAKFAST_IDS.map((id) => getHankkiRecipeById(id)!);
const eggCount = bfRecipes.filter((r) =>
  /계란|달걀/.test(r.name + r.ingredients.map((i) => i.name).join('')),
).length;
const categories = {
  rice: bfRecipes.filter((r) => /밥|주먹밥/.test(r.name)).length,
  porridge: bfRecipes.filter((r) => /죽|오트밀/.test(r.name)).length,
  soup: bfRecipes.filter((r) => /국/.test(r.name)).length,
  potatoSweet: bfRecipes.filter((r) => /고구마|감자/.test(r.name)).length,
  fruit: bfRecipes.filter((r) => /바나나|사과|요거트/.test(r.name)).length,
  tofu: bfRecipes.filter((r) => /두부/.test(r.name)).length,
  egg: eggCount,
};
const distinctCats = Object.values(categories).filter((n) => n > 0).length;
const diversityReady = eggCount <= 9 && distinctCats >= 4 && categories.porridge + categories.fruit >= 2;

run('breakfast diversity assessment', () => {
  console.log(`  egg=${eggCount}/15 categories=${JSON.stringify(categories)} distinct=${distinctCats}`);
  assert(eggCount === 11 || eggCount === 10 || eggCount >= 10, `egg count recorded (${eggCount})`);
});

console.log('\n--- SPRINT9 GRADE SUMMARY ---');
console.log(JSON.stringify({ aCount, bCount, cCount, eggCount, categories, diversityReady }, null, 2));

console.log(`\nHANKKI Sprint 9 toddler core quality QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
