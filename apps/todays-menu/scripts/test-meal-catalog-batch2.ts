/**
 * Sprint 58.1 — Batch 2 late night catalog expansion QA.
 * Run: npm run test:meal-catalog-batch2
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import {
  BATCH_2_CANDIDATE_AUDIT,
  BATCH_2_EXCLUDED_COUNT,
  BATCH_2_SELECTED_COUNT,
} from '../data/recipes/batches/batch16CandidateAudit';
import { BATCH_16_INPUTS } from '../data/recipes/batches/batch16';
import { BATCH_17_INPUTS } from '../data/recipes/batches/batch17';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resetRecipeMealTimeMetadataCache } from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import { classifyRecipeFoodTypes } from '../services/recommendation/mealTime/classifyMealFoodType';
import {
  buildFoodTypeGapAnalysis,
  buildMealTimePoolSummary,
  countFoodTypeInSlot,
} from '../services/recommendation/mealTime/computeMealTimePools';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'generated/meal-catalog-expansion');

const BATCH_2_IDS = Array.from({ length: 30 }, (_, i) =>
  `recipe_${String(191 + i).padStart(4, '0')}`,
);

const BATCH_2_CATEGORY_TARGETS: Record<string, number> = {
  ramen_noodle: 8,
  bunsik: 6,
  spicy_quick: 5,
  light_late: 5,
  anju: 3,
  snack: 3,
};

const CATEGORY_FOR_RECIPE: Record<string, string> = {};
for (const c of BATCH_2_CANDIDATE_AUDIT) {
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

function tokenize(name: string): Set<string> {
  return new Set(name.replace(/\s+/g, '').split(/(?=[가-힣])/).filter((t) => t.length >= 2));
}

console.log('Sprint 58.1 meal-catalog-batch2 QA — start\n');

const batch2Recipes = HANKKI_RECIPES.filter((r) => BATCH_2_IDS.includes(r.id));
assert(batch2Recipes.length === 30, `batch2 recipes exactly 30 (got ${batch2Recipes.length})`);
assert(HANKKI_RECIPES.length === 300, `catalog total 300 (got ${HANKKI_RECIPES.length})`);
assert(BATCH_16_INPUTS.length === 15, 'batch16 count 15');
assert(BATCH_17_INPUTS.length === 15, 'batch17 count 15');
assert(BATCH_2_SELECTED_COUNT === 30, 'candidate audit selected 30');
assert(BATCH_2_EXCLUDED_COUNT === 15, 'candidate audit excluded 15');

for (const id of BATCH_2_IDS) {
  assert(BATCH_2_IDS.indexOf(id) === BATCH_2_IDS.lastIndexOf(id), `unique batch id ${id}`);
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  assert(recipe != null, `recipe exists ${id}`);
  if (recipe) {
    assert(recipe.mealType.includes('야식'), `${id} mealType 야식`);
    assert(recipe.recipe.steps.length >= 4, `${id} steps >= 4`);
    assert(recipe.ingredients.length > 0, `${id} ingredients non-empty`);
    assert(recipe.time <= 25, `${id} time <= 25min (got ${recipe.time})`);
  }
}

const allIds = HANKKI_RECIPES.map((r) => r.id);
assert(new Set(allIds).size === allIds.length, 'duplicate id 0');

const allNames = HANKKI_RECIPES.map((r) => r.name);
const normalized = allNames.map(normalizeTitle);
assert(new Set(allNames).size === allNames.length, 'duplicate exact title 0');
assert(new Set(normalized).size === normalized.length, 'duplicate normalized title 0');

const nearDuplicates: Array<{ id: string; name: string; similarTo: string; similarId: string }> = [];
for (const recipe of batch2Recipes) {
  const tokens = tokenize(recipe.name);
  for (const other of HANKKI_RECIPES) {
    if (other.id === recipe.id) continue;
    if (normalizeTitle(other.name) === normalizeTitle(recipe.name)) continue;
    const otherTokens = tokenize(other.name);
    const overlap = [...tokens].filter((t) => otherTokens.has(t)).length;
    const ratio = overlap / Math.max(tokens.size, otherTokens.size, 1);
    if (ratio >= 0.85 && overlap >= 2) {
      nearDuplicates.push({
        id: recipe.id,
        name: recipe.name,
        similarTo: other.name,
        similarId: other.id,
      });
    }
  }
}
console.log(`   near-duplicate pairs reported: ${nearDuplicates.length}`);

const production = validateHankkiProductionDb();
assert(production.ok, `validateHankkiProductionDb ok (issues: ${production.issues.length})`);
assert(production.recipeCount === 300, `production count 300 (got ${production.recipeCount})`);

const unitAudit = auditRecipeIngredientUnits(HANKKI_RECIPES);
assert(unitAudit.invalid === 0, `ingredient unit invalid 0 (got ${unitAudit.invalid})`);

resetRecipeMealTimeMetadataCache();
let lateNightHigh = 0;
const lateNightScores: Array<{ id: string; name: string; score: number }> = [];
const foodTypeCounts: Record<string, number> = {};

for (const recipe of batch2Recipes) {
  const fit = deriveMealTimeFit(recipe);
  const score = fit.fit.lateNight;
  lateNightScores.push({ id: recipe.id, name: recipe.name, score });
  if (score >= 0.7) lateNightHigh += 1;

  const cat = CATEGORY_FOR_RECIPE[recipe.id];
  if (cat) {
    foodTypeCounts[cat] = (foodTypeCounts[cat] ?? 0) + 1;
  }
}

assert(lateNightHigh >= 24, `lateNight >= 0.7 at least 24/30 (got ${lateNightHigh})`);

for (const [cat, target] of Object.entries(BATCH_2_CATEGORY_TARGETS)) {
  const got = foodTypeCounts[cat] ?? 0;
  assert(got === target, `batch category ${cat}: ${got}/${target}`);
}

const allEntries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));
const poolSummary = buildMealTimePoolSummary(allEntries);
const lateNightPool = poolSummary.find((p) => p.slot === 'lateNight');
if (lateNightPool) {
  console.log(
    `   lateNight pool ≥0.7=${lateNightPool.counts[0.7]} ≥0.5=${lateNightPool.counts[0.5]} gap070=${lateNightPool.gap070}`,
  );
  assert(lateNightPool.counts[0.7] >= 40, `lateNight pool >= 0.7 at least 40 (got ${lateNightPool.counts[0.7]})`);
}

const ramenLateNight = countFoodTypeInSlot(allEntries, 'lateNight', 'ramen');
const lightLateCount = countFoodTypeInSlot(allEntries, 'lateNight', 'light_late');
console.log(`   catalog lateNight ramen (≥0.7): ${ramenLateNight}`);
console.log(`   catalog lateNight light_late (≥0.7): ${lightLateCount}`);
assert(ramenLateNight >= 12, `lateNight ramen >= 12 (got ${ramenLateNight})`);
assert(lightLateCount >= 6, `lateNight light_late >= 6 (got ${lightLateCount})`);

const foodTypeGaps = buildFoodTypeGapAnalysis(allEntries);
const lateNightRamenGap = foodTypeGaps.find(
  (g) => g.slot === 'lateNight' && g.foodType === 'ramen',
);
const lateNightLightGap = foodTypeGaps.find(
  (g) => g.slot === 'lateNight' && g.foodType === 'light_late',
);
if (lateNightRamenGap) {
  assert(lateNightRamenGap.gap === 0, `lateNight ramen gap closed (gap=${lateNightRamenGap.gap})`);
}
if (lateNightLightGap) {
  assert(lateNightLightGap.gap === 0, `lateNight light_late gap closed (gap=${lateNightLightGap.gap})`);
}

fs.mkdirSync(outDir, { recursive: true });

const imageGap = batch2Recipes.map((r) => ({
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
  path.join(outDir, 'batch2-image-gap.json'),
  JSON.stringify({ recordedAt: new Date().toISOString(), sprint: '58.1', recipes: imageGap }, null, 2),
  'utf8',
);
assert(imageGap.every((r) => r.heroPipelineWaiver), 'all batch2 on hero waiver list');

const candidateAuditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.1',
  selected: BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
};

fs.writeFileSync(
  path.join(outDir, 'batch2-candidate-audit.json'),
  JSON.stringify(candidateAuditPayload, null, 2),
  'utf8',
);

const auditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.1',
  catalogBefore: 190,
  catalogAfter: 300,
  selected: BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
  lateNightHighCount: lateNightHigh,
  lateNightScores,
  foodTypeCounts,
  catalogLateNightRamen: ramenLateNight,
  catalogLateNightLightLate: lightLateCount,
  poolSummary,
  baselineLateNight070: 31,
  afterLateNight070: lateNightPool?.counts[0.7] ?? 0,
  nearDuplicates,
  foodTypeGaps: foodTypeGaps.filter((g) => g.slot === 'lateNight'),
};

fs.writeFileSync(
  path.join(outDir, 'batch2-audit.json'),
  JSON.stringify(auditPayload, null, 2),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'batch2-audit.json')), 'batch2-audit.json written');
assert(fs.existsSync(path.join(outDir, 'batch2-image-gap.json')), 'batch2-image-gap.json written');
assert(
  fs.existsSync(path.join(outDir, 'batch2-candidate-audit.json')),
  'batch2-candidate-audit.json written',
);

console.log('\nSprint 58.1 meal-catalog-batch2 QA — done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
