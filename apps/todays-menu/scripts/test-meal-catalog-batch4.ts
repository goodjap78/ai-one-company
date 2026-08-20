/**
 * Sprint 58.3 ??Batch 4 dinner catalog expansion QA.
 * Run: npm run test:meal-catalog-batch4
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import {
  BATCH_4_CANDIDATE_AUDIT,
  BATCH_4_EXCLUDED_COUNT,
  BATCH_4_SELECTED_COUNT,
} from '../data/recipes/batches/batch20CandidateAudit';
import { BATCH_20_INPUTS } from '../data/recipes/batches/batch20';
import { BATCH_21_INPUTS } from '../data/recipes/batches/batch21';
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

const BATCH_4_IDS = Array.from({ length: 30 }, (_, i) =>
  `recipe_${String(251 + i).padStart(4, '0')}`,
);

const BATCH_4_CATEGORY_TARGETS: Record<string, number> = {
  soup_stew: 7,
  meat: 7,
  grilled: 5,
  fish_seafood: 4,
  pasta_western: 4,
  family_side_combo: 3,
};

const DINNER_TAXONOMY_MAP: Record<string, string> = {
  soup_stew: 'soup_stew',
  meat: 'meat',
  grilled: 'grilled',
  fish_seafood: 'fish',
  pasta_western: 'pasta_western',
  family_side_combo: 'side_dish_combo',
};

const CATEGORY_FOR_RECIPE: Record<string, string> = {};
for (const c of BATCH_4_CANDIDATE_AUDIT) {
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

console.log('Sprint 58.3 meal-catalog-batch4 QA ??start\n');

const batch4Recipes = HANKKI_RECIPES.filter((r) => BATCH_4_IDS.includes(r.id));
assert(batch4Recipes.length === 30, `batch4 recipes exactly 30 (got ${batch4Recipes.length})`);
assert(HANKKI_RECIPES.length === 304, `catalog total 304 (got ${HANKKI_RECIPES.length})`);
assert(BATCH_20_INPUTS.length === 15, 'batch20 count 15');
assert(BATCH_21_INPUTS.length === 15, 'batch21 count 15');
assert(BATCH_4_SELECTED_COUNT === 30, 'candidate audit selected 30');
assert(BATCH_4_EXCLUDED_COUNT === 15, 'candidate audit excluded 15');

for (const id of BATCH_4_IDS) {
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  assert(recipe != null, `recipe exists ${id}`);
  if (recipe) {
    assert(recipe.mealType.includes('?€??), `${id} mealType ?€??);
    assert(recipe.recipe.steps.length >= 4, `${id} steps >= 4`);
    assert(recipe.ingredients.length > 0, `${id} ingredients non-empty`);
    assert(recipe.time <= 40, `${id} time <= 40min (got ${recipe.time})`);
  }
}

const allIds = HANKKI_RECIPES.map((r) => r.id);
assert(new Set(allIds).size === allIds.length, 'duplicate id 0');

const allNames = HANKKI_RECIPES.map((r) => r.name);
const normalized = allNames.map(normalizeTitle);
assert(new Set(allNames).size === allNames.length, 'duplicate exact title 0');
assert(new Set(normalized).size === normalized.length, 'duplicate normalized title 0');

const nearDuplicates: Array<{ id: string; name: string; similarTo: string; similarId: string }> = [];
for (const recipe of batch4Recipes) {
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

const beforeEntries = HANKKI_RECIPES.filter((r) => !BATCH_4_IDS.includes(r.id)).map((r) =>
  deriveMealTimeFit(r),
);
const dinnerFoodTypeBefore: Record<string, number> = {};
for (const [cat, tax] of Object.entries(DINNER_TAXONOMY_MAP)) {
  dinnerFoodTypeBefore[cat] = countFoodTypeInSlot(beforeEntries, 'dinner', tax as any);
}

let dinnerHigh = 0;
const dinnerScores: Array<{ id: string; name: string; score: number }> = [];
const foodTypeCounts: Record<string, number> = {};

for (const recipe of batch4Recipes) {
  const fit = deriveMealTimeFit(recipe);
  const score = fit.fit.dinner;
  dinnerScores.push({ id: recipe.id, name: recipe.name, score });
  if (score >= 0.7) dinnerHigh += 1;

  const cat = CATEGORY_FOR_RECIPE[recipe.id];
  if (cat) {
    foodTypeCounts[cat] = (foodTypeCounts[cat] ?? 0) + 1;
  }
}

assert(dinnerHigh >= 27, `dinner >= 0.7 at least 27/30 (got ${dinnerHigh})`);

for (const [cat, target] of Object.entries(BATCH_4_CATEGORY_TARGETS)) {
  const got = foodTypeCounts[cat] ?? 0;
  assert(got === target, `batch category ${cat}: ${got}/${target}`);
}

const allEntries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));
const poolSummary = buildMealTimePoolSummary(allEntries);
const dinnerPool = poolSummary.find((p) => p.slot === 'dinner');
if (dinnerPool) {
  console.log(
    `   dinner pool ??.7=${dinnerPool.counts[0.7]} ??.5=${dinnerPool.counts[0.5]} gap070=${dinnerPool.gap070}`,
  );
}

const dinnerFoodTypeAfter: Record<string, number> = {};
const dinnerFoodTypeDelta: Record<string, number> = {};
for (const [cat, tax] of Object.entries(DINNER_TAXONOMY_MAP)) {
  const after = countFoodTypeInSlot(allEntries, 'dinner', tax as any);
  dinnerFoodTypeAfter[cat] = after;
  dinnerFoodTypeDelta[cat] = after - (dinnerFoodTypeBefore[cat] ?? 0);
  console.log(
    `   dinner ${cat}: ${dinnerFoodTypeBefore[cat]} ??${after} (?${dinnerFoodTypeDelta[cat]})`,
  );
}

const foodTypeGaps = buildFoodTypeGapAnalysis(allEntries);
const dinnerGaps = foodTypeGaps.filter((g) => g.slot === 'dinner' && g.target > 0);
for (const g of dinnerGaps) {
  console.log(`   dinner gap ${g.foodType}: ${g.current}/${g.target} (gap=${g.gap})`);
}

assert(dinnerFoodTypeAfter.grilled >= 11, `grilled >= 11 (got ${dinnerFoodTypeAfter.grilled})`);
assert(dinnerFoodTypeAfter.pasta_western >= 10, `pasta_western >= 10 (got ${dinnerFoodTypeAfter.pasta_western})`);

fs.mkdirSync(outDir, { recursive: true });

const imageGap = batch4Recipes.map((r) => ({
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

const cumulativeHeroGap = HANKKI_RECIPES.filter(
  (r) => CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id) && r.id <= 'recipe_0280',
).length;

fs.writeFileSync(
  path.join(outDir, 'batch4-image-gap.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.3',
      batch4Count: imageGap.length,
      cumulativeWaiverCount: cumulativeHeroGap,
      recipes: imageGap,
    },
    null,
    2,
  ),
  'utf8',
);
assert(imageGap.every((r) => r.heroPipelineWaiver), 'all batch4 on hero waiver list');
assert(cumulativeHeroGap === 120, `cumulative hero waiver through batch4 120 (got ${cumulativeHeroGap})`);

fs.writeFileSync(
  path.join(outDir, 'batch4-candidate-audit.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.3',
      selected: BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
      excluded: BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
    },
    null,
    2,
  ),
  'utf8',
);

const auditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.3',
  catalogBefore: 250,
  catalogAfter: 300,
  selected: BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
  dinnerHighCount: dinnerHigh,
  dinnerScores,
  foodTypeCounts,
  dinnerFoodTypeBefore,
  dinnerFoodTypeAfter,
  dinnerFoodTypeDelta,
  poolSummary,
  baselineDinner070: 115,
  afterDinner070: dinnerPool?.counts[0.7] ?? 0,
  nearDuplicates,
  dinnerFoodTypeGaps: dinnerGaps,
  cumulativeHeroWaiverCount: cumulativeHeroGap,
};

fs.writeFileSync(
  path.join(outDir, 'batch4-audit.json'),
  JSON.stringify(auditPayload, null, 2),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'batch4-audit.json')), 'batch4-audit.json written');
assert(fs.existsSync(path.join(outDir, 'batch4-image-gap.json')), 'batch4-image-gap.json written');
assert(
  fs.existsSync(path.join(outDir, 'batch4-candidate-audit.json')),
  'batch4-candidate-audit.json written',
);

console.log('\nSprint 58.3 meal-catalog-batch4 QA ??done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
