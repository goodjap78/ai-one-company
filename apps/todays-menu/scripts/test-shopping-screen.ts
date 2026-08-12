/**
 * Sprint 63-C — shopping screen wiring QA.
 * Run: npm run test:shopping-screen
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { parseShoppingListMode } from '../constants/shoppingConfig';
import { SHOPPING_CONFIG } from '../constants/shoppingConfig';
import { SHOPPING_COPY } from '../constants/shoppingCopy';
import { resolveRecipeShoppingList } from '../services/shopping/resolveRecipeShoppingList';
import { buildPantrySnapshotFromStore } from '../services/pantry/buildPantrySnapshot';
import type { PantryStore } from '../types/pantry';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
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

console.log('Sprint 63-C shopping screen QA — start\n');

run('Scenario A — recipe shopping list resolves', () => {
  const recipe = getHankkiRecipeById('001');
  assert(recipe !== undefined, 'recipe 001 exists');
  const list = resolveRecipeShoppingList('001', 'all');
  assert(list.found, 'list found');
  assert(list.items.length > 0, 'items present');
  for (const item of list.items) {
    assert(item.ingredientName.length > 0, 'ingredient name');
    assert(item.amountText.length > 0, 'amount text');
    assert(item.shoppingKeyword.length > 0, 'shopping keyword');
    assert(item.matchKey.length > 0, 'matchKey');
    assert(item.iconKey.length > 0, 'iconKey');
  }
});

run('Scenario D — missing-only mode excludes pantry items', () => {
  const recipeId = '001';
  const now = new Date().toISOString();
  const store: PantryStore = {
    version: 2,
    updatedAt: now,
    extensions: {},
    items: [
      {
        id: 'p_onion',
        name: '양파',
        normalizedName: '양파',
        iconKey: 'onion',
        updatedAt: now,
      },
    ],
  };
  const pantry = buildPantrySnapshotFromStore(store);
  const missing = resolveRecipeShoppingList(recipeId, 'missing', pantry);
  assert(missing.found, 'missing list found');
  assert(!missing.items.some((item) => item.matchKey === 'onion'), 'onion excluded');
});

run('Scenario E — invalid recipe safe', () => {
  const list = resolveRecipeShoppingList('invalid_recipe_xyz', 'all');
  assert(!list.found, 'not found');
  assert(list.items.length === 0, 'empty');
});

run('Scenario F — keyword guard on catalog items', () => {
  const list = resolveRecipeShoppingList('001', 'all');
  assert(list.items.every((item) => item.shoppingKeyword.trim().length > 0), 'no empty keywords');
});

run('Scenario G — production shopping provider enabled', () => {
  assert(SHOPPING_CONFIG.purchaseCtaEnabled, 'purchase CTA enabled');
  assert(SHOPPING_CONFIG.productProviderEnabled, 'product provider enabled');
  assert(SHOPPING_CONFIG.provider === 'coupang', 'coupang provider');
  assert(Boolean(SHOPPING_CONFIG.affiliateDisclosureText?.trim()), 'disclosure configured');
  const src = read('components/shopping/ShoppingScreen.tsx');
  assert(!src.includes('Linking.openURL'), 'no openURL in shopping screen');
  assert(src.includes('useShoppingProductResults'), 'inline product search wired');
  assert(src.includes('ShoppingProductResults'), 'per-ingredient product UI');
  assert(!src.includes('styles.footer'), 'no redundant bottom purchase bar');
});

run('Routing — mode parser', () => {
  assert(parseShoppingListMode('missing') === 'missing', 'missing mode');
  assert(parseShoppingListMode('all') === 'all', 'all mode');
  assert(parseShoppingListMode(undefined) === 'all', 'default all');
});

run('Wiring — route uses ShoppingScreen', () => {
  const route = read('app/shopping/[recipeId].tsx');
  assert(route.includes('ShoppingScreen'), 'ShoppingScreen mounted');
  assert(route.includes('parseShoppingListMode'), 'mode param');
});

run('Wiring — Ingredients CTA routes to shopping', () => {
  const cta = read('components/shopping/IngredientsShoppingCta.tsx');
  assert(cta.includes('/shopping/'), 'shopping route');
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert(ingredients.includes('IngredientsShoppingCta'), 'CTA on ingredients screen');
});

run('Wiring — no Coupang hardcode in shopping UI core', () => {
  const screen = read('components/shopping/ShoppingScreen.tsx');
  const row = read('components/shopping/ShoppingIngredientRow.tsx');
  const productCard = read('components/shopping/ShoppingProductCard.tsx');
  assert(!screen.toLowerCase().includes('coupang'), 'no coupang in screen');
  assert(!row.toLowerCase().includes('coupang'), 'no coupang in row');
  assert(!productCard.toLowerCase().includes('coupang'), 'no coupang in product card');
});

run('Copy — ingredients CTA label', () => {
  assert(SHOPPING_COPY.ingredientsCta.includes('필요한 재료 장보기'), 'CTA copy');
  assert(SHOPPING_COPY.ingredientsCtaHint.includes('상품을 찾아드려요'), 'CTA hint');
});

run('Ingredients CTA is solid orange button', () => {
  const cta = read('components/shopping/IngredientsShoppingCta.tsx');
  assert(cta.includes('ds.colors.primary'), 'primary fill');
  assert(cta.includes("color: '#FFFFFF'"), 'white label');
  assert(!cta.includes("textDecorationLine: 'underline'"), 'not underline link');
});

console.log('\nSprint 63-C shopping screen QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — shopping screen');
