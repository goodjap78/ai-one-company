/**
 * Sprint R6-1 — validate HANKKI production recipe database.
 *
 * Usage: npx tsx scripts/validate-hankki-production.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './recipe-assets/config';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const result = validateHankkiProductionDb();

const missingIngredientOnDisk = result.missingIngredientAssets.filter(
  (rel) => !fs.existsSync(path.join(PATHS.appRoot, rel)),
);
const missingStepOnDisk = result.missingStepAssets.filter(
  (rel) => !fs.existsSync(path.join(PATHS.appRoot, rel)),
);
const missingHeroOnDisk = result.heroImageKeys.filter(
  (key) => !fs.existsSync(path.join(PATHS.mealAssetsDir, `${key}.jpg`)),
);

console.log('========== HANKKI Production DB ==========');
console.log(`recipe count: ${result.recipeCount}`);
console.log(`validation: ${result.ok ? 'PASS' : 'FAIL'}`);
if (result.issues.length) {
  console.log('\nissues:');
  for (const issue of result.issues) {
    console.log(
      `  [${issue.recipeId} ${issue.recipeName}] ${issue.code}: ${issue.message}`,
    );
  }
}

console.log('\nmissing assets (on disk):');
console.log(`  ingredient icons: ${missingIngredientOnDisk.length}`);
console.log(`  step images: ${missingStepOnDisk.length}`);
console.log(`  hero meals: ${missingHeroOnDisk.length}`);
if (missingHeroOnDisk.length) {
  console.log(`  missing heroes: ${missingHeroOnDisk.join(', ')}`);
}
console.log('==========================================');

process.exitCode = result.ok ? 0 : 1;
