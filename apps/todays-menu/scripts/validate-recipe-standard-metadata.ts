/**
 * Sprint 25 — Validate standardized metadata for all 100 HANKKI recipes.
 *
 * Usage: npm run validate:recipe-metadata
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { validateAllRecipeStandardMetadata } from '../data/recipes/validateRecipeStandardMetadata';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const OUT_DIR = path.resolve(__dirname, '../generated/recipe-standard-metadata');

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

function fieldCompleteness() {
  const fields = [
    'cuisine',
    'dishType',
    'tasteProfile',
    'mealTypes',
    'situationTags',
    'cookingMethods',
    'dietaryTags',
    'mainIngredients',
    'allergyTags',
    'spiceLevel',
    'cookingTime',
    'servings',
    'difficulty',
    'reviewNeeded',
  ] as const;

  const counts: Record<string, number> = {};
  for (const field of fields) counts[field] = 0;

  for (const recipe of HANKKI_RECIPES) {
    const meta = recipe.standardMetadata;
    if (!meta) continue;
    if (meta.cuisine) counts.cuisine++;
    if (meta.dishType) counts.dishType++;
    if (meta.tasteProfile.length > 0) counts.tasteProfile++;
    if (meta.mealTypes.length > 0) counts.mealTypes++;
    if (meta.situationTags.length > 0) counts.situationTags++;
    if (meta.cookingMethods.length > 0) counts.cookingMethods++;
    if (meta.dietaryTags.length > 0) counts.dietaryTags++;
    if (meta.mainIngredients.length > 0) counts.mainIngredients++;
    if (meta.allergyTags.length > 0) counts.allergyTags++;
    if (meta.spiceLevel) counts.spiceLevel++;
    if (typeof meta.cookingTime === 'number') counts.cookingTime++;
    if (typeof meta.servings === 'number') counts.servings++;
    if (meta.difficulty) counts.difficulty++;
    if (typeof meta.reviewNeeded === 'boolean') counts.reviewNeeded++;
  }

  return counts;
}

const production = validateHankkiProductionDb();
const result = validateAllRecipeStandardMetadata();
const total = HANKKI_RECIPES.length;
const completeness = fieldCompleteness();

const reviewList = HANKKI_RECIPES.filter((r) => r.standardMetadata?.reviewNeeded).map((r) => ({
  id: r.id,
  name: r.name,
  notes: r.standardMetadata?.reviewNotes ?? [],
}));

const matrixRows = [
  [
    'id',
    'name',
    'cuisine',
    'dishType',
    'spiceLevel',
    'cookingTime',
    'servings',
    'difficulty',
    'reviewNeeded',
    'situationTags',
    'allergyTags',
  ].join(','),
];

for (const recipe of HANKKI_RECIPES) {
  const m = recipe.standardMetadata;
  matrixRows.push(
    [
      recipe.id,
      `"${recipe.name.replace(/"/g, '""')}"`,
      m?.cuisine ?? '',
      m?.dishType ?? '',
      m?.spiceLevel ?? '',
      m?.cookingTime ?? '',
      m?.servings ?? '',
      m?.difficulty ?? '',
      m?.reviewNeeded ?? '',
      `"${(m?.situationTags ?? []).join('|')}"`,
      `"${(m?.allergyTags ?? []).join('|')}"`,
    ].join(','),
  );
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'recipe-standard-metadata-matrix.csv'), matrixRows.join('\n'));
fs.writeFileSync(
  path.join(OUT_DIR, 'validation-report.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      recipeCount: total,
      productionOk: production.ok,
      standardMetadataOk: result.ok,
      autoCompleteCount: result.autoCompleteCount,
      reviewNeededCount: result.reviewNeededCount,
      issueCount: result.issues.length,
      conflictCount: result.conflicts.length,
      fieldCompleteness: completeness,
      reviewNeededIds: result.reviewNeededIds,
      issues: result.issues,
      conflicts: result.conflicts,
    },
    null,
    2,
  ),
);

console.log('========== HANKKI Standard Metadata (Sprint 25) ==========');
console.log(`recipes: ${total}`);
console.log(`production DB: ${production.ok ? 'PASS' : 'FAIL'}`);
console.log(`standard metadata: ${result.ok ? 'PASS' : 'FAIL'}`);
console.log(`auto-complete (reviewNeeded=false): ${result.autoCompleteCount}/${total}`);
console.log(`manual review flagged: ${result.reviewNeededCount}/${total}`);
console.log(`validation issues: ${result.issues.length}`);
console.log(`name/cuisine-dish conflicts: ${result.conflicts.length}`);
console.log('');
console.log('Field completeness:');
for (const [field, count] of Object.entries(completeness)) {
  console.log(`  ${field}: ${count}/${total} (${pct(count, total)})`);
}
console.log('');
console.log('AI settings readiness:');
console.log('  WIRED (engine uses standardMetadata):');
console.log('    - preferredCuisines → standardMetadata.cuisine');
console.log('    - spicyLevel → standardMetadata.spiceLevel + tasteProfile');
console.log('    - maxCookTime → standardMetadata.cookingTime');
console.log('    - householdSize → standardMetadata.servings + situationTags');
console.log('    - avoidedFoods/customAvoidedFood → allergyTags + ingredient names (hard exclusion)');
console.log('    - customFavoriteFood → mainIngredients + ingredient names/iconKeys (preference score)');
console.log('  DATA READY (partial / review flagged):');
console.log('    - dietaryTags (healthy preference)');
console.log('    - dishType (inferred from cuisine prefs for noodle/rice/snack)');
console.log('');
if (reviewList.length) {
  console.log('Review-needed recipes (first 20):');
  for (const item of reviewList.slice(0, 20)) {
    console.log(`  [${item.id}] ${item.name}: ${item.notes.join('; ')}`);
  }
  if (reviewList.length > 20) {
    console.log(`  ... and ${reviewList.length - 20} more`);
  }
}
if (result.issues.length) {
  console.log('\nIssues:');
  for (const issue of result.issues.slice(0, 30)) {
    console.log(`  [${issue.recipeId} ${issue.recipeName}] ${issue.code}: ${issue.message}`);
  }
  if (result.issues.length > 30) {
    console.log(`  ... and ${result.issues.length - 30} more (see validation-report.json)`);
  }
}
console.log(`\nReport: ${path.join(OUT_DIR, 'validation-report.json')}`);
console.log('========================================================');

process.exitCode = production.ok && result.ok ? 0 : 1;
