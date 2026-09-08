/**
 * Weekly recipeId → /recipe bridge + IngredientsScreen resolution.
 * Avoids services/recipe (meal JPG require() is not valid in Node).
 * Run: npx tsx scripts/audit-weekly-recipe-runtime-routes.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { listElementaryDinnerWeekCandidates } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { listToddlerBreakfastWeekCandidates } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { listToddlerDinnerWeekCandidates } from '../data/recipes/toddlerDinnerWeeklyPlan';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { getMasterRecipeById } from '../recipes';
import type { Recipe } from '../data/recipes/types';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

type Pool = { label: string; ids: string[] };

function uniqueIds(candidates: { recipe: { id: string } }[]): string[] {
  return [...new Set(candidates.map((c) => c.recipe.id))];
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function hasRenderableDetail(recipe: Recipe): boolean {
  return (
    Boolean(recipe.name?.trim()) &&
    Boolean(recipe.image?.trim() || recipe.heroImageKey?.trim()) &&
    Number.isFinite(recipe.serving) &&
    recipe.serving > 0 &&
    Number.isFinite(recipe.time) &&
    recipe.time > 0 &&
    recipe.ingredients.length > 0 &&
    recipe.ingredients.every((ing) => Boolean(ing.name?.trim() && ing.amount?.trim())) &&
    recipe.recipe.steps.length > 0 &&
    recipe.recipe.steps.every((step) => Boolean(step.instruction?.trim()))
  );
}

const pools: Pool[] = [
  { label: 'elementary-breakfast', ids: uniqueIds(listElementaryBreakfastWeekCandidates()) },
  { label: 'elementary-dinner', ids: uniqueIds(listElementaryDinnerWeekCandidates()) },
  { label: 'toddler-breakfast', ids: uniqueIds(listToddlerBreakfastWeekCandidates()) },
  { label: 'toddler-dinner', ids: uniqueIds(listToddlerDinnerWeekCandidates()) },
];

function main() {
  console.log('HANKKI weekly recipe runtime route audit — start\n');

  const menuSrc = read('services/recipe/mockRecipeDetails.ts');
  const recipeServiceSrc = read('services/recipe/recipeService.ts');
  const goldSrc = read('services/recommendation/goldMealCatalog.ts');

  const menuLooksUpFlagshipFirst =
    menuSrc.includes('export function getMenuById') &&
    menuSrc.indexOf('getFlagshipMenuById(id)') < menuSrc.indexOf('getDeliveryMenuById(id)');
  const recipeLooksUpFlagship =
    menuSrc.includes('getFlagshipGoldMealById(id)') &&
    menuSrc.includes('export function getRecipeById');
  const fetchFallsBackToGetRecipeById =
    recipeServiceSrc.includes('export async function fetchRecipe') &&
    recipeServiceSrc.includes('getRecipeById(recipeId)');
  const flagshipIsFullHankkiMap =
    goldSrc.includes('HANKKI_RECIPES.map(hankkiRecipeToGoldMeal)') &&
    goldSrc.includes('export function getFlagshipMenuById') &&
    !goldSrc.slice(goldSrc.indexOf('export function getFlagshipMenuById')).includes(
      'isExcludedFromGeneralHomeByRecipeId',
    );

  console.log(`getMenuById → getFlagshipMenuById first: ${menuLooksUpFlagshipFirst}`);
  console.log(`getRecipeById → getFlagshipGoldMealById: ${recipeLooksUpFlagship}`);
  console.log(`fetchRecipe → getRecipeById fallback: ${fetchFallsBackToGetRecipeById}`);
  console.log(`getFlagshipMenuById includes child Hankki ids: ${flagshipIsFullHankkiMap}\n`);

  const failed: string[] = [];
  const fieldFailed: string[] = [];
  let total = 0;
  let resolved = 0;
  const missingMenu: string[] = [];
  const missingHankki: string[] = [];
  const missingRecipe: string[] = [];
  const fetchMiss: string[] = [];

  for (const pool of pools) {
    const poolFail: string[] = [];
    for (const id of pool.ids) {
      total += 1;
      const hankki = getHankkiRecipeById(id);
      const inMaster = Boolean(getMasterRecipeById(id));
      const getHankki = Boolean(hankki);
      const getMenu = getHankki && menuLooksUpFlagshipFirst && flagshipIsFullHankkiMap;
      const getRecipe = getHankki && recipeLooksUpFlagship && flagshipIsFullHankkiMap;
      const fetchOk =
        (inMaster || getRecipe) && fetchFallsBackToGetRecipeById;
      const ingredientsOk = Boolean(hankki && hasRenderableDetail(hankki));

      if (!getMenu) missingMenu.push(`${pool.label}:${id}`);
      if (!getHankki) missingHankki.push(`${pool.label}:${id}`);
      if (!getRecipe) missingRecipe.push(`${pool.label}:${id}`);
      if (!fetchOk) fetchMiss.push(`${pool.label}:${id}`);
      if (hankki && !ingredientsOk) fieldFailed.push(`${pool.label}:${id}`);

      const ok = getMenu && getHankki && getRecipe && fetchOk && ingredientsOk;
      if (ok) resolved += 1;
      else {
        failed.push(`${pool.label}:${id}`);
        poolFail.push(id);
      }
    }
    console.log(
      `${pool.label}: pool ${pool.ids.length}, failed ${poolFail.length}${
        poolFail.length ? ` [${poolFail.join(', ')}]` : ''
      }`,
    );
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`TOTAL_WEEKLY_IDS: ${total}`);
  console.log(`ROUTE_RESOLVED: ${resolved}`);
  console.log(`ROUTE_FAILED: ${failed.length}`);
  console.log(`FAILED_RECIPE_IDS: ${failed.length ? failed.join(', ') : '(none)'}`);
  console.log(`DETAIL_FIELD_FAILED: ${fieldFailed.length ? fieldFailed.join(', ') : '(none)'}`);
  console.log(`getMenuById miss: ${missingMenu.length}`);
  console.log(`getHankkiRecipeById miss: ${missingHankki.length}`);
  console.log(`getRecipeById miss: ${missingRecipe.length}`);
  console.log(`fetchRecipe miss: ${fetchMiss.length}`);

  if (failed.length > 0) process.exitCode = 1;
  else console.log('\nPASS — all weekly pool ids resolve to homemade Ingredients recipes');
}

main();
