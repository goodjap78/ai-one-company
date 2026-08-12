/**
 * Fridge Raid seasoning exclusion policy QA.
 * Run: npm run test:fridge-seasoning-policy
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { buildPantrySnapshotFromStore } from '../services/pantry/buildPantrySnapshot';
import {
  alignFridgeIngredients,
  FRIDGE_LEGACY_TIER_SEASONING_KEYS,
  isDisplayMissingIngredient,
  isFridgeCoreIngredientGroup,
  isTierRequiredIngredient,
} from '../services/fridge/fridgeIngredientAlignment';
import { buildPantryMatchKeySet } from '../services/fridge/fridgeIngredientMatch';
import { getFridgeRecipeIndexEntry } from '../services/fridge/fridgeRecipeIndex';
import {
  buildMissingRecipeShoppingList,
  buildRecipeSeasoningShoppingItems,
  buildRecipeShoppingList,
} from '../services/shopping/buildRecipeShoppingList';
import { buildProductSearchRequests } from '../services/shopping/buildProductSearchRequests';
import {
  buildDefaultSelectedKeys,
  defaultIngredientSelected,
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

function pantryFromIconKeys(keys: Array<{ iconKey: string; name: string }>) {
  const now = new Date().toISOString();
  const store: PantryStore = {
    version: 2,
    updatedAt: now,
    extensions: {},
    items: keys.map((entry, index) => ({
      id: `pantry_${index}`,
      name: entry.name,
      normalizedName: entry.name,
      iconKey: entry.iconKey,
      updatedAt: now,
    })),
  };
  return buildPantrySnapshotFromStore(store);
}

console.log('Fridge seasoning policy QA — start\n');

run('Scenario A — main missing + seasoning missing → count main/sub only', () => {
  const recipe = HANKKI_RECIPES.find((r) => r.id === '001');
  assert(recipe !== undefined, 'recipe 001');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const pantry = pantryFromIconKeys([
    { iconKey: 'pork', name: '돼지고기' },
    { iconKey: 'onion', name: '양파' },
  ]);
  const owned = buildPantryMatchKeySet(pantry);
  const alignment = alignFridgeIngredients(indexed.requiredIngredients, owned, pantry.items);

  assert(alignment.missingCount === 2, `missing count 2 (대파·당근), got ${alignment.missingCount}`);
  assert(!alignment.missingIngredients.includes('간장'), '간장 not missing');
  assert(!alignment.missingIngredients.includes('참기름'), '참기름 not missing');
  assert(alignment.missingIngredients.some((n) => n.includes('대파')), '대파 missing');
});

run('Scenario B — only seasoning missing → zero missing count', () => {
  const recipe = HANKKI_RECIPES.find((r) => r.id === '001');
  assert(recipe !== undefined, 'recipe 001');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const coreKeys = indexed.requiredIngredients
    .filter((ing) => isFridgeCoreIngredientGroup(ing.group))
    .map((ing) => ing.matchKey);
  const pantry = pantryFromIconKeys(coreKeys.map((iconKey) => ({ iconKey, name: iconKey })));
  const owned = buildPantryMatchKeySet(pantry);
  const alignment = alignFridgeIngredients(indexed.requiredIngredients, owned, pantry.items);
  assert(alignment.missingCount === 0, 'zero core missing when only seasonings absent');
});

run('Scenario C — optional seasoning list available', () => {
  const seasonings = buildRecipeSeasoningShoppingItems('001');
  assert(seasonings.length > 0, 'seasoning items exist');
  assert(seasonings.every((item) => item.group === 'seasoning'), 'all seasoning group');
});

run('Scenario D — seasoning select triggers search only when checked', () => {
  const seasonings = buildRecipeSeasoningShoppingItems('001');
  const selected = new Set<string>();
  const before = buildProductSearchRequests(seasonings, selected).length;
  assert(before === 0, 'no search when unchecked');
  const soy = seasonings.find((item) => item.matchKey === 'soy_sauce');
  assert(soy !== undefined, '간장 line exists');
  selected.add(shoppingItemSelectionKey(soy));
  const after = buildProductSearchRequests(seasonings, selected).length;
  assert(after === 1, 'one search when seasoning checked');
});

run('Scenario E — fridge missing shopping auto-search main/sub only', () => {
  const pantry = pantryFromIconKeys([
    { iconKey: 'pork', name: '돼지고기' },
    { iconKey: 'onion', name: '양파' },
  ]);
  const missing = buildMissingRecipeShoppingList('001', pantry);
  assert(missing.items.every((item) => item.group === 'main' || item.group === 'sub'), 'core only');
  const defaults = buildDefaultSelectedKeys(missing.items, 'missing');
  const requests = buildProductSearchRequests(missing.items, defaults);
  assert(requests.length === defaults.size, 'requests match selection');
  assert(!missing.items.some((item) => item.group === 'seasoning'), 'no seasoning in missing list');
});

run('Scenario F — general shopping selective search unchanged', () => {
  const list = buildRecipeShoppingList('001');
  const defaults = buildDefaultSelectedKeys(list.items, 'all');
  assert(
    list.items.filter((item) => item.group === 'sub').every(
      (item) => !defaults.has(shoppingItemSelectionKey(item)),
    ),
    'sub deselected in all mode',
  );
  assert(
    list.items.some(
      (item) => item.group === 'main' && defaults.has(shoppingItemSelectionKey(item)),
    ),
    'main selected in all mode',
  );
});

run('Policy — tier required excludes all seasoning', () => {
  const recipe = HANKKI_RECIPES[0]!;
  const indexed = getFridgeRecipeIndexEntry(recipe);
  for (const ing of indexed.requiredIngredients) {
    if (ing.group === 'seasoning') {
      assert(!isTierRequiredIngredient(ing), `seasoning excluded: ${ing.name}`);
      assert(!isDisplayMissingIngredient(ing), `display missing excluded: ${ing.name}`);
    }
  }
});

run('Audit — food-identity seasonings (report only, no auto-fix)', () => {
  const suspiciousKeys = new Set([
    ...FRIDGE_LEGACY_TIER_SEASONING_KEYS,
    'curry',
    'ketchup',
    'mayonnaise',
    'miso',
    'fish_sauce',
    'oyster_sauce',
  ]);
  const hits: string[] = [];
  for (const recipe of HANKKI_RECIPES) {
    for (const ing of recipe.ingredients) {
      if (ing.group !== 'seasoning') continue;
      if (suspiciousKeys.has(ing.iconKey)) {
        hits.push(`${recipe.id} ${recipe.name}: ${ing.name} (${ing.iconKey})`);
      }
    }
  }
  console.log('--- Seasoning audit sample (first 15) ---');
  console.log(hits.slice(0, 15).join('\n'));
  console.log(`total flagged lines: ${hits.length}`);
  assert(hits.length > 0, 'audit list non-empty for report');
});

console.log('\nFridge seasoning policy QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — fridge seasoning policy');
