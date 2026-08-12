/**
 * Sprint R6.5 — Recipe Factory production check (Batch 01 live, Batch 02 plan only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { BATCH_02_PLAN, BATCH_02_STATUS } from '../data/recipes/batches/batch02.plan';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const APP_ROOT = path.resolve(__dirname, '..');
const result = validateHankkiProductionDb();

const missingHero = result.heroImageKeys.filter(
  (key) => !fs.existsSync(path.join(APP_ROOT, 'assets/meals', `${key}.jpg`)),
);
const missingIng = result.missingIngredientAssets.filter(
  (rel) => !fs.existsSync(path.join(APP_ROOT, rel)),
);
const missingStep = result.missingStepAssets.filter(
  (rel) => !fs.existsSync(path.join(APP_ROOT, rel)),
);

const batch02Conflict = BATCH_02_PLAN.filter((plan) =>
  HANKKI_RECIPES.some((recipe) => recipe.id === plan.id),
);

console.log('========== R6.5 Recipe Factory ==========');
console.log(
  `Batch 01 inserted: ${HANKKI_RECIPES.map((r) => `${r.id} ${r.name}`).join(', ')}`,
);
console.log(`count: ${result.recipeCount}`);
console.log(`validation: ${result.ok ? 'PASS' : 'FAIL'}`);
console.log(`missing hero images: ${missingHero.length}`);
console.log(`missing ingredient icons: ${missingIng.length}`);
console.log(`missing step images: ${missingStep.length}`);
console.log(
  `Batch 02 plan: ${BATCH_02_PLAN.length} recipes (inserted=${BATCH_02_STATUS.insertedIntoProduction})`,
);
console.log(
  `Batch 02 ids: ${BATCH_02_PLAN.map((p) => `${p.id} ${p.name}`).join(', ')}`,
);
console.log(
  `Batch 02 id conflicts with live DB: ${batch02Conflict.length ? batch02Conflict.map((c) => c.id).join(',') : 'none'}`,
);
if (result.issues.length) {
  for (const issue of result.issues.slice(0, 20)) {
    console.log(`  ! [${issue.recipeId}] ${issue.code}: ${issue.message}`);
  }
}
console.log('=========================================');

process.exitCode =
  result.ok && batch02Conflict.length === 0 && missingHero.length === 0 ? 0 : 1;
