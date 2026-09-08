/**
 * Weekly recipe runtime navigation — static QA.
 * Run: npm run test:weekly-recipe-runtime
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

console.log('HANKKI weekly recipe runtime navigation QA — start\n');

const nav = read('utils/weeklyRecipeNavigation.ts');
assert(nav.includes("return `/ingredients/${recipeId}`"), 'canonical href is /ingredients/{id}');
assert(nav.includes('isInternalQaEnabled'), 'press log QA-gated');
assert(nav.includes('[Weekly Recipe QA]'), 'press log tag');
assert(nav.includes('[Weekly Recipe QA] recipe resolve failed'), 'bridge fail log tag');
assert(!nav.includes('Alert.alert'), 'no debug UI');

const weekScreens = [
  'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
  'components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx',
  'components/toddlerWeekly/ToddlerBfDnWeeklyPlanScreen.tsx',
];

for (const rel of weekScreens) {
  const src = read(rel);
  assert(src.includes('ElementaryWeeklyPlanDayCard'), `${rel} uses day card`);
  assert(src.includes('handleOpenRecipe'), `${rel} press handler`);
  assert(src.includes('weeklyRecipeDetailHref(slot.recipeId)'), `${rel} ingredients href`);
  assert(src.includes("setRecipeOpenSource('kids_weekly_plan')"), `${rel} analytics source`);
  assert(src.includes('recipe_id: slot.recipeId'), `${rel} analytics recipe_id`);
  assert(src.includes('seed: plan.seed'), `${rel} analytics seed`);
  assert(src.includes('logWeeklyRecipePressQa'), `${rel} QA press log`);
  assert(src.includes('left: -4000'), `${rel} capture host off-screen`);
  assert(src.includes('opacity: 1'), `${rel} capture host opaque for PNG`);
  assert(src.includes('pointerEvents="none"'), `${rel} capture pointerEvents none`);
  assert(!src.includes('recipeQualityGrade'), `${rel} no grade`);
}

const index = read('components/weeklyRecipes/WeeklyRecipeIndexScreen.tsx');
assert(index.includes('weeklyRecipeDetailHref(slot.recipeId)'), 'index ingredients href');
assert(index.includes("setRecipeOpenSource('kids_weekly_plan')"), 'index analytics source');
assert(index.includes('logWeeklyRecipePressQa'), 'index QA press log');

const card = read('components/elementaryWeekly/ElementaryWeeklyPlanDayCard.tsx');
assert(card.includes('<Pressable'), 'day card is Pressable');
assert(card.includes('onPress={onPress}'), 'onPress wired');
assert(card.includes('disabled={disabled}'), 'busy disables press');
assert(card.includes('weeklyRecipeAccessCopy.recipeViewCta'), 'CTA on visible card');
assert(card.includes('showEmojiFallback'), 'image fallback preserved');

const share = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
assert(!share.includes('Pressable'), 'share card not pressable');
assert(!share.includes('recipeViewCta'), 'CTA is not share-card-only');

const bridge = read('app/recipe/[id].tsx');
assert(bridge.includes('getMenuById(recipeId)'), 'bridge still checks menu registry first');
assert(bridge.includes('getHankkiRecipeById(recipeId)'), 'bridge resolves Hankki catalog');
assert(bridge.includes('fetchRecipe(recipeId)'), 'bridge still fetches leftover ids');
assert(bridge.includes("`/delivery/${recipeId}`"), 'delivery route preserved');
assert(bridge.includes('logWeeklyRecipeResolveFailedQa'), 'bridge fail QA log');
assert(bridge.includes("router.replace('/')"), 'unknown ids still go home');

assert(
  read('components/elementary/ElementaryBrowseScreen.tsx').includes('`/recipe/${recipeId}`'),
  'elementary browse still uses /recipe bridge',
);
assert(
  read('components/search/RecipeSearchScreen.tsx').includes('`/recipe/${item.recipeId}`'),
  'search still uses /recipe bridge',
);

const hero = read('components/recipe/RecipeHeroImage.tsx');
assert(hero.includes('onError={() => setPhotoFailed(true)}'), 'detail image fallback intact');
assert(hero.includes('showEmojiFallback'), 'detail emoji fallback intact');
assert(
  read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx').includes('showEmojiFallback'),
  'share cell image fallback intact',
);

const detail = read('components/ingredients/IngredientsScreen.tsx');
assert(detail.includes('recipe.title'), 'detail name');
assert(detail.includes('RecipeHeroImage'), 'detail image');
assert(detail.includes('RecipeInfoMeta'), 'detail servings/cook time');
assert(detail.includes('RecipeIngredientsList'), 'detail ingredients');
assert(detail.includes('RecipeStepsList'), 'detail steps');
assert(detail.includes('ToddlerDetailExtraSections'), 'toddler extras');
assert(detail.includes('ElementaryDetailExtraSections'), 'elementary extras');
assert(!detail.includes('recipeQualityGrade'), 'detail hides QA grade');

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — weekly recipe runtime navigation');
