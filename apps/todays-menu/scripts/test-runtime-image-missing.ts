/**
 * Runtime image missing audit — wiring QA.
 * Run: npm run test:runtime-image-missing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    return;
  }
  console.log(`✅ ${msg}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('Runtime image missing wiring QA — start\n');

assert(fs.existsSync(path.join(ROOT, 'scripts/audit-runtime-missing-images.ts')), 'audit script');
assert(read('utils/logMealImageLoadError.ts').includes('isInternalQaEnabled'), 'QA-gated log');
assert(read('utils/logMealImageLoadError.ts').includes('[MealImage QA] onError'), 'console warn tag');

const mealView = read('components/meal/MealImageView.tsx');
assert(mealView.includes('logMealImageLoadError'), 'MealImageView logs onError');
assert(mealView.includes('showEmojiFallback = false'), 'default still explicit');

const hero = read('components/recipe/RecipeHeroImage.tsx');
assert(hero.includes('onError={() => setPhotoFailed(true)}'), 'detail load-fail → emoji');
assert(hero.includes('showEmojiFallback'), 'detail emoji fallback');

const alts = read('components/home/AlternativeMealsRow.tsx');
assert(alts.includes('onError={() => setPhotoFailed(true)}'), 'alts load-fail → emoji');

const shopping = read('components/shopping/ShoppingScreen.tsx');
assert(shopping.includes('showEmojiFallback'), 'shopping no longer blank fallback');
assert(
  read('components/shopping/MealKitShoppingPanel.tsx').includes('showEmojiFallback'),
  'meal-kit shopping fallback',
);

const day = read('components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx');
assert(day.includes('showEmojiFallback'), 'weekly day card fallback');
const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
assert(cell.includes('showEmojiFallback'), 'share cell fallback');

assert(!mealView.includes('AdMob'), 'no ads in image view');
assert(!hero.includes('recipeQualityGrade'), 'no QA grade on hero');

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — runtime image missing wiring');
