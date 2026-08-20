/**
 * Phase 3 — 4 merged heroes crop-safe + image map + meal-kit eligibility.
 * Run: npx tsx scripts/test-meal-kit-phase3-heroes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { isMealKitEligible, getMealKitSearchKeyword } from '../services/shopping/mealKit/mealKitEligibility';
import { CROP_SAFE_FOOD_RULE } from './image-factory/engine/buildHeroPrompt';

const APP_ROOT = path.resolve(__dirname, '..');
const MERGED = [
  { id: 'recipe_0301', name: '밀푀유나베', key: 'millefeuille_nabe', keyword: '밀푀유나베 밀키트' },
  { id: 'recipe_0302', name: '불고기전골', key: 'bulgogi_jeongol', keyword: '불고기전골 밀키트' },
  { id: 'recipe_0303', name: '쭈꾸미볶음', key: 'jjuggumi_bokkeum', keyword: '쭈꾸미볶음 밀키트' },
  { id: 'recipe_0304', name: '해물탕', key: 'haemul_tang', keyword: '해물탕 밀키트' },
] as const;

let failed = 0;

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log('Phase 3 merged heroes — start\n');

run('CROP_SAFE_FOOD_RULE still in hero engine', () => {
  assert.ok(CROP_SAFE_FOOD_RULE.some((rule) => rule.includes('safe-zone')));
});

run('Home/Detail hero parity files unchanged', () => {
  const hero = fs.readFileSync(path.join(APP_ROOT, 'components/recipe/RecipeHeroImage.tsx'), 'utf8');
  const home = fs.readFileSync(path.join(APP_ROOT, 'components/home/MealHeroImage.tsx'), 'utf8');
  assert.ok(hero.includes('HomeHeroFocalImage'));
  assert.ok(hero.includes("height: '100%'"));
  assert.ok(home.includes('HomeHeroFocalImage'));
  assert.ok(!hero.includes('FocalMealImage'));
});

for (const item of MERGED) {
  run(`${item.id} catalog + map + jpeg + eligibility`, () => {
    const recipe = HANKKI_RECIPES.find((row) => row.id === item.id);
    assert.ok(recipe, 'recipe in catalog');
    assert.equal(recipe?.name, item.name);
    assert.equal(recipe?.heroImageKey, item.key);

    const mapSrc = fs.readFileSync(path.join(APP_ROOT, 'data/recipes/recipeImageMap.ts'), 'utf8');
    assert.ok(
      mapSrc.includes(`${item.id}: { kind: 'local', key: '${item.key}' }`),
      'recipeImageMap local key',
    );

    const asset = path.join(APP_ROOT, 'assets', 'meals', `${item.key}.jpg`);
    assert.ok(fs.existsSync(asset), `${item.key}.jpg exists`);
    const head = fs.readFileSync(asset).subarray(0, 2);
    assert.equal(head[0], 0xff);
    assert.equal(head[1], 0xd8);
    assert.ok(fs.statSync(asset).size > 50000, 'non-trivial jpeg');

    const registry = fs.readFileSync(
      path.join(APP_ROOT, 'services/images/mealImageAssets.ts'),
      'utf8',
    );
    assert.ok(registry.includes(`${item.key}: require`), 'mealImageAssets require');

    assert.equal(isMealKitEligible(item.id), true);
    assert.equal(getMealKitSearchKeyword(item.id), item.keyword);
  });
}

run('existing omelette hero not overwritten', () => {
  const omelette = path.join(APP_ROOT, 'assets', 'meals', 'omelette.jpg');
  assert.ok(fs.existsSync(omelette));
});

console.log(`\nPhase 3 merged heroes — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
