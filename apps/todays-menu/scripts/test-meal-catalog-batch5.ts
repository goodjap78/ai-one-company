/**
 * Sprint 58.4 — Final Batch catalog expansion QA (+20 → 300).
 * Run: npm run test:meal-catalog-batch5
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import {
  BATCH_5_CANDIDATE_AUDIT,
  BATCH_5_EXCLUDED_COUNT,
  BATCH_5_SELECTED_COUNT,
} from '../data/recipes/batches/batch22CandidateAudit';
import { BATCH_22_INPUTS } from '../data/recipes/batches/batch22';
import { BATCH_23_INPUTS } from '../data/recipes/batches/batch23';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resetRecipeMealTimeMetadataCache } from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import {
  buildFoodTypeGapAnalysis,
  buildMealTimePoolSummary,
  countFoodTypeInSlot,
} from '../services/recommendation/mealTime/computeMealTimePools';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { validateAllRecipeStandardMetadata } from '../data/recipes/validateRecipeStandardMetadata';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'generated/meal-catalog-expansion');

const BATCH_5_IDS = Array.from({ length: 20 }, (_, i) =>
  `recipe_${String(281 + i).padStart(4, '0')}`,
);

const BATCH_5_CATEGORY_TARGETS: Record<string, number> = {
  pasta_western: 2,
  sandwich_lunch: 3,
  gimbap: 3,
  rice_bowl: 3,
  breakfast_light_soup: 1,
  breakfast_toast: 2,
  breakfast_porridge: 1,
  lateNight_light: 1,
  lateNight_light_late: 2,
  wildcard_quick_korean: 1,
  wildcard_fish_bowl: 1,
};

const CATEGORY_FOR_RECIPE: Record<string, string> = {};
for (const c of BATCH_5_CANDIDATE_AUDIT) {
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

console.log('Sprint 58.4 meal-catalog-batch5 QA — start\n');

const batch5Recipes = HANKKI_RECIPES.filter((r) => BATCH_5_IDS.includes(r.id));
assert(batch5Recipes.length === 20, `batch5 recipes exactly 20 (got ${batch5Recipes.length})`);
assert(HANKKI_RECIPES.length === 300, `catalog total 300 (got ${HANKKI_RECIPES.length})`);
assert(BATCH_22_INPUTS.length === 10, 'batch22 count 10');
assert(BATCH_23_INPUTS.length === 10, 'batch23 count 10');
assert(BATCH_5_SELECTED_COUNT === 20, 'candidate audit selected 20');
assert(BATCH_5_EXCLUDED_COUNT === 20, 'candidate audit excluded 20');

for (const id of BATCH_5_IDS) {
  const recipe = HANKKI_RECIPES.find((r) => r.id === id);
  assert(recipe != null, `recipe exists ${id}`);
  if (recipe) {
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

const nearDuplicates: Array<{ id: string; name: string; similarTo: string; similarId: string }> =
  [];
for (const recipe of batch5Recipes) {
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

const meta = validateAllRecipeStandardMetadata();
assert(meta.ok, `standard metadata ok (issues: ${meta.issues.length})`);

const unitAudit = auditRecipeIngredientUnits(HANKKI_RECIPES);
assert(unitAudit.invalid === 0, `ingredient unit invalid 0 (got ${unitAudit.invalid})`);

resetRecipeMealTimeMetadataCache();

const beforeEntries = HANKKI_RECIPES.filter((r) => !BATCH_5_IDS.includes(r.id)).map((r) =>
  deriveMealTimeFit(r),
);
const pastaBefore = countFoodTypeInSlot(beforeEntries, 'dinner', 'pasta_western');
const sandwichBefore = countFoodTypeInSlot(beforeEntries, 'lunch', 'sandwich_lunch');
const gimbapBefore = countFoodTypeInSlot(beforeEntries, 'lunch', 'gimbap');
const riceBowlBefore = countFoodTypeInSlot(beforeEntries, 'lunch', 'rice_bowl');

const foodTypeCounts: Record<string, number> = {};
let slotHigh = 0;

for (const recipe of batch5Recipes) {
  const fit = deriveMealTimeFit(recipe);
  const cat = CATEGORY_FOR_RECIPE[recipe.id];
  if (cat) {
    foodTypeCounts[cat] = (foodTypeCounts[cat] ?? 0) + 1;
  }

  const primary = fit.primaryMealTime;
  const score = fit.fit[primary];
  if (score >= 0.7) slotHigh += 1;

  if (recipe.id === 'recipe_0281' || recipe.id === 'recipe_0282') {
    assert(fit.fit.dinner >= 0.7, `${recipe.id} dinner >= 0.7 (got ${fit.fit.dinner})`);
  }
  if (recipe.id >= 'recipe_0283' && recipe.id <= 'recipe_0291' && recipe.id !== 'recipe_0299') {
    const slot = recipe.mealType.includes('아침')
      ? 'breakfast'
      : recipe.mealType.includes('야식')
        ? 'lateNight'
        : 'lunch';
    assert(fit.fit[slot] >= 0.7, `${recipe.id} ${slot} >= 0.7 (got ${fit.fit[slot]})`);
  }
}

assert(slotHigh >= 18, `primary slot >= 0.7 at least 18/20 (got ${slotHigh})`);

for (const [cat, target] of Object.entries(BATCH_5_CATEGORY_TARGETS)) {
  const got = foodTypeCounts[cat] ?? 0;
  assert(got === target, `batch category ${cat}: ${got}/${target}`);
}

const allEntries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));
const poolSummary = buildMealTimePoolSummary(allEntries);
const foodTypeGaps = buildFoodTypeGapAnalysis(allEntries);
const gapsWithTarget = foodTypeGaps.filter((g) => g.target > 0 && g.gap > 0);

for (const p of poolSummary) {
  console.log(
    `   ${p.slot} pool ≥0.7=${p.counts[0.7]} ≥0.5=${p.counts[0.5]} gap070=${p.gap070}`,
  );
}

const pastaAfter = countFoodTypeInSlot(allEntries, 'dinner', 'pasta_western');
const sandwichAfter = countFoodTypeInSlot(allEntries, 'lunch', 'sandwich_lunch');
const gimbapAfter = countFoodTypeInSlot(allEntries, 'lunch', 'gimbap');
const riceBowlAfter = countFoodTypeInSlot(allEntries, 'lunch', 'rice_bowl');

console.log(
  `   dinner pasta_western: ${pastaBefore} → ${pastaAfter} (Δ${pastaAfter - pastaBefore})`,
);
console.log(
  `   lunch sandwich_lunch: ${sandwichBefore} → ${sandwichAfter} (Δ${sandwichAfter - sandwichBefore})`,
);
console.log(`   lunch gimbap: ${gimbapBefore} → ${gimbapAfter} (Δ${gimbapAfter - gimbapBefore})`);
console.log(
  `   lunch rice_bowl: ${riceBowlBefore} → ${riceBowlAfter} (Δ${riceBowlAfter - riceBowlBefore})`,
);

for (const g of gapsWithTarget) {
  console.log(`   gap ${g.slot}/${g.foodType}: ${g.current}/${g.target} (remaining=${g.gap})`);
}

assert(pastaAfter >= 12, `dinner pasta_western >= 12 (got ${pastaAfter})`);
assert(sandwichAfter >= 8, `lunch sandwich_lunch >= 8 (got ${sandwichAfter})`);
assert(gimbapAfter >= 8, `lunch gimbap >= 8 (got ${gimbapAfter})`);
assert(riceBowlAfter >= 18, `lunch rice_bowl >= 18 (got ${riceBowlAfter})`);

fs.mkdirSync(outDir, { recursive: true });

const imageGap = batch5Recipes.map((r) => ({
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

const cumulativeHeroGap = HANKKI_RECIPES.filter((r) =>
  CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id),
).length;

fs.writeFileSync(
  path.join(outDir, 'batch5-image-gap.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.4',
      batch5Count: imageGap.length,
      cumulativeWaiverCount: cumulativeHeroGap,
      recipes: imageGap,
    },
    null,
    2,
  ),
  'utf8',
);
assert(imageGap.every((r) => r.heroPipelineWaiver), 'all batch5 on hero waiver list');
assert(cumulativeHeroGap === 140, `cumulative hero waiver 140 (got ${cumulativeHeroGap})`);

fs.writeFileSync(
  path.join(outDir, 'batch5-candidate-audit.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.4',
      selected: BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
      excluded: BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
    },
    null,
    2,
  ),
  'utf8',
);

const auditPayload = {
  recordedAt: new Date().toISOString(),
  sprint: '58.4',
  catalogBefore: 280,
  catalogAfter: 300,
  selected: BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'selected'),
  excluded: BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded'),
  foodTypeCounts,
  slotHighCount: slotHigh,
  poolSummary,
  foodTypeGaps: foodTypeGaps.filter((g) => g.target > 0),
  remainingGaps: gapsWithTarget,
  pastaWestern: { before: pastaBefore, after: pastaAfter },
  sandwichLunch: { before: sandwichBefore, after: sandwichAfter },
  gimbap: { before: gimbapBefore, after: gimbapAfter },
  riceBowl: { before: riceBowlBefore, after: riceBowlAfter },
  nearDuplicates,
  cumulativeHeroWaiverCount: cumulativeHeroGap,
};

fs.writeFileSync(
  path.join(outDir, 'batch5-audit.json'),
  JSON.stringify(auditPayload, null, 2),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'batch5-audit.json')), 'batch5-audit.json written');
assert(fs.existsSync(path.join(outDir, 'batch5-image-gap.json')), 'batch5-image-gap.json written');
assert(
  fs.existsSync(path.join(outDir, 'batch5-candidate-audit.json')),
  'batch5-candidate-audit.json written',
);

console.log('\nSprint 58.4 meal-catalog-batch5 QA — done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
