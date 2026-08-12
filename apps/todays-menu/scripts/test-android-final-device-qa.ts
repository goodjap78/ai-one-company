/**
 * Android final device QA polish — layout / CTA / image focal checks.
 * Run: npx tsx scripts/test-android-final-device-qa.ts
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

console.log('Android final device QA — start\n');

run('MealImageView regression fix — no mediaFrame absoluteFill trap', () => {
  const src = read('components/meal/MealImageView.tsx');
  assert.ok(!src.includes('mediaFrame'));
  assert.ok(src.includes('resizeMode="cover"'));
});

run('RecipeHeroImage uses HomeHeroFocalImage + recipeId (detail hero parity)', () => {
  const hero = read('components/recipe/RecipeHeroImage.tsx');
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert.ok(hero.includes('HomeHeroFocalImage'));
  assert.ok(hero.includes('recipeId'));
  assert.ok(hero.includes('imageFill'));
  assert.ok(ingredients.includes('recipeId={recipeId}'));
});

run('ShoppingScreen — redundant bottom purchase CTA removed', () => {
  const src = read('components/shopping/ShoppingScreen.tsx');
  assert.ok(!src.includes('styles.footer'));
  assert.ok(!src.includes('purchaseButton'));
  assert.ok(!src.includes('selectedSummary'));
  assert.ok(src.includes('ShoppingProductResults'));
});

run('Ingredients shopping CTA — orange primary', () => {
  const src = read('components/shopping/IngredientsShoppingCta.tsx');
  assert.ok(src.includes('ds.colors.primary'));
  assert.ok(src.includes("color: '#FFFFFF'"));
  assert.ok(src.includes('ingredientsCtaHint'));
});

run('RecipeDetailActions — other menu secondary CTA not underline link', () => {
  const src = read('components/recipe/RecipeDetailActions.tsx');
  assert.ok(src.includes('otherMenu'));
  assert.ok(src.includes('→'));
  assert.ok(!src.includes('textDecorationLine'));
  assert.ok(!src.includes('linkWrap'));
});

run('HomeComingSoon — taller cards without overflow clip', () => {
  const src = read('components/home/HomeComingSoonSection.tsx');
  assert.ok(src.includes('minHeight: 54'));
  assert.ok(src.includes('clipToPadding={false}'));
  assert.ok(src.includes('paddingBottom: 10'));
  assert.ok(!/btn:\s*\{[^}]*overflow:\s*'hidden'/s.test(src));
});

run('Fridge rotate CTA — copy defined, not empty box', () => {
  const copy = read('constants/fridgeRaidCopy.ts');
  const screen = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert.ok(copy.includes('anotherMenuRecommendation:'));
  assert.ok(copy.includes('다른 메뉴 추천'));
  assert.ok(screen.includes('anotherMenuRecommendation} →'));
});

run('Fridge more menus — secondary CTA style', () => {
  const src = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert.ok(src.includes('secondaryButton'));
  assert.ok(src.includes('showMoreMenus} →'));
});

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — android final device QA');
