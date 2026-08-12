/**
 * Sprint 63-C — shopping selection state QA.
 * Run: npm run test:shopping-selection
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { COMMON_STAPLE_MATCH_KEYS } from '../constants/shoppingConfig';
import { buildPantrySnapshotFromStore } from '../services/pantry/buildPantrySnapshot';
import {
  buildMissingRecipeShoppingList,
  buildRecipeShoppingList,
} from '../services/shopping/buildRecipeShoppingList';
import {
  buildDefaultSelectedKeys,
  countSelectedItems,
  defaultIngredientSelected,
  isCommonStapleMatchKey,
  shoppingItemSelectionKey,
} from '../services/shopping/shoppingSelection';
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

console.log('Sprint 63-C shopping selection QA — start\n');

run('Scenario C — all mode: main only selected by default', () => {
  const list = buildRecipeShoppingList('001');
  const defaults = buildDefaultSelectedKeys(list.items, 'all');
  assert(defaults.size > 0, 'some defaults selected');
  for (const item of list.items) {
    const key = shoppingItemSelectionKey(item);
    const expected = defaultIngredientSelected(item, 'all');
    assert(defaults.has(key) === expected, `default for ${item.ingredientName}`);
  }
  const subSelected = list.items.filter(
    (item) => item.group === 'sub' && defaults.has(shoppingItemSelectionKey(item)),
  );
  assert(subSelected.length === 0, 'no sub selected in all mode');
});

run('Scenario C2 — missing mode: main/sub selected, seasoning off', () => {
  const now = new Date().toISOString();
  const store: PantryStore = {
    version: 2,
    updatedAt: now,
    extensions: {},
    items: [],
  };
  const pantry = buildPantrySnapshotFromStore(store);
  const missing = buildMissingRecipeShoppingList('001', pantry);
  const defaults = buildDefaultSelectedKeys(missing.items, 'missing');
  for (const item of missing.items) {
    const key = shoppingItemSelectionKey(item);
    const expected = defaultIngredientSelected(item, 'missing');
    assert(defaults.has(key) === expected, `missing default for ${item.ingredientName}`);
  }
  assert(
    missing.items.every(
      (item) => item.group === 'main' || item.group === 'sub' || !defaults.has(shoppingItemSelectionKey(item)),
    ),
    'only core groups auto-selected',
  );
});

run('Scenario B — toggle changes selected count', () => {
  const list = buildRecipeShoppingList('001');
  const selected = buildDefaultSelectedKeys(list.items, 'all');
  const before = countSelectedItems(list.items, selected);
  const sub = list.items.find((item) => item.group === 'sub');
  assert(sub !== undefined, 'sub exists');
  const key = shoppingItemSelectionKey(sub);
  selected.add(key);
  const after = countSelectedItems(list.items, selected);
  assert(before !== after, 'count changed after toggle');
});

run('Staples — common keys deselected by default', () => {
  for (const matchKey of COMMON_STAPLE_MATCH_KEYS) {
    assert(isCommonStapleMatchKey(matchKey), `staple ${matchKey}`);
  }
  const recipe = HANKKI_RECIPES.find((r) =>
    r.ingredients.some((ing) => COMMON_STAPLE_MATCH_KEYS.includes(ing.iconKey)),
  );
  assert(recipe !== undefined, 'recipe with staple exists');
  const list = buildRecipeShoppingList(recipe!.id);
  const stapleItem = list.items.find((item) => isCommonStapleMatchKey(item.matchKey));
  assert(stapleItem !== undefined, 'staple item in list');
  assert(!defaultIngredientSelected(stapleItem!, 'all'), 'staple deselected in all mode');
  assert(!defaultIngredientSelected(stapleItem!, 'missing'), 'staple deselected in missing mode');
});

run('Selection key stable', () => {
  const list = buildRecipeShoppingList('001');
  for (const item of list.items) {
    const key = shoppingItemSelectionKey(item);
    assert(key.includes('::'), 'composite key');
    assert(key.length > 3, 'non-empty key');
  }
});

run('Catalog staple frequency snapshot', () => {
  const counts: Record<string, number> = {};
  for (const key of COMMON_STAPLE_MATCH_KEYS) counts[key] = 0;
  for (const recipe of HANKKI_RECIPES) {
    for (const ing of recipe.ingredients) {
      if (counts[ing.iconKey] !== undefined) counts[ing.iconKey] += 1;
    }
  }
  console.log('--- Staple line counts ---');
  console.log(counts);
  const totalStapleLines = Object.values(counts).reduce((a, b) => a + b, 0);
  assert(totalStapleLines > 0, 'staples appear in catalog');
});

console.log('\nSprint 63-C shopping selection QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — shopping selection');
