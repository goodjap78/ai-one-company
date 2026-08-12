/**
 * Sprint 63-B — shopping keyword normalization QA.
 * Run: npm run test:shopping-keyword
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { resolveIngredient } from '../services/ingredient/resolveIngredient';
import { getShoppingKeyword } from '../services/shopping/shoppingKeyword';
import { SHOPPING_KEYWORD_ALIASES } from '../services/shopping/shoppingAliases';

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

console.log('Sprint 63-B shopping keyword QA — start\n');

run('Scenario A — 대파 1/2대 name → keyword 대파', () => {
  assert(getShoppingKeyword('대파') === '대파', '대파 keyword');
  assert(getShoppingKeyword('  대파  ') === '대파', 'whitespace trim');
});

run('Scenario B — 다진마늘 → 다진 마늘', () => {
  assert(getShoppingKeyword('다진마늘') === '다진 마늘', 'diced garlic spacing');
});

run('Scenario H — shopping keyword never empty for catalog names', () => {
  let empty = 0;
  for (const recipe of HANKKI_RECIPES) {
    for (const ing of recipe.ingredients) {
      const keyword = getShoppingKeyword(ing.name);
      if (!keyword.trim()) empty += 1;
    }
  }
  assert(empty === 0, `empty keyword count ${empty}`);
});

run('IIE canonical not used — 밥 stays 밥 (not 쌀)', () => {
  assert(getShoppingKeyword('밥') === '밥', '밥 keyword');
  const iie = resolveIngredient('밥');
  assert(iie.canonicalName === '쌀', 'IIE still maps to 쌀');
  assert(getShoppingKeyword('밥') !== iie.canonicalName, 'shopping ignores IIE');
});

run('고추장 amount separate — keyword only', () => {
  assert(getShoppingKeyword('고추장') === '고추장', 'gochujang keyword');
});

run('Alias table entries resolve', () => {
  for (const [raw, expected] of Object.entries(SHOPPING_KEYWORD_ALIASES)) {
    assert(getShoppingKeyword(raw) === expected, `alias ${raw}`);
  }
});

console.log('\nSprint 63-B shopping keyword QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — shopping keyword');
