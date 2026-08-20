/**
 * Recipe detail compact density — CTA + serving control.
 * Run: npx tsx scripts/test-recipe-detail-density.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');
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

function read(rel: string): string {
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

console.log('Recipe detail density — start\n');

run('CTA cards are compact (~20–25% shorter, no clip)', () => {
  const src = read('components/shopping/RecipePrepChoiceCta.tsx');
  assert.ok(src.includes('minHeight: 82'));
  assert.ok(!src.includes('minHeight: 108'));
  assert.ok(src.includes('paddingVertical: 8'));
  assert.ok(src.includes('gap: 2'));
  assert.ok(src.includes('fontSize: 16'));
  assert.ok(src.includes('numberOfLines={2}'));
  assert.ok(src.includes('flex: 1'));
  assert.ok(src.includes('minWidth: 0'));
  assert.ok(src.includes('ds.colors.primary'));
  assert.ok(src.includes('pastelCard'));
});

run('Serving control compact with usable tap target', () => {
  const src = read('components/recipe/RecipeServingAdjuster.tsx');
  assert.ok(src.includes('paddingVertical: 8'));
  assert.ok(src.includes('gap: 6'));
  assert.ok(src.includes('width: 40'));
  assert.ok(src.includes('height: 40'));
  assert.ok(src.includes('hitSlop={8}'));
  assert.ok(src.includes('servingAdjustDecreaseA11y'));
  assert.ok(src.includes('servingAdjustIncreaseA11y'));
});

run('Order still CTA → servings → ingredients', () => {
  const src = read('components/ingredients/IngredientsScreen.tsx');
  const cta = src.indexOf('<RecipePrepChoiceCta');
  const servings = src.indexOf('<RecipeServingAdjuster');
  const list = src.indexOf('<RecipeIngredientsList');
  assert.ok(cta >= 0 && servings > cta && list > servings);
});

console.log(`\nRecipe detail density — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
