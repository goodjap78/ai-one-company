/**
 * Sprint 60.12 — Meal hero expansion QA.
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

console.log('Sprint 60.12 meal-hero-expansion QA — start\n');

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
  expansionProduction === 120,
  `expansion production 120/140 (got ${expansionProduction})`,
);

const heroCoverage = 160 + expansionProduction;
assert(heroCoverage === 280, `hero coverage 280/300 (got ${heroCoverage})`);

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
assert(
  expansionHashVerify.batches.some((b) => b.batchId === 'batch-6' && b.ok),
  'batch-6 production snapshot ok',
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
assert(activeWaiver === 20, `active hero waiver 20 (got ${activeWaiver})`);
const approvedCount = inventory.summary.approvedFromWaiver;
assert(
  activeWaiver + approvedCount === 140,
  `waiver + approved = 140 (${activeWaiver}+${approvedCount})`,
);

assert(!isCatalogExpansionHeroWaiver('recipe_0261'), 'recipe_0261 waiver removed');
assert(isCatalogExpansionHeroWaiver('recipe_0281'), 'recipe_0281 still waived');

const batch1 = MEAL_HERO_EXPANSION_BATCHES[0];
const batch2 = MEAL_HERO_EXPANSION_BATCHES[1];
const batch3 = MEAL_HERO_EXPANSION_BATCHES[2];
const batch4 = MEAL_HERO_EXPANSION_BATCHES[3];
const batch5 = MEAL_HERO_EXPANSION_BATCHES[4];
const batch6 = MEAL_HERO_EXPANSION_BATCHES[5];
assertBatchProduction('batch1', batch1.recipeIds, registered);
assertBatchProduction('batch2', batch2.recipeIds, registered);
assertBatchProduction('batch3', batch3.recipeIds, registered);
assertBatchProduction('batch4', batch4.recipeIds, registered);
assertBatchProduction('batch5', batch5.recipeIds, registered);
assertBatchProduction('batch6', batch6.recipeIds, registered);
assertBatchHashFile('batch-1');
assertBatchHashFile('batch-2');
assertBatchHashFile('batch-3');
assertBatchHashFile('batch-4');
assertBatchHashFile('batch-5');
assertBatchHashFile('batch-6');

const recipe0266HashPath = path.join(
  MEAL_HERO_EXPANSION_PATHS.root,
  'batch-6-production-hashes.json',
);
if (fs.existsSync(recipe0266HashPath)) {
  const hashFile = JSON.parse(fs.readFileSync(recipe0266HashPath, 'utf8')) as {
    rows: Array<{ recipeId: string; productionSha256: string }>;
  };
  const row0266 = hashFile.rows.find((r) => r.recipeId === 'recipe_0266');
  assert(
    row0266?.productionSha256?.startsWith('7a4a736e'),
    `recipe_0266 production hash is regenerated image (got ${row0266?.productionSha256?.slice(0, 12) ?? '—'})`,
  );
  assert(
    !row0266?.productionSha256?.startsWith('5b8f3432'),
    'recipe_0266 not using no-plate legacy hash',
  );
}

let resolverProduction = 0;
let resolverBroken = 0;
for (const recipeId of batch6.recipeIds) {
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
assert(resolverProduction === 20, `batch6 resolver production hero 20/20 (got ${resolverProduction})`);
assert(resolverBroken === 0, `batch6 resolver broken/placeholder ${resolverBroken}`);

assert(isCatalogExpansionHeroWaiver('recipe_0281'), 'recipe_0281 waiver/fallback');
const recipe0281 = getHankkiRecipeById('recipe_0281');
const key0281 = recipe0281?.heroImageKey ?? '';
const prod0281 = path.join(PATHS.mealAssetsDir, `${key0281}.jpg`);
assert(
  !fs.existsSync(prod0281) || !registered.has(key0281),
  'recipe_0281 production hero not promoted',
);

const productionJpgCount = fs
  .readdirSync(PATHS.mealAssetsDir)
  .filter((f) => f.endsWith('.jpg') && !f.startsWith('category_')).length;
console.log(
  `   Hero JPG on disk: ${productionJpgCount} (baseline 160 + ${expansionProduction} expansion)`,
);
console.log(`   Active waiver: ${activeWaiver}`);
console.log(`   Fallback recipes: ${300 - heroCoverage}`);

console.log('\nSprint 60.12 meal-hero-expansion QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} check(s) failed`);
}
