/**
 * Sprint 62-B — viewed recipe history QA.
 * Run: npm run test:viewed-recipe-history
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import {
  clearViewedRecipeHistory,
  getViewedRecipeHistory,
  MAX_VIEWED_RECIPE_HISTORY,
  recordViewedRecipe,
  VIEWED_RECIPE_HISTORY_KEY,
} from '../services/viewedRecipe/viewedRecipeHistoryStorage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function countResolvableHistory(
  entries: Awaited<ReturnType<typeof getViewedRecipeHistory>>,
): number {
  return entries.filter((entry) => getHankkiRecipeById(entry.recipeId) !== undefined).length;
}

const memoryStore = new Map<string, string>();

async function mockAsyncStorage(): Promise<void> {
  const mod = await import('@react-native-async-storage/async-storage');
  const storage = mod.default;
  (storage as { setItem: typeof storage.setItem }).setItem = async (key: string, value: string) => {
    memoryStore.set(key, value);
  };
  (storage as { getItem: typeof storage.getItem }).getItem = async (key: string) =>
    memoryStore.get(key) ?? null;
  (storage as { removeItem: typeof storage.removeItem }).removeItem = async (key: string) => {
    memoryStore.delete(key);
  };
}

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

console.log('Sprint 62-B viewed recipe history QA — start\n');

async function main(): Promise<void> {
  await mockAsyncStorage();
  memoryStore.clear();
  await clearViewedRecipeHistory();

  await run('Scenario A — new history, recipe A view → [A]', async () => {
    const history = await recordViewedRecipe('001');
    assert(history.length === 1, 'one entry');
    assert(history[0]!.recipeId === '001', 'recipe A');
  });

  await run('Scenario B — A then B → newest first [B, A]', async () => {
    await recordViewedRecipe('001');
    const history = await recordViewedRecipe('002');
    assert(history.length === 2, 'two entries');
    assert(history[0]!.recipeId === '002', 'B is newest');
    assert(history[1]!.recipeId === '001', 'A is second');
  });

  await run('Scenario C — A, B, A again → no duplicate, A newest', async () => {
    await clearViewedRecipeHistory();
    await recordViewedRecipe('001');
    await recordViewedRecipe('002');
    const history = await recordViewedRecipe('001');
    assert(history.length === 2, 'still two entries');
    assert(history[0]!.recipeId === '001', 'A moved to front');
    assert(history[1]!.recipeId === '002', 'B remains');
    const ids = history.map((entry) => entry.recipeId);
    assert(new Set(ids).size === ids.length, 'no duplicate ids');
  });

  await run('Scenario D — max N exceeded → oldest removed', async () => {
    await clearViewedRecipeHistory();
    for (let i = 1; i <= MAX_VIEWED_RECIPE_HISTORY + 3; i += 1) {
      const id = String(i).padStart(3, '0');
      await recordViewedRecipe(id);
    }
    const history = await getViewedRecipeHistory();
    assert(history.length === MAX_VIEWED_RECIPE_HISTORY, `capped at ${MAX_VIEWED_RECIPE_HISTORY}`);
    assert(
      history[0]!.recipeId === String(MAX_VIEWED_RECIPE_HISTORY + 3).padStart(3, '0'),
      'newest kept',
    );
    assert(!history.some((entry) => entry.recipeId === '001'), 'oldest entries removed');
  });

  await run('Scenario E — invalid recipe id → no crash', async () => {
    await clearViewedRecipeHistory();
    await recordViewedRecipe('invalid_recipe_xyz');
    const history = await getViewedRecipeHistory();
    assert(history.length === 1, 'invalid id stored in history');
    assert(countResolvableHistory(history) === 0, 'invalid entry excluded from resolvable set');
    const displaySrc = read('services/viewedRecipe/viewedRecipeDisplay.ts');
    assert(displaySrc.includes('filter((card): card is FavoriteCardData => card !== null)'), 'null cards filtered');
  });

  await run('Scenario F — Home count matches resolvable history', async () => {
    await clearViewedRecipeHistory();
    await recordViewedRecipe('001');
    await recordViewedRecipe('002');
    const history = await getViewedRecipeHistory();
    const resolvable = countResolvableHistory(history);
    assert(resolvable === 2, 'two valid recipes');
    const homeSrc = read('components/home/useHomeScreen.ts');
    assert(homeSrc.includes('getViewedRecipeDisplayCount'), 'home uses display count service');
  });

  await run('Scenario G — list screen opens recipe detail routes', () => {
    const src = read('components/viewedRecipes/ViewedRecipesScreen.tsx');
    assert(src.includes('/ingredients/'), 'homemade detail route');
    assert(src.includes('/delivery/'), 'delivery detail route');
    assert(!src.includes('/meal-history'), 'no meal-history proxy');
  });

  await run('HomePersonalSection — recently-viewed route', () => {
    const src = read('components/home/HomePersonalSection.tsx');
    assert(src.includes('/recently-viewed'), 'recently-viewed route');
    assert(!src.includes('/meal-history'), 'meal-history proxy removed');
  });

  await run('IngredientsScreen — records on detail mount', () => {
    const src = read('components/ingredients/IngredientsScreen.tsx');
    assert(src.includes('recordViewedRecipe'), 'records viewed recipe');
  });

  await run('storage key convention', () => {
    assert(VIEWED_RECIPE_HISTORY_KEY === '@hankki/viewed_recipe_history', 'hankki namespace key');
  });
}

main().then(() => {
  console.log(`\nSprint 62-B viewed recipe history QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
});
