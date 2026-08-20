/**
 * Sprint 58.2 ??Batch 3 lunch catalog expansion QA.
 * Run: npm run test:meal-catalog-batch3
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import {
  BATCH_3_CANDIDATE_AUDIT,
  BATCH_3_EXCLUDED_COUNT,
  BATCH_3_SELECTED_COUNT,
} from '../data/recipes/batches/batch18CandidateAudit';
import { BATCH_18_INPUTS } from '../data/recipes/batches/batch18';
import { BATCH_19_INPUTS } from '../data/recipes/batches/batch19';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resetRecipeMealTimeMetadataCache } from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import {
  buildFoodTypeGapAnalysis,
  buildMealTimePoolSummary,
  countFoodTypeInSlot,
} from '../services/recommendation/mealTime/computeMealTimePools';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'generated/meal-catalog-expansion');

const BATCH_3_IDS = Array.from({ length: 30 }, (_, i) =>
  `recipe_${String(221 + i).padStart(4, '0')}`,
);

const BATCH_3_CATEGORY_TARGETS: Record<string, number> = {
  rice_bowl: 8,
  fried_rice: 6,
  noodle: 6,
  gimbap: 4,
  sandwich_lunch: 3,
  quick_korean: 3,
};

const LUNCH_FOOD_TYPES = [
  'rice_bowl',
  'fried_rice',
  'noodle',
  'gimbap',
  'sandwich_lunch',
  'quick_korean',
] as const;

const CATEGORY_FOR_RECIPE: Record<string, string> = {};
for (const c of BATCH_3_CANDIDATE_AUDIT) {
  if (c.status === 'selected' && c.recipeId) {
    CATEGORY_FOR_RECIPE[c.recipeId] = c.category;
  }
}

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`??${msg}`);
  } else {
    console.log(`??${msg}`);
  }
}

function normalizeTitle(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function tokenize(name: string): Set<string> {
  return new Set(name.replace(/\s+/g, '').split(/(?=[ê°€-??)/).filter((t) => t.length >= 2));
}

console.log('Sprint 58.2 meal-catalog-batch3 QA ??start\n');

const batch3Recipes = HANKKI_RECIPES.filter((r) => BATCH_3_IDS.includes(r.id));
assert(batch3Recipes.length === 30, `batch3 recipes exactly 30 (got ${batch3Recipes.length})`);
assert(HANKKI_RECIPES.length === 304, `catalog total 304 (got ${HANKKI_RECIPES.length})`);
assert(BATCH_18_INPUTS.length === 15, 'batch18 count 15');
assert(BATCH_19_INPUTS.length === 15, 'batch19 count 15');
assert(BATCH_3_SELECTED_COUNT === 30, 'candidate audit selected 30');
assert(BATCH_3_EXCLUDED_COUNT === 15, 'candidate audit excluded 15');

for (const id of BATCH_3_IDS) {
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  assert(recipe != null, `recipe exists ${id}`);
  if (recipe) {
    assert(recipe.mealType.includes('?ì‹¬'), `${id} mealType ?ì‹¬`);
    assert(recipe.recipe.steps.length >= 4, `${id} steps >= 4`);
    assert(recipe.ingredients.length > 0, `${id} ingredients non-empty`);
    assert(recipe.time <= 30, `${id} time <= 30min (got ${recipe.time})`);
  }
}

const allIds = HANKKI_RECIPES.map((r) => r.id);
assert(new Set(allIds).size === allIds.length, 'duplicate id 0');

const allNames = HANKKI_RECIPES.map((r) => r.name);
const normalized = allNames.map(normalizeTitle);
assert(new Set(allNames).size === allNames.length, 'duplicate exact title 0');
assert(new Set(normalized).size === normalized.length, 'duplicate normalized title 0');

const nearDuplicates: Array<{ id: string; name: string; similarTo: string; similarId: string }> = [];
for (const recipe of batch3Recipes) {
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
assert(production.recipeCount === 304, `production count 304 (got ${production.recipeCount})`);

const unitAudit = auditRecipeIngredientUnits(HANKKI_RECIPES);
assert(unitAudit.invalid === 0, `ingredient unit invalid 0 (got ${unitAudit.invalid})`);

resetRecipeMealTimeMetadataCache();
let lunchHigh = 0;
const lunchScores: Array<{ id: string; name: string; score: number }> = [];
const foodTypeCounts: Record<string, number> = {};

for (const recipe of batch3Recipes) {
  const fit = deriveMealTimeFit(recipe);
  const score = fit.fit.lunch;
  lunchScores.push({ id: recipe.id, name: recipe.name, score });
  if (score >= 0.7) lunchHigh += 1;

  const cat = CATEGORY_FOR_RECIPE[recipe.id];
  if (cat) {
    foodTypeCounts[cat] = (foodTypeCounts[cat] ?? 0) + 1;
  }
}

assert(lunchHigh >= 26, `lunch >= 0.7 at least 26/30 (got ${lunchHigh})`);

for (const [cat, target] of Object.entries(BATCH_3_CATEGORY_TARGETS)) {
  const got = foodTypeCounts[cat] ?? 0;
  assert(got === target, `batch category ${cat}: ${got}/${target}`);
}

const allEntries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));
const poolSummary = buildMealTimePoolSummary(allEntries);
const lunchPool = poolSummary.find((p) => p.slot === 'lunch');
if (lunchPool) {
  console.log(
    `   lunch pool ??.7=${lunchPool.counts[0.7]} ??.5=${lunchPool.counts[0.5]} gap070=${lunchPool.gap070}`,
  );
}

const lunchFoodTypeAfter: Record<string, number> = {};
for (const ft of LUNCH_FOOD_TYPES) {
  lunchFoodTypeAfter[ft] = countFoodTypeInSlot(allEntries, 'lunch', ft);
  console.log(`   lunch ${ft} (??.7): ${lunchFoodTypeAfter[ft]}`);
}

const foodTypeGaps = buildFoodTypeGapAnalysis(allEntries);
const lunchGaps = foodTypeGaps.filter((g) => g.slot === 'lunch' && g.target > 0);
for (const g of lunchGaps) {
  console.log(`   lunch gap ${g.foodType}: ${g.current}/${g.target} (gap=${g.gap})`);
}

assert(lunchFoodTypeAfter.rice_bowl >= 16, `rice_bowl >= 16 (got ${lunchFoodTypeAfter.rice_bowl})`);
assert(lunchFoodTypeAfter.fried_rice >= 12, `fried_rice >= 12 (got ${lunchFoodTypeAfter.fried_rice})`);
assert(lunchFoodTypeAfter.gimbap >= 6, `gimbap >= 6 (got ${lunchFoodTypeAfter.gimbap})`);
assert(lunchFoodTypeAfter.sandwich_lunch >= 5, `sandwich_lunch >= 5 (got ${lunchFoodTypeAfter.sandwich_lunch})`);

fs.mkdirSync(outDir, { recursive: true });

const imageGap = batch3Recipes.map((r) => ({
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

const cumulativeHeroRecipes = HANKKI_RECIPES.filter((r) =>
  CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id) && r.id <= 'recipe_0250',
).map((r) => ({
  recipeId: r.id,
  title: r.name,
  heroImageKey: r.heroImageKey,
  batch:
    r.id >= 'recipe_0221'
      ? 'batch3'
      : r.id >= 'recipe_0191'
        ? 'batch2'
        : 'batch1',
}));
const cumulativeWaiverCount = cumulativeHeroRecipes.length;

fs.writeFileSync(
  path.join(outDir, 'batch3-image-gap.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.2',
      batch3Count: imageGap.length,
      cumulativeWaiverCount,
      recipes: imageGap,
    },
    null,
    2,
  ),
  'utf8',
);
assert(imageGap.every((r) => r.heroPipelineWaiver), 'all batch3 on hero waiver list');
assert(cumulativeWaiverCount === 90, `cumulative hero waiver through batch3 90 (got ${cumulativeWaiverCount})`);

const candidateAuditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.2',
  selected: BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
};

fs.writeFileSync(
  path.join(outDir, 'batch3-candidate-audit.json'),
  JSON.stringify(candidateAuditPayload, null, 2),
  'utf8',
);

const auditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.2',
  catalogBefore: 220,
  catalogAfter: 300,
  selected: BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
  lunchHighCount: lunchHigh,
  lunchScores,
  foodTypeCounts,
  lunchFoodTypeAfter,
  poolSummary,
  baselineLunch070: 108,
  afterLunch070: lunchPool?.counts[0.7] ?? 0,
  nearDuplicates,
  lunchFoodTypeGaps: lunchGaps,
  cumulativeHeroWaiverCount: cumulativeWaiverCount,
};

fs.writeFileSync(
  path.join(outDir, 'batch3-audit.json'),
  JSON.stringify(auditPayload, null, 2),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'batch3-audit.json')), 'batch3-audit.json written');
assert(fs.existsSync(path.join(outDir, 'batch3-image-gap.json')), 'batch3-image-gap.json written');
assert(
  fs.existsSync(path.join(outDir, 'batch3-candidate-audit.json')),
  'batch3-candidate-audit.json written',
);

console.log('\nSprint 58.2 meal-catalog-batch3 QA ??done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
