/**
 * Sprint 63-D / 64 — fridge shopping bridge QA.
 * Run: npm run test:fridge-shopping-bridge
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRIDGE_SHOPPING_CONFIG } from '../constants/fridgeShoppingConfig';
import { SHOPPING_COPY } from '../constants/shoppingCopy';
import {
  buildMissingRecipeShoppingList,
  buildMissingShoppingListFromNames,
  buildRecipeShoppingList,
} from '../services/shopping/buildRecipeShoppingList';
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

function pantryFromIconKeys(keys: Array<{ iconKey: string; name: string }>) {
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

console.log('Sprint 64 fridge shopping bridge QA — start\n');

run('Scenario G — production fridge shopping enabled', () => {
  assert(FRIDGE_SHOPPING_CONFIG.enabled === true, 'fridge shopping enabled');
});

run('Scenario H — enabled wiring in bridge source', () => {
  const bridge = read('components/fridge/FridgeShoppingBridge.tsx');
  assert(bridge.includes('FRIDGE_SHOPPING_CONFIG'), 'config import/use');
  assert(bridge.includes('!config.enabled') || bridge.includes('config.enabled'), 'config gate');
  assert(bridge.includes('mode=missing'), 'missing-only route');
  assert(bridge.includes('missingItems'), 'missing items prop');
  assert(bridge.includes('ds.colors.primary'), 'orange primary CTA');
  assert(bridge.includes('missingIngredientsCtaHint'), 'subtitle hint');
  assert(bridge.includes('missingIngredientsComplete'), 'zero-missing complete state');
  assert(bridge.includes('checkSeasoningsCta'), 'optional seasoning link');
  assert(!bridge.includes('fake shopping'), 'no fake shopping screen');
});

run('Results screen places bridge near primary feed', () => {
  const results = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert(results.includes('buildMissingShoppingListFromNames'), 'missing list builder');
  assert(results.includes('FridgeShoppingBridge'), 'bridge mounted');
  const primaryIdx = results.indexOf('FridgeRaidCompactFeed');
  const bridgeIdx = results.indexOf('<FridgeShoppingBridge');
  assert(primaryIdx >= 0 && bridgeIdx > primaryIdx, 'bridge after primary feed');
});

run('Shopping screen supports missing mode + shared product UI', () => {
  const route = read('app/shopping/[recipeId].tsx');
  assert(route.includes('parseShoppingListMode'), 'mode param');
  const screen = read('components/shopping/ShoppingScreen.tsx');
  assert(screen.includes('screenTitleMissing'), 'missing title');
  assert(screen.includes('ShoppingProductResults'), 'shared product results');
  assert(screen.includes("mode === 'missing'"), 'missing mode load');
});

run('CTA copy — missing shopping', () => {
  assert(SHOPPING_COPY.missingIngredientsCta.includes('부족한 재료'), 'cta label');
  assert(SHOPPING_COPY.missingIngredientsCtaHint.includes('없는 재료만'), 'cta hint');
});

run('Missing-only logic — owned ingredients excluded', () => {
  const full = buildRecipeShoppingList('001');
  assert(full.found && full.items.length > 0, 'recipe 001 has items');

  const owned = full.items[0]!;
  const pantry = pantryFromIconKeys([{ iconKey: owned.iconKey, name: owned.ingredientName }]);
  const missing = buildMissingRecipeShoppingList('001', pantry);
  assert(
    missing.items.every((item) => item.matchKey !== owned.matchKey),
    'owned matchKey excluded from missing list',
  );
  assert(
    missing.items.every((item) => item.isMissing === true),
    'missing items flagged',
  );
});

run('Missing-only from fridge names — filter to missing set', () => {
  const full = buildRecipeShoppingList('001');
  assert(full.found, 'found');
  const subset = full.items.slice(0, Math.min(2, full.items.length)).map((i) => i.ingredientName);
  const list = buildMissingShoppingListFromNames('001', subset);
  assert(list.items.length === subset.length, 'only named missing items');
  assert(
    list.items.every((item) => subset.includes(item.ingredientName)),
    'subset only',
  );
});

run('Shared outbound path for product cards', () => {
  const results = read('components/shopping/ShoppingProductResults.tsx');
  assert(results.includes('openShoppingProduct'), 'reuses openShoppingProduct');
  const outbound = read('services/shopping/openShoppingProduct.ts');
  assert(outbound.includes('isHttpOrHttpsUrl'), 'android https open fix present');
});

run('Compact card embeds missing shopping CTA', () => {
  const card = read('components/fridge/FridgeRaidCompactCard.tsx');
  const feed = read('components/fridge/FridgeRaidCompactFeed.tsx');
  assert(card.includes('onPressShopping'), 'shopping press prop');
  assert(card.includes('missingCount'), 'missing count gate');
  assert(card.includes('shoppingCta'), 'in-card CTA style');
  assert(card.includes("color: '#FFFFFF'"), 'white CTA text');
  assert(feed.includes('mode=missing'), 'feed routes missing-only');
  assert(feed.includes('onPressShopping'), 'feed wires shopping');
});

console.log('\nSprint 64 fridge shopping bridge QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — fridge shopping bridge');
