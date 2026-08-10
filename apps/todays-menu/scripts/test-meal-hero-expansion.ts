/**
 * Sprint 60.14 — Meal hero expansion QA (final 300/300).
 * Run: npm run test:meal-hero-expansion
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { isCatalogExpansionHeroWaiver } from '../data/recipes/catalogExpansionHeroWaiver';
import { parseRegisteredMealKeys } from '../scripts/image-factory/updateMealImageRegistry';
import { PATHS } from '../scripts/image-factory/config';
import {
  MEAL_HERO_EXPANSION_ALL_RECIPE_IDS,
  MEAL_HERO_EXPANSION_BATCHES,
  MEAL_HERO_EXPANSION_PATHS,
} from '../scripts/image-factory/mealHeroExpansionConfig';
import { buildHeroExpansionInventory } from '../scripts/image-factory/buildHeroExpansionInventory';
import {
  buildFinal300HeroAudit,
  buildProtectedHeroHashSnapshot,
  verifyApprovedExpansionProductionHashes,
  verifyProtectedHeroHashesMatch,
  writeFinal300HeroAudit,
} from '../scripts/image-factory/heroExpansionHashSnapshot';
import { countActiveHeroExpansionWaiver } from '../scripts/image-factory/heroExpansionWaiver';
import { parseHankkiRecipeNum } from '../scripts/image-factory/parseHankkiRecipeNum';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function assertBatchProduction(
  batchLabel: string,
  recipeIds: string[],
  registered: Set<string>,
): void {
  let registryMissing = 0;
  let productionMissing = 0;
  for (const recipeId of recipeIds) {
    const recipe = getHankkiRecipeById(recipeId);
    const key = recipe?.heroImageKey ?? '';
    if (!key || !registered.has(key)) registryMissing += 1;
    const prod = path.join(PATHS.mealAssetsDir, `${key}.jpg`);
    if (!fs.existsSync(prod)) productionMissing += 1;
  }
  assert(
    registryMissing === 0,
    `${batchLabel} registry ${recipeIds.length}/${recipeIds.length} (missing ${registryMissing})`,
  );
  assert(
    productionMissing === 0,
    `${batchLabel} production files ${recipeIds.length}/${recipeIds.length}`,
  );
}

function assertBatchHashFile(batchId: string): void {
  const hashPath = path.join(MEAL_HERO_EXPANSION_PATHS.root, `${batchId}-production-hashes.json`);
  if (!fs.existsSync(hashPath)) {
    assert(false, `${batchId} production hash file missing`);
    return;
  }
  const hashFile = JSON.parse(fs.readFileSync(hashPath, 'utf8')) as {
    allMatch: boolean;
    matchCount: number;
    total: number;
  };
  assert(
    hashFile.allMatch && hashFile.matchCount === 20,
    `${batchId} production hashes 20/20 MATCH`,
  );
}

console.log('Sprint 60.14 meal-hero-expansion QA — start\n');

assert(HANKKI_RECIPES.length === 300, `recipes 300 (got ${HANKKI_RECIPES.length})`);
assert(MEAL_HERO_EXPANSION_ALL_RECIPE_IDS.length === 140, `expansion target 140`);
assert(MEAL_HERO_EXPANSION_BATCHES.length === 7, '7 hero batches');
assert(
  MEAL_HERO_EXPANSION_BATCHES.every((b) => b.recipeIds.length === 20),
  'each batch 20 recipes',
);

const inventory = buildHeroExpansionInventory();
assert(inventory.targetCount === 140, 'inventory 140 rows');
assert(inventory.duplicateImageKeys.length === 0, 'duplicate imageKey 0');

const expansionProduction = inventory.summary.productionExists;
assert(
  expansionProduction === 140,
  `expansion production 140/140 (got ${expansionProduction})`,
);

const heroCoverage = 160 + expansionProduction;
assert(heroCoverage === 300, `hero coverage 300/300 (got ${heroCoverage})`);

const protectedSnapshot = buildProtectedHeroHashSnapshot();
assert(protectedSnapshot.count === 160, `protected hero snapshot 160 (got ${protectedSnapshot.count})`);

if (fs.existsSync(MEAL_HERO_EXPANSION_PATHS.hashSnapshotBefore)) {
  const verify = verifyProtectedHeroHashesMatch();
  assert(verify.ok, `protected 160 hashes unchanged (${verify.mismatches.join(', ')})`);
}

const expansionHashVerify = verifyApprovedExpansionProductionHashes();
assert(expansionHashVerify.ok, 'approved expansion production hash snapshots match disk');
for (const batchId of ['batch-1', 'batch-2', 'batch-3', 'batch-4', 'batch-5', 'batch-6', 'batch-7']) {
  assert(
    expansionHashVerify.batches.some((b) => b.batchId === batchId && b.ok),
    `${batchId} production snapshot ok`,
  );
}

const registered = new Set(parseRegisteredMealKeys());
let brokenRegistry = 0;
let fullRegistry = 0;
for (const recipe of HANKKI_RECIPES) {
  if (registered.has(recipe.heroImageKey)) fullRegistry += 1;
  const n = parseHankkiRecipeNum(recipe.id);
  if (n == null || n < 1 || n > 160) continue;
  if (!registered.has(recipe.heroImageKey)) brokenRegistry += 1;
}
assert(brokenRegistry === 0, `broken registry for existing 160: ${brokenRegistry}`);
assert(fullRegistry === 300, `registry coverage 300/300 (got ${fullRegistry})`);

const activeWaiver = countActiveHeroExpansionWaiver();
assert(activeWaiver === 0, `active hero waiver 0 (got ${activeWaiver})`);
const approvedCount = inventory.summary.approvedFromWaiver;
assert(
  activeWaiver + approvedCount === 140,
  `waiver + approved = 140 (${activeWaiver}+${approvedCount})`,
);

assert(!isCatalogExpansionHeroWaiver('recipe_0281'), 'recipe_0281 waiver removed');
assert(!isCatalogExpansionHeroWaiver('recipe_0300'), 'recipe_0300 waiver removed');

for (const batch of MEAL_HERO_EXPANSION_BATCHES) {
  assertBatchProduction(batch.id.replace('-', ''), batch.recipeIds, registered);
  assertBatchHashFile(batch.id);
}

const batch7 = MEAL_HERO_EXPANSION_BATCHES[6];
let resolverProduction = 0;
let resolverBroken = 0;
for (const recipeId of batch7.recipeIds) {
  const recipe = getHankkiRecipeById(recipeId);
  const key = recipe?.heroImageKey ?? '';
  const prodPath = path.join(PATHS.mealAssetsDir, `${key}.jpg`);
  const hasRegistry = key && registered.has(key);
  const hasProd = fs.existsSync(prodPath);
  if (hasRegistry && hasProd) {
    resolverProduction += 1;
  } else {
    resolverBroken += 1;
  }
}
assert(resolverProduction === 20, `batch7 resolver production hero 20/20 (got ${resolverProduction})`);
assert(resolverBroken === 0, `batch7 resolver broken/placeholder ${resolverBroken}`);

let all300Production = 0;
let all300Broken = 0;
for (const recipe of HANKKI_RECIPES) {
  const key = recipe.heroImageKey;
  const prodPath = path.join(PATHS.mealAssetsDir, `${key}.jpg`);
  const ok = registered.has(key) && fs.existsSync(prodPath);
  if (ok) all300Production += 1;
  else all300Broken += 1;
}
assert(all300Production === 300, `all 300 recipes production hero (got ${all300Production})`);
assert(all300Broken === 0, `all 300 placeholder/fallback ${all300Broken}`);

const finalAuditPath = writeFinal300HeroAudit();
const finalAudit = buildFinal300HeroAudit();
assert(fs.existsSync(finalAuditPath), 'final-300-hero-audit.json written');
assert(finalAudit.summary.allOk, `final 300 hero audit allOk (issues: ${finalAudit.issues.length})`);
assert(finalAudit.summary.productionJpg === 300, 'final audit production JPG 300/300');
assert(finalAudit.summary.registryCoverage === 300, 'final audit registry 300/300');
assert(finalAudit.summary.fallbackRecipes === 0, 'final audit fallback 0');

const productionJpgCount = fs
  .readdirSync(PATHS.mealAssetsDir)
  .filter((f) => f.endsWith('.jpg') && !f.startsWith('category_')).length;
console.log(
  `   Hero JPG on disk: ${productionJpgCount} (baseline 160 + ${expansionProduction} expansion)`,
);
console.log(`   Active waiver: ${activeWaiver}`);
console.log(`   Fallback recipes: ${300 - heroCoverage}`);

console.log('\nSprint 60.14 meal-hero-expansion QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} check(s) failed`);
}
