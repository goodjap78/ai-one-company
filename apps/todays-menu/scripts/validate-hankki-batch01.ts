/**
 * Sprint R6-1 Batch 01 — verify HANKKI production recipes (no RN asset requires).
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../data/recipes/validateHankkiProduction';

const APP_ROOT = path.resolve(__dirname, '..');
const result = validateHankkiProductionDb();
const ids = HANKKI_RECIPES.map((r) => r.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

const missingHero: string[] = [];
const missingIngredient = new Set<string>();
const missingStep = new Set<string>();

for (const recipe of HANKKI_RECIPES) {
  const heroPath = path.join(APP_ROOT, 'assets/meals', `${recipe.heroImageKey}.jpg`);
  if (!fs.existsSync(heroPath)) missingHero.push(recipe.heroImageKey);

  for (const ing of recipe.ingredients) {
    const p = path.join(APP_ROOT, 'assets/ingredients', `${ing.iconKey}.png`);
    if (!fs.existsSync(p)) missingIngredient.add(ing.iconKey);
  }
  for (const step of recipe.recipe.steps) {
    const p = path.join(APP_ROOT, 'assets/recipe-steps', `${step.imageKey}.jpg`);
    if (!fs.existsSync(p)) missingStep.add(step.imageKey);
  }
}

const detailShapeOk = HANKKI_RECIPES.every((recipe) => {
  const hasGroups =
    recipe.ingredients.some((i) => i.group === 'main') &&
    recipe.ingredients.some((i) => i.group === 'sub') &&
    recipe.ingredients.some((i) => i.group === 'seasoning');
  const stepsOk =
    recipe.recipe.steps.length >= 4 &&
    recipe.recipe.steps.length <= 6 &&
    recipe.recipe.steps.every(
      (s) => s.title && s.instruction && s.imageKey && s.tip,
    );
  return (
    hasGroups &&
    stepsOk &&
    recipe.heroImageKey &&
    recipe.tags.length > 0 &&
    recipe.situation.length > 0 &&
    recipe.aiTags.length > 0 &&
    recipe.recommendationMessages.length === 5
  );
});

console.log('========== R6-1 Batch 01 ==========');
console.log(
  `recipes: ${HANKKI_RECIPES.map((r) => `${r.id} ${r.name}`).join(', ')}`,
);
console.log(`count: ${result.recipeCount}`);
console.log(`validation: ${result.ok ? 'PASS' : 'FAIL'}`);
console.log(`duplicate ids: ${duplicates.length ? duplicates.join(',') : 'none'}`);
console.log(`detail shape: ${detailShapeOk ? 'PASS' : 'FAIL'}`);
console.log(
  `recommendationMessages: ${HANKKI_RECIPES.map((r) => r.recommendationMessages.length).join(',')}`,
);
console.log(`Home catalog source: HANKKI_RECIPES via goldMealCatalog (001–010)`);
console.log(`Recipe Detail source: getHankkiRecipeById / getFlagshipGoldMealById`);
console.log(`missing hero images: ${missingHero.length}${missingHero.length ? ` (${missingHero.join(', ')})` : ''}`);
console.log(`missing ingredient icons: ${missingIngredient.size}`);
console.log(`missing step images: ${missingStep.size}`);
if (result.issues.length) {
  for (const issue of result.issues) {
    console.log(`  ! [${issue.recipeId}] ${issue.code}: ${issue.message}`);
  }
}
console.log('==================================');

process.exitCode = result.ok && detailShapeOk && duplicates.length === 0 ? 0 : 1;
