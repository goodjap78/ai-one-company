import { lookupIngredientAlias } from '../data/ingredients/ingredientAliases';
import { resolveIngredientIconMeta } from '../services/images/resolveIngredientIcon';

const cases: Array<[string, string]> = [
  ['양파', 'onion'],
  ['대파', 'green_onion'],
  ['파', 'green_onion'],
  ['계란', 'egg'],
  ['달걀', 'egg'],
  ['돼지고기', 'pork'],
  ['앞다리살', 'pork'],
  ['돼지 앞다리살', 'pork'],
  ['간장', 'soy_sauce'],
  ['국간장', 'soy_sauce'],
  ['김치', 'kimchi'],
  ['두부', 'tofu'],
  ['마늘', 'garlic'],
  ['다진마늘', 'garlic'],
];

let failed = 0;
for (const [name, expected] of cases) {
  const alias = lookupIngredientAlias(name);
  const meta = resolveIngredientIconMeta({ name });
  const ok = alias === expected && meta.requestedKey === expected;
  console.log(
    `${ok ? 'OK' : 'FAIL'}  ${name} -> alias=${alias} meta=${meta.requestedKey} source=${meta.source} (want ${expected})`,
  );
  if (!ok) failed += 1;
}

const noKey = resolveIngredientIconMeta({ name: '양파' });
console.log('name-only onion:', noKey.requestedKey, noKey.source);

const explicit = resolveIngredientIconMeta({ name: '양파', iconKey: 'beef' });
console.log('explicit beef over onion name:', explicit.requestedKey, explicit.source);

if (failed) {
  console.error(`Failed: ${failed}`);
  process.exit(1);
}
console.log('All alias validations passed.');
