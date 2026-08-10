/**
 * Sprint 60.10 — Meal hero expansion QA.
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
  buildProtectedHeroHashSnapshot,
  verifyApprovedExpansionProductionHashes,
  verifyProtectedHeroHashesMatch,
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

console.log('Sprint 60.10 meal-hero-expansion QA — start\n');

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
  expansionProduction === 100,
  `expansion production 100/140 (got ${expansionProduction})`,
);

const heroCoverage = 160 + expansionProduction;
assert(heroCoverage === 260, `hero coverage 260/300 (got ${heroCoverage})`);

const protectedSnapshot = buildProtectedHeroHashSnapshot();
assert(protectedSnapshot.count === 160, `protected hero snapshot 160 (got ${protectedSnapshot.count})`);

if (fs.existsSync(MEAL_HERO_EXPANSION_PATHS.hashSnapshotBefore)) {
  const verify = verifyProtectedHeroHashesMatch();
  assert(verify.ok, `protected 160 hashes unchanged (${verify.mismatches.join(', ')})`);
}

const expansionHashVerify = verifyApprovedExpansionProductionHashes();
assert(expansionHashVerify.ok, 'approved expansion production hash snapshots match disk');
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-1' && b.ok),
  'batch-1 production snapshot ok',
);
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-2' && b.ok),
  'batch-2 production snapshot ok',
);
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-3' && b.ok),
  'batch-3 production snapshot ok',
);
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-4' && b.ok),
  'batch-4 production snapshot ok',
);
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-5' && b.ok),
  'batch-5 production snapshot ok',
);

const registered = new Set(parseRegisteredMealKeys());
let brokenRegistry = 0;
for (const recipe of HANKKI_RECIPES) {
  const n = parseHankkiRecipeNum(recipe.id);
  if (n == null || n < 1 || n > 160) continue;
  if (!registered.has(recipe.heroImageKey)) brokenRegistry += 1;
}
assert(brokenRegistry === 0, `broken registry for existing 160: ${brokenRegistry}`);

const activeWaiver = countActiveHeroExpansionWaiver();
assert(activeWaiver === 40, `active hero waiver 40 (got ${activeWaiver})`);
const approvedCount = inventory.summary.approvedFromWaiver;
assert(
  activeWaiver + approvedCount === 140,
  `waiver + approved = 140 (${activeWaiver}+${approvedCount})`,
);

assert(!isCatalogExpansionHeroWaiver('recipe_0241'), 'recipe_0241 waiver removed');
assert(isCatalogExpansionHeroWaiver('recipe_0261'), 'recipe_0261 still waived');

const batch1 = MEAL_HERO_EXPANSION_BATCHES[0];
const batch2 = MEAL_HERO_EXPANSION_BATCHES[1];
const batch3 = MEAL_HERO_EXPANSION_BATCHES[2];
const batch4 = MEAL_HERO_EXPANSION_BATCHES[3];
const batch5 = MEAL_HERO_EXPANSION_BATCHES[4];
assertBatchProduction('batch1', batch1.recipeIds, registered);
assertBatchProduction('batch2', batch2.recipeIds, registered);
assertBatchProduction('batch3', batch3.recipeIds, registered);
assertBatchProduction('batch4', batch4.recipeIds, registered);
assertBatchProduction('batch5', batch5.recipeIds, registered);
assertBatchHashFile('batch-1');
assertBatchHashFile('batch-2');
assertBatchHashFile('batch-3');
assertBatchHashFile('batch-4');
assertBatchHashFile('batch-5');

let resolverProduction = 0;
let resolverBroken = 0;
for (const recipeId of batch5.recipeIds) {
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
assert(resolverProduction === 20, `batch5 resolver production hero 20/20 (got ${resolverProduction})`);
assert(resolverBroken === 0, `batch5 resolver broken/placeholder ${resolverBroken}`);

const recipe0261 = getHankkiRecipeById('recipe_0261');
const key0261 = recipe0261?.heroImageKey ?? '';
assert(isCatalogExpansionHeroWaiver('recipe_0261'), 'recipe_0261 waiver/fallback');
const prod0261 = path.join(PATHS.mealAssetsDir, `${key0261}.jpg`);
assert(
  !fs.existsSync(prod0261) || !registered.has(key0261),
  'recipe_0261 production hero not promoted',
);

const productionJpgCount = fs
  .readdirSync(PATHS.mealAssetsDir)
  .filter((f) => f.endsWith('.jpg') && !f.startsWith('category_')).length;
console.log(
  `   Hero JPG on disk: ${productionJpgCount} (baseline 160 + ${expansionProduction} expansion)`,
);
console.log(`   Active waiver: ${activeWaiver}`);
console.log(`   Fallback recipes: ${300 - heroCoverage}`);

console.log('\nSprint 60.10 meal-hero-expansion QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} check(s) failed`);
}
