/**
 * Sprint 63-B — recipe shopping list + missing list QA.
 * Run: npm run test:recipe-shopping-list
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { buildPantrySnapshotFromStore } from '../services/pantry/buildPantrySnapshot';
import { pantryOwnsMatchKey, buildPantryMatchKeySet } from '../services/fridge/fridgeIngredientMatch';
import {
  buildRecipeShoppingList,
  buildMissingRecipeShoppingList,
  mergeShoppingItems,
} from '../services/shopping';
import { getShoppingKeyword } from '../services/shopping/shoppingKeyword';
import { SHOPPING_KEYWORD_ALIASES } from '../services/shopping/shoppingAliases';
import type { PantryStore } from '../types/pantry';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

function pantryFromIconKeys(keys: Array<{ iconKey: string; name: string }>): ReturnType<
  typeof buildPantrySnapshotFromStore
> {
  const now = new Date().toISOString();
  const store: PantryStore = {
    version: 2,
    updatedAt: now,
    extensions: {},
    items: keys.map((entry, index) => ({
      id: `pantry_test_${index}`,
      name: entry.name,
      normalizedName: entry.name,
      iconKey: entry.iconKey,
      updatedAt: now,
    })),
  };
  return buildPantrySnapshotFromStore(store);
}

console.log('Sprint 63-B recipe shopping list QA — start\n');

run('Scenario C — duplicate merge same matchKey + keyword', () => {
  const merged = mergeShoppingItems([
    {
      recipeId: 'test',
      ingredientName: '대파',
      shoppingKeyword: '대파',
      amountText: '1/2대',
      group: 'main',
      matchKey: 'green_onion',
      iconKey: 'green_onion',
    },
    {
      recipeId: 'test',
      ingredientName: '대파',
      shoppingKeyword: '대파',
      amountText: '1큰술',
      group: 'seasoning',
      matchKey: 'green_onion',
      iconKey: 'green_onion',
    },
  ]);
  assert(merged.length === 1, 'merged to one line');
  assert(merged[0]!.group === 'main', 'primary group main');
  assert(merged[0]!.shoppingKeyword === '대파', 'keyword preserved');

  const separate = mergeShoppingItems([
    {
      recipeId: 'test',
      ingredientName: '설탕',
      shoppingKeyword: '설탕',
      amountText: '1큰술',
      group: 'seasoning',
      matchKey: 'sugar',
      iconKey: 'sugar',
    },
    {
      recipeId: 'test',
      ingredientName: '물엿',
      shoppingKeyword: '물엿',
      amountText: '2큰술',
      group: 'seasoning',
      matchKey: 'sugar',
      iconKey: 'sugar',
    },
  ]);
  assert(separate.length === 2, 'different keywords stay separate despite shared matchKey');
});

run('Scenario D — main/sub/seasoning groups preserved', () => {
  const recipe = HANKKI_RECIPES[0]!;
  const list = buildRecipeShoppingList(recipe.id);
  const groups = new Set(list.items.map((item) => item.group));
  assert(groups.has('main') || groups.has('sub') || groups.has('seasoning'), 'has groups');
  for (const item of list.items) {
    assert(
      item.group === 'main' || item.group === 'sub' || item.group === 'seasoning',
      `valid group ${item.group}`,
    );
  }
});

run('Scenario E — pantry owned ingredient excluded from missing list', () => {
  const recipe = getHankkiRecipeById('001') ?? HANKKI_RECIPES[0]!;
  const onion = recipe.ingredients.find((ing) => ing.iconKey === 'onion');
  assert(onion !== undefined, 'recipe has onion');

  const pantry = pantryFromIconKeys([{ iconKey: 'onion', name: '양파' }]);
  const missing = buildMissingRecipeShoppingList(recipe.id, pantry);
  const hasOnion = missing.items.some((item) => item.matchKey === 'onion');
  assert(!hasOnion, 'onion not in missing when in pantry');
});

run('Scenario F — pantry missing ingredient included', () => {
  const recipe = getHankkiRecipeById('001') ?? HANKKI_RECIPES[0]!;
  const pantry = pantryFromIconKeys([]);
  const missing = buildMissingRecipeShoppingList(recipe.id, pantry);
  assert(missing.items.length > 0, 'missing list non-empty for empty pantry');
  assert(missing.items.every((item) => item.isMissing), 'all flagged missing');
});

run('Scenario G — invalid recipeId safe', () => {
  const list = buildRecipeShoppingList('recipe_invalid_xyz');
  assert(!list.found, 'not found');
  assert(list.items.length === 0, 'empty items');
  const missing = buildMissingRecipeShoppingList('recipe_invalid_xyz', pantryFromIconKeys([]));
  assert(!missing.found, 'missing not found');
  assert(missing.items.length === 0, 'missing empty');
});

run('Full catalog audit — keyword coverage 100%', () => {
  let totalLines = 0;
  let uniqueNames = new Set<string>();
  let emptyKeywords = 0;
  let aliasApplied = 0;
  let mergeReduced = 0;

  for (const recipe of HANKKI_RECIPES) {
    totalLines += recipe.ingredients.length;
    for (const ing of recipe.ingredients) {
      uniqueNames.add(ing.name);
      const keyword = getShoppingKeyword(ing.name);
      if (!keyword.trim()) emptyKeywords += 1;
      if (
        SHOPPING_KEYWORD_ALIASES[ing.name] === keyword ||
        SHOPPING_KEYWORD_ALIASES[ing.name.replace(/\s+/g, '')] === keyword
      ) {
        aliasApplied += 1;
      }
    }

    const list = buildRecipeShoppingList(recipe.id);
    if (list.items.length < recipe.ingredients.length) {
      mergeReduced += recipe.ingredients.length - list.items.length;
    }
  }

  console.log('--- Catalog audit ---');
  console.log(`recipes: ${HANKKI_RECIPES.length}`);
  console.log(`total ingredient lines: ${totalLines}`);
  console.log(`unique ingredient names: ${uniqueNames.size}`);
  console.log(`empty keywords: ${emptyKeywords}`);
  console.log(`alias table hits: ${aliasApplied}`);
  console.log(`lines removed by merge (sum across recipes): ${mergeReduced}`);

  assert(emptyKeywords === 0, 'empty keyword count 0');
  assert(totalLines === 2303, `expected 2303 lines got ${totalLines}`);
});

run('MatchKey consistency — missing uses fridge keys', () => {
  const recipe = HANKKI_RECIPES[0]!;
  const pantry = pantryFromIconKeys([{ iconKey: 'egg', name: '계란' }]);
  const missing = buildMissingRecipeShoppingList(recipe.id, pantry);
  const ownedKeys = buildPantryMatchKeySet(pantry);
  for (const item of missing.items) {
    assert(!pantryOwnsMatchKey(ownedKeys, item.matchKey), `matchKey ${item.matchKey} not owned`);
    assert(item.matchKey.length > 0, 'matchKey present');
  }
});

console.log('\nSprint 63-B recipe shopping list QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — recipe shopping list');
