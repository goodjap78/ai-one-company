/**
 * Phase 2 draft QA — does not mutate production catalog (still 300).
 * Run: npx tsx scripts/test-meal-kit-phase2-draft.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  PHASE2_HERO_STAGING_DIR,
  PHASE2_MEAL_KIT_DRAFT_RECIPES,
  PHASE2_MEAL_KIT_SEARCH_KEYWORDS,
} from '../data/recipes/batches/batch24MealKitPhase2Draft';
import { validateHankkiRecipe } from '../data/recipes/validateHankkiProduction';
import { validateAllRecipeStandardMetadata } from '../data/recipes/validateRecipeStandardMetadata';
import { findCatalogDuplicate } from './mealKitAudit/catalogNameMatch';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import { auditRecipeIngredientUnits } from '../services/recipes/ingredientUnitAudit';
import { getShoppingKeyword } from '../services/shopping/shoppingKeyword';
import { MEAL_TIME_SLOT_KEYS } from '../types/mealTimeRecommendation';

const APP_ROOT = path.resolve(__dirname, '..');
const HERO_DIR = path.join(APP_ROOT, PHASE2_HERO_STAGING_DIR);
const INGREDIENT_ICON_KEYS = new Set(
  fs
    .readdirSync(path.join(APP_ROOT, 'assets', 'ingredients'))
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.replace(/\.png$/i, '')),
);

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

const catalog = HANKKI_RECIPES.map((recipe) => ({
  recipeId: recipe.id,
  recipeName: recipe.name,
}));

console.log('Phase 2 meal-kit draft QA — start\n');
assert(HANKKI_RECIPES.length === 304, `production catalog 304 (got ${HANKKI_RECIPES.length})`);
assert(PHASE2_MEAL_KIT_DRAFT_RECIPES.length === 4, 'batch24 count 4');

const productionIds = new Set(HANKKI_RECIPES.map((recipe) => recipe.id));
const productionNames = new Set(HANKKI_RECIPES.map((recipe) => recipe.name.trim()));
const productionHeroes = new Set(HANKKI_RECIPES.map((recipe) => recipe.heroImageKey));

for (const recipe of PHASE2_MEAL_KIT_DRAFT_RECIPES) {
  console.log(`\n— ${recipe.id} ${recipe.name}`);

  const issues = validateHankkiRecipe(recipe);
  assert(issues.length === 0, `schema ${recipe.id} (${issues.map((i) => i.code).join(', ') || 'ok'})`);

  assert(productionIds.has(recipe.id), `id ${recipe.id} merged into production`);
  assert(productionNames.has(recipe.name), `name ${recipe.name} merged into production`);
  assert(productionHeroes.has(recipe.heroImageKey), `heroKey ${recipe.heroImageKey} in production`);

  const dup = findCatalogDuplicate(
    recipe.name,
    catalog.filter((row) => row.recipeId !== recipe.id),
  );
  const allowedNear: Record<string, string[]> = {
    불고기전골: ['불고기'],
  };
  const nearOk =
    dup.status === 'POSSIBLE_DUPLICATE' &&
    Boolean(dup.matchedRecipeName) &&
    (allowedNear[recipe.name] ?? []).includes(dup.matchedRecipeName ?? '');
  assert(
    dup.status === 'NEW' || nearOk,
    `duplicate ${recipe.name} = ${dup.status} ${dup.matchedRecipeName ?? ''}`,
  );
  if (nearOk) {
    console.log(
      `   concept-distinct near-alias: ${recipe.name} ↔ ${dup.matchedRecipeName} (${dup.reason})`,
    );
  }

  const metaIssues = validateAllRecipeStandardMetadata([recipe]);
  assert(metaIssues.ok, `metadata ${recipe.id} (${metaIssues.issues.map((i) => i.code).join(', ') || 'ok'})`);
  assert(recipe.standardMetadata.reviewNeeded === false, `reviewNeeded false ${recipe.id}`);

  const unit = auditRecipeIngredientUnits([recipe]);
  assert(unit.invalid === 0, `units valid ${recipe.id} (invalid ${unit.invalid})`);

  const mains = recipe.ingredients.filter((item) => item.group === 'main');
  const subs = recipe.ingredients.filter((item) => item.group === 'sub');
  const seasonings = recipe.ingredients.filter((item) => item.group === 'seasoning');
  assert(mains.length > 0 && subs.length > 0 && seasonings.length > 0, `groups ${recipe.id}`);

  for (const ing of recipe.ingredients) {
    assert(
      INGREDIENT_ICON_KEYS.has(ing.iconKey),
      `iconKey ${ing.iconKey} registered`,
    );
    const keyword = getShoppingKeyword(ing.name);
    assert(Boolean(keyword.trim()), `shopping keyword for ${ing.name}`);
  }

  const identityMains = ['쭈꾸미', '소고기', '배추', '오징어', '새우', '무', '버섯'];
  for (const ing of recipe.ingredients) {
    if (identityMains.includes(ing.name)) {
      assert(ing.group !== 'seasoning', `${ing.name} not seasoning`);
    }
  }

  const fit = deriveMealTimeFit(recipe);
  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const score = fit.fit[slot];
    assert(Number.isFinite(score) && score >= 0 && score <= 1, `meal-time ${slot} ${recipe.id}`);
  }
  assert(fit.fit.dinner >= 0.55, `dinner-primary ${recipe.id} (${fit.fit.dinner.toFixed(2)})`);
  assert(fit.fit.breakfast < 0.55, `breakfast conservative ${recipe.id}`);

  const heroJpg = path.join(HERO_DIR, `${recipe.heroImageKey}.jpg`);
  const heroPng = path.join(HERO_DIR, `${recipe.heroImageKey}.png`);
  const productionHero = path.join(APP_ROOT, 'assets', 'meals', `${recipe.heroImageKey}.jpg`);
  assert(fs.existsSync(heroJpg) || fs.existsSync(heroPng), `staged hero ${recipe.heroImageKey}`);
  assert(fs.existsSync(productionHero), `production hero ${recipe.heroImageKey}.jpg`);

  const keyword = PHASE2_MEAL_KIT_SEARCH_KEYWORDS[recipe.id as keyof typeof PHASE2_MEAL_KIT_SEARCH_KEYWORDS];
  assert(keyword.includes(recipe.name) && keyword.includes('밀키트'), `meal-kit keyword ${recipe.id}`);
}

const near = [
  { draft: '밀푀유나베', peers: ['두부버섯전골'] },
  { draft: '불고기전골', peers: ['불고기'] },
  { draft: '쭈꾸미볶음', peers: ['오징어볶음', '오징어간장볶음', '버터오징어볶음', '낙지비빔밥'] },
  { draft: '해물탕', peers: ['오뎅탕', '해물파전', '청양어묵탕'] },
];
for (const row of near) {
  for (const peer of row.peers) {
    assert(productionNames.has(peer), `peer exists ${peer}`);
    assert(row.draft !== peer, `distinct from ${peer}`);
  }
}

console.log('\n==========================================');
if (failed > 0) {
  console.error(`FAIL ${failed}`);
  process.exitCode = 1;
} else {
  console.log('PASS');
}
