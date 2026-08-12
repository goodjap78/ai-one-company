/**
 * Detail hero must reuse Home hero focal rendering (no 128% focalScale crop).
 * Run: npx tsx scripts/test-detail-hero-parity.ts
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

console.log('Detail hero parity — start\n');

run('RecipeHeroImage uses HomeHeroFocalImage (same as Home)', () => {
  const hero = read('components/recipe/RecipeHeroImage.tsx');
  assert.ok(hero.includes('HomeHeroFocalImage'));
  assert.ok(!hero.includes('FocalMealImage'));
  assert.ok(hero.includes('imageFill'));
  assert.ok(hero.includes("height: '100%'"));
});

run('MealHeroImage home path uses same fill override', () => {
  const home = read('components/home/MealHeroImage.tsx');
  assert.ok(home.includes('HomeHeroFocalImage'));
  assert.ok(home.includes("height: '100%'"));
});

run('HomeHeroFocalImage applies style after layout (height override)', () => {
  const focal = read('components/home/HomeHeroFocalImage.tsx');
  assert.ok(focal.includes('style={[styles.image, layout, style]}'));
  assert.ok(focal.includes('absoluteFillObject'));
});

run('FocalMealImage kept for small cards only', () => {
  const alt = read('components/home/AlternativeMealsRow.tsx');
  assert.ok(alt.includes('FocalMealImage'));
  assert.ok(alt.includes('focalScale'));
});

run('Detail hero container height unchanged (aspect 1.6 clamp)', () => {
  const hero = read('components/recipe/RecipeHeroImage.tsx');
  const ref = read('components/recipe/recipePremiumStyles.ts');
  assert.ok(hero.includes('useRecipeHeroHeight'));
  assert.ok(ref.includes('aspectRatio: 1.6'));
  assert.ok(ref.includes('minHeight: 188'));
  assert.ok(ref.includes('maxHeight: 220'));
});

console.log(`\nDetail hero parity — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
