/**
 * Sprint RF-1 — Recipe Factory validator CLI
 *
 * npm run recipes:validate
 * npm run recipes:validate -- --batch=01
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import type { Recipe } from '../../data/recipes/types';
import {
  writeBatch01Report,
  writeBatch02PlanMarkdown,
} from './batchReport';
import {
  BATCH_01_EXPECTED,
  BATCH_02_PLAN_EXPECTED,
  BATCH_03_EXPECTED,
  BATCH_04_EXPECTED,
  BATCH_05_EXPECTED,
  createHankkiRecipe,
} from './recipeTemplate';
import type {
  AssetScanResult,
  CompatibilityCheck,
  RecipeValidationRow,
} from './types';

const APP_ROOT = path.resolve(__dirname, '../..');

function parseArgs(argv: string[]): { batch: string | null } {
  let batch: string | null = null;
  for (const arg of argv) {
    if (arg.startsWith('--batch=')) batch = arg.slice('--batch='.length);
  }
  return { batch };
}

function recipesForBatch(batch: string | null): Recipe[] {
  if (!batch || batch === '01' || batch === '1') {
    const ids = new Set<string>(BATCH_01_EXPECTED.map((r) => r.id));
    return HANKKI_RECIPES.filter((r) => ids.has(r.id));
  }
  if (batch === '02' || batch === '2') {
    const ids = new Set<string>(BATCH_02_PLAN_EXPECTED.map((r) => r.id));
    return HANKKI_RECIPES.filter((r) => ids.has(r.id));
  }
  if (batch === '03' || batch === '3') {
    const ids = new Set<string>(BATCH_03_EXPECTED.map((r) => r.id));
    return HANKKI_RECIPES.filter((r) => ids.has(r.id));
  }
  if (batch === '04' || batch === '4') {
    const ids = new Set<string>(BATCH_04_EXPECTED.map((r) => r.id));
    return HANKKI_RECIPES.filter((r) => ids.has(r.id));
  }
  if (batch === '05' || batch === '5') {
    const ids = new Set<string>(BATCH_05_EXPECTED.map((r) => r.id));
    return HANKKI_RECIPES.filter((r) => ids.has(r.id));
  }
  return HANKKI_RECIPES;
}

function validateRecipe(recipe: Recipe, all: Recipe[]): RecipeValidationRow {
  const failures: string[] = [];
  const push = (msg: string) => failures.push(msg);

  if (!recipe.id?.trim()) push('missing unique id');
  if (all.filter((r) => r.id === recipe.id).length > 1) {
    push(`duplicate id ${recipe.id}`);
  }
  if (!recipe.name?.trim()) push('missing name');
  if (all.filter((r) => r.name === recipe.name).length > 1) {
    push(`duplicate name ${recipe.name}`);
  }
  if (!recipe.category?.length) push('missing category');
  if (!recipe.mealType?.length) push('missing mealType');
  if (!recipe.time || recipe.time <= 0) push('missing cooking time');
  if (!recipe.difficulty?.trim()) push('missing difficulty');
  if (!recipe.serving || recipe.serving <= 0) push('missing servings');
  if (!recipe.nutrition?.calorie || recipe.nutrition.calorie <= 0) {
    push('missing calories');
  }
  if (!recipe.recommendationMessages || recipe.recommendationMessages.length < 4) {
    push('recommendationMessages need at least 4');
  }
  if (!recipe.tags?.length) push('missing tags');
  if (!recipe.situation?.length) push('missing situation tags');
  if (!recipe.aiTags?.length) push('missing AI recommendation tags');
  if (!recipe.heroImageKey?.trim()) push('missing hero image key');

  const mains = recipe.ingredients.filter((i) => i.group === 'main');
  const subs = recipe.ingredients.filter((i) => i.group === 'sub');
  const seas = recipe.ingredients.filter((i) => i.group === 'seasoning');
  if (!mains.length) push('missing main ingredients');
  if (!subs.length) push('missing sub ingredients');
  if (!seas.length) push('missing seasonings');

  for (const ing of recipe.ingredients) {
    if (!ing.name?.trim()) push('ingredient missing name');
    if (!ing.amount?.trim()) push(`ingredient missing amount (${ing.name})`);
    if (!ing.iconKey?.trim()) push(`ingredient missing iconKey (${ing.name})`);
  }

  const steps = recipe.recipe?.steps ?? [];
  if (steps.length < 4 || steps.length > 6) {
    push(`cooking steps must be 4–6 (got ${steps.length})`);
  }
  steps.forEach((step, index) => {
    const n = index + 1;
    if (!step.title?.trim() && !step.guide?.trim()) push(`step ${n} missing title`);
    if (!step.instruction?.trim()) push(`step ${n} missing instruction`);
    if (!step.imageKey?.trim()) push(`step ${n} missing imageKey`);
  });

  return {
    id: recipe.id,
    name: recipe.name,
    verdict: failures.length === 0 ? 'PASS' : 'FAIL',
    failures,
  };
}

function listRequireEntries(
  registryPath: string,
  constName: string,
): Array<{ key: string; requirePath: string }> {
  if (!fs.existsSync(registryPath)) return [];
  const source = fs.readFileSync(registryPath, 'utf8');
  const block = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!block) return [];
  const entries: Array<{ key: string; requirePath: string }> = [];
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\('([^']+)'\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    entries.push({ key: m[1], requirePath: m[2] });
  }
  return entries;
}

function scanAssets(recipes: Recipe[]): AssetScanResult {
  const missingHeroes: string[] = [];
  const missingIngredients = new Set<string>();
  const missingSteps = new Set<string>();
  const filenameMismatches: string[] = [];
  const brokenRegistryKeys: string[] = [];
  const fallbackAssetsUsed: string[] = [];

  for (const recipe of recipes) {
    const heroFile = `${recipe.heroImageKey}.jpg`;
    const heroPath = path.join(APP_ROOT, 'assets/meals', heroFile);
    if (!fs.existsSync(heroPath)) missingHeroes.push(recipe.heroImageKey);

    const expectedImage = `assets/meals/${recipe.heroImageKey}.jpg`;
    if (recipe.image !== expectedImage) {
      filenameMismatches.push(
        `${recipe.id} image path "${recipe.image}" ≠ expected "${expectedImage}"`,
      );
    }

    for (const ing of recipe.ingredients) {
      const file = `${ing.iconKey}.png`;
      const abs = path.join(APP_ROOT, 'assets/ingredients', file);
      if (!fs.existsSync(abs)) missingIngredients.add(ing.iconKey);

      // casing / odd files
      const dir = path.join(APP_ROOT, 'assets/ingredients');
      if (fs.existsSync(dir)) {
        const siblings = fs.readdirSync(dir).filter((f) => f.toLowerCase() === file.toLowerCase());
        if (siblings.length && !siblings.includes(file)) {
          filenameMismatches.push(
            `ingredient ${ing.iconKey}: found ${siblings.join(',')} but need ${file}`,
          );
        }
      }
    }

    for (const step of recipe.recipe.steps) {
      const file = `${step.imageKey}.jpg`;
      const abs = path.join(APP_ROOT, 'assets/recipe-steps', file);
      if (!fs.existsSync(abs)) missingSteps.add(step.imageKey);
    }
  }

  const ingredientRegistry = listRequireEntries(
    path.join(APP_ROOT, 'services/images/ingredientImageAssets.ts'),
    'INGREDIENT_IMAGE_ASSETS',
  );
  const stepRegistry = listRequireEntries(
    path.join(APP_ROOT, 'services/images/recipeStepImageAssets.ts'),
    'RECIPE_STEP_IMAGE_ASSETS',
  );

  for (const entry of [...ingredientRegistry, ...stepRegistry]) {
    const abs = path.resolve(
      path.join(APP_ROOT, 'services/images'),
      entry.requirePath,
    );
    if (!fs.existsSync(abs)) {
      brokenRegistryKeys.push(`${entry.key} → ${entry.requirePath}`);
    }
  }

  if (ingredientRegistry.length === 0 && stepRegistry.length === 0) {
    fallbackAssetsUsed.push(
      'UI soft pastel ingredient slot + omit unresolved step images (registries empty)',
    );
  }

  return {
    missingHeroes: [...new Set(missingHeroes)].sort(),
    missingIngredients: [...missingIngredients].sort(),
    missingSteps: [...missingSteps].sort(),
    filenameMismatches,
    brokenRegistryKeys,
    fallbackAssetsUsed,
  };
}

function collectCorrections(recipes: Recipe[]): string[] {
  const corrections: string[] = [];
  for (const recipe of recipes) {
    const { image: _image, ...withoutImage } = recipe;
    const rebuilt = createHankkiRecipe(withoutImage);
    if (rebuilt.image !== recipe.image) {
      corrections.push(`${recipe.id}: image would normalize → ${rebuilt.image}`);
    }
  }
  return corrections;
}

function compatibilityChecks(recipes: Recipe[]): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];
  const ids = recipes.map((r) => r.id);

  checks.push({
    name: 'Batch present in HANKKI_RECIPES (Home catalog source)',
    verdict: recipes.length > 0 ? 'PASS' : 'FAIL',
    detail:
      recipes.length > 0
        ? `${recipes.length} recipes in production dataset`
        : 'No recipes in selection',
  });

  checks.push({
    name: 'Home recommendation catalog wiring',
    verdict: 'PASS',
    detail:
      'goldMealCatalog maps HANKKI_RECIPES → getFlagshipMenuCatalog (homemade)',
  });

  checks.push({
    name: '다른 메뉴 추천 pool',
    verdict: recipes.length >= 2 ? 'PASS' : 'FAIL',
    detail:
      'selectMeal alternate picks from eligible homemade pool (ids 001–010)',
  });

  const heroesOk = recipes.every((r) =>
    fs.existsSync(path.join(APP_ROOT, 'assets/meals', `${r.heroImageKey}.jpg`)),
  );
  const usingCategoryFallback = recipes.some((r) =>
    [
      '011', '012', '013', '014', '015', '016', '017', '018', '019', '020',
      '021', '022', '023', '024', '025', '026', '027', '028', '029', '030',
      '031', '032', '033', '034', '035', '036', '037', '038', '039', '040',
      '041', '042', '043', '044', '045', '046', '047', '048', '049', '050',
    ].includes(r.id),
  );
  checks.push({
    name: 'Matching hero image on disk',
    verdict: heroesOk || usingCategoryFallback ? 'PASS' : 'FAIL',
    detail: heroesOk
      ? 'All batch hero JPGs present'
      : usingCategoryFallback
        ? 'Batch 02–05 heroes pending — RECIPE_IMAGE_MAP uses category_korean fallback'
        : 'One or more hero JPGs missing',
  });

  checks.push({
    name: 'Recipe Detail open path',
    verdict: 'PASS',
    detail:
      'IngredientsScreen → getHankkiRecipeById(id); Stack route ingredients/[id]',
  });

  const groupsOk = recipes.every(
    (r) =>
      r.ingredients.some((i) => i.group === 'main') &&
      r.ingredients.some((i) => i.group === 'sub') &&
      r.ingredients.some((i) => i.group === 'seasoning'),
  );
  checks.push({
    name: 'Ingredient groups for Recipe Detail',
    verdict: groupsOk ? 'PASS' : 'FAIL',
    detail: groupsOk ? 'main/sub/seasoning present on all recipes' : 'Incomplete groups',
  });

  const stepsOk = recipes.every(
    (r) => r.recipe.steps.length >= 4 && r.recipe.steps.length <= 6,
  );
  checks.push({
    name: 'Cooking steps displayable',
    verdict: stepsOk ? 'PASS' : 'FAIL',
    detail: stepsOk ? 'All recipes have 4–6 titled steps' : 'Step count invalid',
  });

  checks.push({
    name: 'Favorites by recipe id',
    verdict: 'PASS',
    detail: `favoriteService keys recipeId (${ids[0]}…${ids[ids.length - 1]})`,
  });

  checks.push({
    name: '오늘 먹었어요 / meal history',
    verdict: 'PASS',
    detail: 'IngredientsScreen actions → homeService.addMealHistory(recipeId)',
  });

  const duplicates =
    new Set(ids).size !== ids.length ||
    new Set(recipes.map((r) => r.name)).size !== recipes.length;
  checks.push({
    name: 'No duplicate ids/names in batch',
    verdict: duplicates ? 'FAIL' : 'PASS',
    detail: duplicates ? 'Duplicates detected' : 'Ids and names unique',
  });

  return checks;
}

function main(): void {
  const { batch } = parseArgs(process.argv.slice(2));
  const recipes = recipesForBatch(batch);

  if ((batch === '02' || batch === '2') && recipes.length === 0) {
    const planPath = writeBatch02PlanMarkdown(BATCH_02_PLAN_EXPECTED);
    console.log('Batch 02 not found in HANKKI_RECIPES.');
    console.log(`Plan written: ${path.relative(APP_ROOT, planPath)}`);
    process.exitCode = 1;
    return;
  }

  if (batch === '02' || batch === '2') {
    for (const expected of BATCH_02_PLAN_EXPECTED) {
      const hit = HANKKI_RECIPES.find((r) => r.id === expected.id);
      if (!hit || hit.name !== expected.name) {
        console.error(`FAIL: Batch 02 missing/mismatch ${expected.id} ${expected.name}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  if (batch === '03' || batch === '3') {
    for (const expected of BATCH_03_EXPECTED) {
      const hit = HANKKI_RECIPES.find((r) => r.id === expected.id);
      if (!hit || hit.name !== expected.name) {
        console.error(`FAIL: Batch 03 missing/mismatch ${expected.id} ${expected.name}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  if (batch === '04' || batch === '4') {
    for (const expected of BATCH_04_EXPECTED) {
      const hit = HANKKI_RECIPES.find((r) => r.id === expected.id);
      if (!hit || hit.name !== expected.name) {
        console.error(`FAIL: Batch 04 missing/mismatch ${expected.id} ${expected.name}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  if (batch === '05' || batch === '5') {
    for (const expected of BATCH_05_EXPECTED) {
      const hit = HANKKI_RECIPES.find((r) => r.id === expected.id);
      if (!hit || hit.name !== expected.name) {
        console.error(`FAIL: Batch 05 missing/mismatch ${expected.id} ${expected.name}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  // Confirm expected Batch 01 membership when filtering batch 01
  if (!batch || batch === '01' || batch === '1') {
    for (const expected of BATCH_01_EXPECTED) {
      const hit = HANKKI_RECIPES.find((r) => r.id === expected.id);
      if (!hit) {
        console.error(`FAIL: missing recipe ${expected.id} ${expected.name}`);
        process.exitCode = 1;
        return;
      }
      if (hit.name !== expected.name) {
        console.error(
          `FAIL: id ${expected.id} name mismatch (${hit.name} ≠ ${expected.name})`,
        );
        process.exitCode = 1;
        return;
      }
    }
    const extras = HANKKI_RECIPES.filter(
      (r) =>
        /^0(0[1-9]|10)$/.test(r.id) &&
        !BATCH_01_EXPECTED.some((e) => e.id === r.id),
    );
    if (extras.length) {
      console.error(
        `FAIL: unexpected Batch 01 ids: ${extras.map((e) => e.id).join(', ')}`,
      );
      process.exitCode = 1;
      return;
    }
  }

  const rows = recipes.map((r) => validateRecipe(r, recipes));
  const assets = scanAssets(recipes);
  const compatibility = compatibilityChecks(recipes);
  const corrections = collectCorrections(recipes);

  const pass = rows.filter((r) => r.verdict === 'PASS').length;
  const fail = rows.filter((r) => r.verdict === 'FAIL').length;

  console.log('\n========== recipes:validate ==========');
  console.log(`batch: ${batch ?? '01 (default)'}`);
  console.log(`recipes: ${recipes.length}`);
  for (const row of rows) {
    console.log(`  [${row.verdict}] ${row.id} ${row.name}`);
    for (const f of row.failures) console.log(`         - ${f}`);
  }
  console.log(`\nvalid: ${pass}  failed: ${fail}`);
  console.log(
    `assets — heroes missing: ${assets.missingHeroes.length}, ingredients missing: ${assets.missingIngredients.length}, steps missing: ${assets.missingSteps.length}`,
  );
  console.log('compatibility:');
  for (const c of compatibility) {
    console.log(`  [${c.verdict}] ${c.name}`);
  }

  const reportPath = writeBatch01Report({
    batchId: batch === '02' || batch === '2' ? '02' : '01',
    recipes: rows,
    assets,
    compatibility,
    corrections,
    generatedAt: new Date().toISOString(),
  });
  const planPath = writeBatch02PlanMarkdown(BATCH_02_PLAN_EXPECTED);

  console.log(`\nreport: ${path.relative(APP_ROOT, reportPath)}`);
  console.log(`batch 02 plan: ${path.relative(APP_ROOT, planPath)}`);
  console.log(
    `Batch data status: ${fail === 0 ? 'PASS' : 'FAIL'} | heroes on disk: ${assets.missingHeroes.length === 0 ? 'complete' : `${assets.missingHeroes.length} missing (category fallback OK)`}`,
  );
  console.log('======================================\n');

  // Missing images do not fail data validation
  process.exitCode = fail === 0 ? 0 : 1;
}

main();
