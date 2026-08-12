/**
 * Sprint 58 — Batch 1 breakfast catalog expansion QA.
 * Run: npm run test:meal-catalog-batch1
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import {
  BATCH_1_CANDIDATE_AUDIT,
  BATCH_1_EXCLUDED_COUNT,
  BATCH_1_SELECTED_COUNT,
} from '../data/recipes/batches/batch14CandidateAudit';
import { BATCH_14_INPUTS } from '../data/recipes/batches/batch14';
import { BATCH_15_INPUTS } from '../data/recipes/batches/batch15';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resetRecipeMealTimeMetadataCache } from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import { classifyRecipeFoodTypes } from '../services/recommendation/mealTime/classifyMealFoodType';
import { buildMealTimePoolSummary } from '../services/recommendation/mealTime/computeMealTimePools';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'generated/meal-catalog-expansion');

const BATCH_1_IDS = Array.from({ length: 30 }, (_, i) =>
  `recipe_${String(161 + i).padStart(4, '0')}`,
);

const FOOD_TYPE_TARGETS: Record<string, number> = {
  porridge: 6,
  egg: 6,
  sandwich_toast: 5,
  yogurt_fruit: 5,
  salad_light: 4,
  light_soup: 4,
};

const CATEGORY_FOR_RECIPE: Record<string, string> = {};
for (const c of BATCH_1_CANDIDATE_AUDIT) {
  if (c.status === 'selected' && c.recipeId) {
    CATEGORY_FOR_RECIPE[c.recipeId] = c.category;
  }
}

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function normalizeTitle(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

console.log('Sprint 58 meal-catalog-batch1 QA — start\n');

const batch1Recipes = HANKKI_RECIPES.filter((r) => BATCH_1_IDS.includes(r.id));
assert(batch1Recipes.length === 30, `batch1 recipes exactly 30 (got ${batch1Recipes.length})`);
assert(HANKKI_RECIPES.length === 300, `catalog total 300 (got ${HANKKI_RECIPES.length})`);
assert(BATCH_14_INPUTS.length === 15, 'batch14 count 15');
assert(BATCH_15_INPUTS.length === 15, 'batch15 count 15');
assert(BATCH_1_SELECTED_COUNT === 30, 'candidate audit selected 30');
assert(BATCH_1_EXCLUDED_COUNT === 15, 'candidate audit excluded 15');

for (const id of BATCH_1_IDS) {
  assert(BATCH_1_IDS.indexOf(id) === BATCH_1_IDS.lastIndexOf(id), `unique batch id ${id}`);
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  assert(recipe != null, `recipe exists ${id}`);
  if (recipe) {
    assert(recipe.mealType.includes('아침'), `${id} mealType 아침`);
    assert(recipe.recipe.steps.length >= 4, `${id} steps >= 4`);
    assert(recipe.ingredients.length > 0, `${id} ingredients non-empty`);
  }
}

const allNames = HANKKI_RECIPES.map((r) => r.name);
const normalized = allNames.map(normalizeTitle);
assert(new Set(allNames).size === allNames.length, 'duplicate exact title 0');
assert(new Set(normalized).size === normalized.length, 'duplicate normalized title 0');

const production = validateHankkiProductionDb();
assert(production.ok, `validateHankkiProductionDb ok (issues: ${production.issues.length})`);
assert(production.recipeCount === 300, `production count 300 (got ${production.recipeCount})`);

const unitAudit = auditRecipeIngredientUnits(HANKKI_RECIPES);
assert(unitAudit.invalid === 0, `ingredient unit invalid 0 (got ${unitAudit.invalid})`);

resetRecipeMealTimeMetadataCache();
let breakfastHigh = 0;
const foodTypeCounts: Record<string, number> = {};

for (const recipe of batch1Recipes) {
  const fit = deriveMealTimeFit(recipe);
  if (fit.fit.breakfast >= 0.7) breakfastHigh += 1;

  const text = [recipe.name, ...recipe.category, ...recipe.tags].join(' ');
  const types = classifyRecipeFoodTypes(recipe, text.toLowerCase());
  const cat = CATEGORY_FOR_RECIPE[recipe.id];
  if (cat) {
    foodTypeCounts[cat] = (foodTypeCounts[cat] ?? 0) + 1;
  }
}

assert(breakfastHigh >= 24, `breakfast >= 0.7 at least 24/30 (got ${breakfastHigh})`);

for (const [cat, target] of Object.entries(FOOD_TYPE_TARGETS)) {
  const got = foodTypeCounts[cat] ?? 0;
  assert(got === target, `food type ${cat}: ${got}/${target}`);
}

const allEntries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));
const poolSummary = buildMealTimePoolSummary(allEntries);
const breakfastPool = poolSummary.find((p) => p.slot === 'breakfast');
if (breakfastPool) {
  console.log(
    `   breakfast pool ≥0.7=${breakfastPool.counts[0.7]} ≥0.5=${breakfastPool.counts[0.5]} gap070=${breakfastPool.gap070}`,
  );
  assert(breakfastPool.counts[0.7] >= 45, `breakfast pool >= 0.7 at least 45 (got ${breakfastPool.counts[0.7]})`);
}

fs.mkdirSync(outDir, { recursive: true });

const imageGap = batch1Recipes.map((r) => ({
  recipeId: r.id,
  title: r.name,
  heroImageKey: r.heroImageKey,
  productionAssetExpected: `assets/meals/${r.heroImageKey}.jpg`,
  productionAssetExists: fs.existsSync(
    path.join(appRoot, 'assets/meals', `${r.heroImageKey}.jpg`),
  ),
  heroPipelineWaiver: CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id),
  needsDedicatedHero: true,
}));

fs.writeFileSync(
  path.join(outDir, 'batch1-image-gap.json'),
  JSON.stringify({ recordedAt: new Date().toISOString(), sprint: '58', recipes: imageGap }, null, 2),
  'utf8',
);
assert(imageGap.every((r) => r.heroPipelineWaiver), 'all batch1 on hero waiver list');

const auditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58',
  catalogBefore: 160,
  catalogAfter: 300,
  selected: BATCH_1_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_1_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
  breakfastHighCount: breakfastHigh,
  foodTypeCounts,
  poolSummary,
  baselineBreakfast070: 31,
  afterBreakfast070: breakfastPool?.counts[0.7] ?? 0,
};

fs.writeFileSync(
  path.join(outDir, 'batch1-audit.json'),
  JSON.stringify(auditPayload, null, 2),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'batch1-audit.json')), 'batch1-audit.json written');
assert(fs.existsSync(path.join(outDir, 'batch1-image-gap.json')), 'batch1-image-gap.json written');

console.log('\nSprint 58 meal-catalog-batch1 QA — done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
