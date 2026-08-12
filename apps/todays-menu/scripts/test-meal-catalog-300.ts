/**
 * Sprint 58.4 — Full 300-recipe catalog integrity QA.
 * Run: npm run test:meal-catalog-300
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../data/recipes/catalogExpansionHeroWaiver';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resetRecipeMealTimeMetadataCache } from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import { buildFoodTypeGapAnalysis, buildMealTimePoolSummary } from '../services/recommendation/mealTime/computeMealTimePools';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { validateAllRecipeStandardMetadata } from '../data/recipes/validateRecipeStandardMetadata';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';
import { MEAL_TIME_SLOT_KEYS } from '../types/mealTimeRecommendation';

const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'generated/meal-catalog-expansion');

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

console.log('Sprint 58.4 meal-catalog-300 QA — start\n');

assert(HANKKI_RECIPES.length === 300, `catalog exactly 300 (got ${HANKKI_RECIPES.length})`);

const allIds = HANKKI_RECIPES.map((r) => r.id);
assert(new Set(allIds).size === 300, 'duplicate recipeId 0');

const normalized = HANKKI_RECIPES.map((r) => normalizeTitle(r.name));
assert(new Set(normalized).size === 300, 'duplicate normalized title 0');

let emptyIngredients = 0;
let emptySteps = 0;
let stepMismatch = 0;

for (const recipe of HANKKI_RECIPES) {
  if (!recipe.ingredients.length) emptyIngredients += 1;
  if (!recipe.recipe.steps.length) emptySteps += 1;

  const stepText = recipe.recipe.steps
    .map((s) => `${s.title} ${s.instruction}`)
    .join(' ');
  for (const ing of recipe.ingredients) {
    if (ing.name.length >= 2 && !stepText.includes(ing.name.slice(0, 2))) {
      const short = ing.name.replace(/\s/g, '').slice(0, 2);
      if (short.length >= 2 && !stepText.replace(/\s/g, '').includes(short)) {
        stepMismatch += 1;
      }
    }
  }
}

assert(emptyIngredients === 0, `empty ingredients 0 (got ${emptyIngredients})`);
assert(emptySteps === 0, `empty steps 0 (got ${emptySteps})`);
console.log(`   ingredient/step heuristic mismatches: ${stepMismatch}`);

const production = validateHankkiProductionDb();
assert(production.ok, `production db ok (issues: ${production.issues.length})`);
assert(production.recipeCount === 300, `production count 300`);

const meta = validateAllRecipeStandardMetadata();
assert(meta.ok, `metadata issues 0 (got ${meta.issues.length})`);

const unitAudit = auditRecipeIngredientUnits(HANKKI_RECIPES);
assert(unitAudit.invalid === 0, `ingredient unit invalid 0 (got ${unitAudit.invalid})`);

resetRecipeMealTimeMetadataCache();
const entries = HANKKI_RECIPES.map((r) => deriveMealTimeFit(r));

let invalidFit = 0;
let invalidPrimary = 0;
for (const e of entries) {
  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const s = e.fit[slot];
    if (!Number.isFinite(s) || s < 0 || s > 1) invalidFit += 1;
  }
  if (!MEAL_TIME_SLOT_KEYS.includes(e.primaryMealTime)) invalidPrimary += 1;
}

assert(invalidFit === 0, `all MealTimeFit valid (invalid=${invalidFit})`);
assert(invalidPrimary === 0, `all primaryMealTime valid (invalid=${invalidPrimary})`);

const poolSummary = buildMealTimePoolSummary(entries);
const foodTypeGaps = buildFoodTypeGapAnalysis(entries);
const remainingGaps = foodTypeGaps.filter((g) => g.target > 0 && g.gap > 0);

const waiverCount = HANKKI_RECIPES.filter((r) => CATALOG_EXPANSION_HERO_WAIVER_IDS.has(r.id)).length;
assert(waiverCount === 140, `hero waiver 140 (got ${waiverCount})`);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'catalog-300-audit.json'),
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      sprint: '58.4',
      recipeCount: 300,
      poolSummary,
      foodTypeGaps: foodTypeGaps.filter((g) => g.target > 0),
      remainingGaps,
      cumulativeHeroWaiver: waiverCount,
      metadataIssues: meta.issues.length,
      productionIssues: production.issues.length,
      unitInvalid: unitAudit.invalid,
    },
    null,
    2,
  ),
  'utf8',
);

assert(fs.existsSync(path.join(outDir, 'catalog-300-audit.json')), 'catalog-300-audit.json written');

console.log('\nSprint 58.4 meal-catalog-300 QA — done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
