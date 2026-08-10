/**
 * Sprint 60 — Meal hero expansion QA.
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

console.log('Sprint 60.2 meal-hero-expansion QA — start\n');

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
  expansionProduction === 20,
  `batch1 expansion production 20/140 (got ${expansionProduction})`,
);

const heroCoverage = 160 + expansionProduction;
assert(heroCoverage === 180, `hero coverage 180/300 (got ${heroCoverage})`);

const protectedSnapshot = buildProtectedHeroHashSnapshot();
assert(protectedSnapshot.count === 160, `protected hero snapshot 160 (got ${protectedSnapshot.count})`);

if (fs.existsSync(MEAL_HERO_EXPANSION_PATHS.hashSnapshotBefore)) {
  const verify = verifyProtectedHeroHashesMatch();
  assert(verify.ok, `protected 160 hashes unchanged (${verify.mismatches.join(', ')})`);
}

const registered = new Set(parseRegisteredMealKeys());
let brokenRegistry = 0;
for (const recipe of HANKKI_RECIPES) {
  const n = parseHankkiRecipeNum(recipe.id);
  if (n == null || n < 1 || n > 160) continue;
  if (!registered.has(recipe.heroImageKey)) brokenRegistry += 1;
}
assert(brokenRegistry === 0, `broken registry for existing 160: ${brokenRegistry}`);

const activeWaiver = countActiveHeroExpansionWaiver();
assert(activeWaiver === 120, `active hero waiver 120 (got ${activeWaiver})`);
const approvedCount = inventory.summary.approvedFromWaiver;
assert(
  activeWaiver + approvedCount === 140,
  `waiver + approved = 140 (${activeWaiver}+${approvedCount})`,
);

if (fs.existsSync(MEAL_HERO_EXPANSION_PATHS.inventory)) {
  const saved = JSON.parse(
    fs.readFileSync(MEAL_HERO_EXPANSION_PATHS.inventory, 'utf8'),
  ) as { targetCount: number };
  assert(saved.targetCount === 140, 'inventory file on disk');
}

const batch1 = MEAL_HERO_EXPANSION_BATCHES[0];
assert(batch1.recipeIds[0] === 'recipe_0161', 'batch1 starts 0161');
assert(batch1.recipeIds[19] === 'recipe_0180', 'batch1 ends 0180');

let batch1RegistryMissing = 0;
let batch1ProductionMissing = 0;
for (const recipeId of batch1.recipeIds) {
  const recipe = getHankkiRecipeById(recipeId);
  const key = recipe?.heroImageKey ?? '';
  if (!key || !registered.has(key)) batch1RegistryMissing += 1;
  const prod = path.join(PATHS.mealAssetsDir, `${key}.jpg`);
  if (!fs.existsSync(prod)) batch1ProductionMissing += 1;
}
assert(batch1RegistryMissing === 0, `batch1 registry/resolver 20/20 (missing ${batch1RegistryMissing})`);
assert(batch1ProductionMissing === 0, `batch1 production files 20/20`);

const hashPath = path.join(MEAL_HERO_EXPANSION_PATHS.root, 'batch-1-production-hashes.json');
if (fs.existsSync(hashPath)) {
  const hashFile = JSON.parse(fs.readFileSync(hashPath, 'utf8')) as {
    allMatch: boolean;
    matchCount: number;
    total: number;
  };
  assert(hashFile.allMatch && hashFile.matchCount === 20, 'batch1 production hashes 20/20 MATCH');
}

const batch1AuditPath = path.join(MEAL_HERO_EXPANSION_PATHS.auditDir, 'batch-1-audit.json');
if (fs.existsSync(batch1AuditPath)) {
  const audit = JSON.parse(fs.readFileSync(batch1AuditPath, 'utf8')) as {
    rows: Array<{ reviewPath: string | null }>;
  };
  const withReview = audit.rows.filter((r) => r.reviewPath).length;
  console.log(`   Batch 1 review candidates: ${withReview}/20`);
}

const productionJpgCount = fs
  .readdirSync(PATHS.mealAssetsDir)
  .filter((f) => f.endsWith('.jpg') && !f.startsWith('category_')).length;
const expansionApprovedProduction = inventory.rows.filter((r) => r.productionAssetExists).length;
console.log(
  `   Hero JPG on disk: ${productionJpgCount} (baseline 160 + ${expansionApprovedProduction} expansion)`,
);
console.log(`   Active waiver: ${activeWaiver}`);

console.log('\nSprint 60.2 meal-hero-expansion QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} check(s) failed`);
}
