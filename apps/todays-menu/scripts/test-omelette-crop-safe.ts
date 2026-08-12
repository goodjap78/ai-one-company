/**
 * Omelette crop-safe asset QA.
 * Run: npx tsx scripts/test-omelette-crop-safe.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CROP_SAFE_FOOD_RULE } from '../scripts/image-factory/engine/buildHeroPrompt';

const APP_ROOT = path.resolve(__dirname, '..');
const ASSET_PATH = path.join(APP_ROOT, 'assets/meals/omelette.jpg');

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

console.log('Omelette crop-safe QA — start\n');

run('Recipe 059 maps to omelette local asset', () => {
  const mapSrc = fs.readFileSync(path.join(APP_ROOT, 'data/recipes/recipeImageMap.ts'), 'utf8');
  assert.ok(mapSrc.includes("'059': { kind: 'local', key: 'omelette' }"));
});

run('omelette.jpg exists and is JPEG', () => {
  assert.ok(fs.existsSync(ASSET_PATH), 'asset file exists');
  const stat = fs.statSync(ASSET_PATH);
  assert.ok(stat.size > 50000, 'asset non-trivial size');
  const head = fs.readFileSync(ASSET_PATH).subarray(0, 2);
  assert.equal(head[0], 0xff);
  assert.equal(head[1], 0xd8);
});

run('mealImageAssets registers omelette', () => {
  const src = fs.readFileSync(path.join(APP_ROOT, 'services/images/mealImageAssets.ts'), 'utf8');
  assert.ok(src.includes('omelette: require'));
});

run('CROP_SAFE_FOOD_RULE exported in hero prompt engine', () => {
  assert.ok(CROP_SAFE_FOOD_RULE.length >= 5);
  assert.ok(CROP_SAFE_FOOD_RULE.some((r) => r.includes('safe-zone')));
});

run('SINGLE_DISH_HERO_POLICY documents CROP_SAFE', () => {
  const policy = fs.readFileSync(
    path.join(APP_ROOT, 'scripts/image-factory/SINGLE_DISH_HERO_POLICY.md'),
    'utf8',
  );
  assert.ok(policy.includes('CROP_SAFE_FOOD_RULE'));
  assert.ok(policy.includes('omelette.jpg'));
});

run('No focal override for 059 (crop-safe asset uses default)', () => {
  const focal = fs.readFileSync(
    path.join(APP_ROOT, 'data/recipes/homeHeroFocalOverrides.ts'),
    'utf8',
  );
  assert.ok(!focal.includes("'059'"));
});

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — omelette crop-safe');
