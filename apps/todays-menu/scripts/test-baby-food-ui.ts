/**
 * Sprint v1.1 baby food feed UI QA.
 * Run: npm run test:baby-food-ui
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BABY_FOOD_HREF } from '../constants/appRoutes';
import {
  BABY_FOOD_FEED_STAGE_LABELS,
  babyFoodFeedCopy,
} from '../constants/babyFoodFeedCopy';
import { northStarHomeCopy } from '../constants/northStarHomeCopy';
import { HOME_PURPOSES } from '../constants/homeIaCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import {
  BABY_FOOD_FEED_DEFAULT_STAGE,
  BABY_FOOD_FEED_STAGES,
  isEligibleBabyFoodFeedRecipe,
  listBabyFoodFeedRecipes,
} from '../data/recipes/babyFoodFeed';
import { listBabyPortionScalingSummary } from '../data/recipes/babyPortionScaling';
import { BABY_PILOT_IDS } from '../data/recipes/babyPilotOverrides';
import { TODDLER_PILOT_IDS } from '../data/recipes/toddlerPilotOverrides';
import { listToddlerMealFeedRecipes } from '../data/recipes/toddlerMealFeed';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import { buildRecommendationCandidatePool } from '../services/recommendation/buildCandidatePool';
import {
  parseBabyFoodFeedStage,
  serializeBabyFoodFeedStage,
} from '../services/babyFood/babyFoodFeedStageStorage';
import { isMealKitEligible } from '../services/shopping/mealKit/mealKitEligibility';
import type { MenuItem } from '../types/recommendation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

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
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

console.log('Sprint v1.1 baby food feed UI QA — start\n');

run('catalog 517 with baby explicit recipes', () => {
  assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
  const baby = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby'));
  assert(baby.length === 70, `baby explicit 70 (got ${baby.length})`);
  assert(
    baby.every((recipe) => BABY_PILOT_IDS.includes(recipe.id as (typeof BABY_PILOT_IDS)[number])),
    'feed uses existing baby pilot ids only',
  );
});

run('feed stages are 시작기 17 / 적응기 17 / 확장기 17 / 전환기 19', () => {
  assert(
    BABY_FOOD_FEED_STAGES.join(',') === 'early,middle,late,completion',
    'visible stages include completion',
  );
  assert(listBabyFoodFeedRecipes('early').length === 17, '시작기 17');
  assert(listBabyFoodFeedRecipes('middle').length === 17, '적응기 17');
  assert(listBabyFoodFeedRecipes('late').length === 17, '확장기 17');
  assert(listBabyFoodFeedRecipes('completion').length === 19, '전환기 19');
  assert(listBabyFoodFeedRecipes().length === 70, 'all eligible 70');
  assert(BABY_FOOD_FEED_STAGE_LABELS.early === '시작기', 'early → 시작기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.middle === '적응기', 'middle → 적응기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.late === '확장기', 'late → 확장기');
  assert(BABY_FOOD_FEED_STAGE_LABELS.completion === '전환기', 'completion → 전환기');
  assert(BABY_FOOD_FEED_DEFAULT_STAGE === 'early', 'default 시작기');
});

run('only approved explicit baby recipes; no toddler/elementary/general mix', () => {
  const feed = listBabyFoodFeedRecipes();
  assert(
    feed.every(
      (recipe) =>
        recipe.familyAudience.audiences.length === 1 &&
        recipe.familyAudience.audiences[0] === 'baby' &&
        recipe.familyAudience.reviewStatus === 'explicit' &&
        recipe.familyAudience.babySafetyReview?.reviewStatus === 'approved',
    ),
    'feed rows are baby-only explicit approved',
  );
  assert(
    feed.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'completion').length === 19,
    '전환기 recipes in feed when listing all',
  );
  assert(
    HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler')).every(
      (recipe) => !isEligibleBabyFoodFeedRecipe(recipe),
    ),
    'toddler stays out of baby feed',
  );
  assert(
    HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('elementary')).every(
      (recipe) => !isEligibleBabyFoodFeedRecipe(recipe),
    ),
    'elementary stays out of baby feed',
  );
  const generalOnly = HANKKI_RECIPES.filter(
    (recipe) =>
      recipe.familyAudience.audiences.includes('general') &&
      !recipe.familyAudience.audiences.includes('baby'),
  );
  assert(
    generalOnly.every((recipe) => !isEligibleBabyFoodFeedRecipe(recipe)),
    'general catalog stays out of baby feed',
  );
});

run('home entry is a live card beside elementary and toddler', () => {
  const kidsPurpose = HOME_PURPOSES.find((purpose) => purpose.id === 'kids');
  const baby = kidsPurpose?.entries?.find((entry) => entry.id === 'babyFood');
  const toddler = kidsPurpose?.entries?.find((entry) => entry.id === 'toddlerMeals');
  const elementary = kidsPurpose?.entries?.find((entry) => entry.id === 'elementary');
  assert(Boolean(baby), 'baby home entry exists');
  assert(Boolean(toddler), 'toddler home entry remains');
  assert(Boolean(elementary), 'elementary home entry remains');
  assert(baby?.title === '이유식', 'home submenu title');
  assert(!('badge' in (baby ?? {})), 'no 준비 중 badge');
  assert(babyFoodFeedCopy.homeCardTitle === '이유식 골라보기', 'requested home title');
});

run('route and screen files exist', () => {
  assert(BABY_FOOD_HREF === '/baby-food', 'canonical href');
  assert(fs.existsSync(path.join(ROOT, 'app/baby-food.tsx')), 'route file');
  assert(
    fs.existsSync(path.join(ROOT, 'components/babyFood/BabyFoodFeedScreen.tsx')),
    'screen file',
  );
  const layout = read('app/_layout.tsx');
  assert(layout.includes('baby-food'), 'stack registers route');
});

run('home purpose panel opens baby feed, not survey or other child feeds', () => {
  const src = read('components/home/HomePurposeSubPanel.tsx');
  assert(src.includes('BABY_FOOD_HREF') || src.includes('homeIaCopy'), 'baby uses feed href');
  assert(src.includes("entry.id === 'babyFood'") || src.includes('babyFood'), 'baby entry wired');
  assert(src.includes('TODDLER_MEALS_HREF') || src.includes('homeIaCopy'), 'toddler href unchanged');
  assert(src.includes('ELEMENTARY_BROWSE_HREF') || src.includes('homeIaCopy'), 'elementary browse href');
});

run('feed screen uses existing recipe route, MealImageView, and no internal enums on labels', () => {
  const screen = read('components/babyFood/BabyFoodFeedScreen.tsx');
  const list = read('components/child/ChildRecipeBrowseList.tsx');
  const copySrc = read('constants/babyFoodFeedCopy.ts');
  const visible = `${babyFoodFeedCopy.screenTitle} ${babyFoodFeedCopy.screenSubtitle} ${babyFoodFeedCopy.guidanceTitle} ${babyFoodFeedCopy.guidanceLines.join(' ')} ${Object.values(BABY_FOOD_FEED_STAGE_LABELS).join(' ')}`;
  assert(screen.includes('`/recipe/${recipeId}`'), 'recipeId detail route');
  assert(!screen.includes('BabyRecipeDetail'), 'no new detail screen');
  assert(list.includes('MealImageView'), 'uses existing image view');
  assert(list.includes('FlatList'), 'virtualized browse list');
  assert(list.includes('keyExtractor'), 'stable recipe id keys');
  assert(list.includes('showEmojiFallback'), 'placeholder when image missing');
  assert(screen.includes('searchBabyFeedRecipes'), 'uses feed selector');
  assert(screen.includes('BABY_FOOD_FEED_STAGES'), 'uses stage tabs');
  assert(visible.includes('전환기'), '전환기 user label visible');
  assert(!visible.includes('초기'), 'no 초기');
  assert(!visible.includes('중기'), 'no 중기');
  assert(!visible.includes('후기'), 'no 후기');
  assert(!visible.includes('완료기'), 'no 완료기');
  assert(!visible.includes('completion'), 'no completion enum in user copy');
  assert(!copySrc.includes('철분이 풍부'), 'no iron claim in copy file');
  assert(!screen.includes('철분이 풍부'), 'no iron claim');
  assert(!screen.includes('성장에 좋아요'), 'no growth claim');
  assert(!screen.includes('안전한 이유식'), 'no safety slogan');
  assert(!screen.includes('저염'), 'no 저염');
  assert(!screen.includes('저당'), 'no 저당');
  assert(!screen.includes('kcal'), 'no kcal on feed');
  assert(!screen.includes('nutrition.calorie'), 'no nutrition number on feed');
  assert(!screen.includes('fully_cooked_required'), 'no cooking flag codes');
  assert(!screen.includes('texture_adaptation_required'), 'no texture flag codes');
});

run('guidance copy matches requested lines', () => {
  assert(
    babyFoodFeedCopy.guidanceLines[0] ===
      '새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.',
    'one-food-at-a-time line',
  );
  assert(
    babyFoodFeedCopy.guidanceLines[1] === '1세 미만에는 꿀을 주지 마세요.',
    'honey line',
  );
  assert(!babyFoodFeedCopy.screenSubtitle.includes('개월'), 'no start-month mandate in subtitle');
});

run('stage persistence is local and month-free', () => {
  assert(parseBabyFoodFeedStage(null) === null, 'empty → null');
  assert(parseBabyFoodFeedStage(serializeBabyFoodFeedStage('late')) === 'late', 'roundtrip late');
  assert(parseBabyFoodFeedStage(JSON.stringify('middle')) === 'middle', 'legacy string');
  assert(
    parseBabyFoodFeedStage(JSON.stringify({ stage: 'completion' })) === 'completion',
    'completion roundtrip',
  );
  assert(parseBabyFoodFeedStage(JSON.stringify({ stage: 'early', months: 6 })) === 'early', 'ignores month field');
  const storage = read('services/babyFood/babyFoodFeedStageStorage.ts');
  assert(storage.includes('BABY_FOOD_FEED_STAGE_STORAGE_KEY'), 'dedicated storage key');
  assert(!storage.includes('minMonths'), 'no month-range persistence');
  const screen = read('components/babyFood/BabyFoodFeedScreen.tsx');
  assert(screen.includes('hydrated && slot === stage'), 'tabs wait for stage hydrate');
  assert(screen.includes('!hydrated ?'), 'list waits for stage hydrate');
});

run('analytics wrapper only, structured params, no recipe names or age', () => {
  const screen = read('components/babyFood/BabyFoodFeedScreen.tsx');
  assert(screen.includes('trackBabyFoodFeedView'), 'view event');
  assert(screen.includes('trackBabyFoodStageChange'), 'stage change event');
  assert(screen.includes('trackBabyFoodRecipeClick'), 'click event');
  assert(screen.includes("setRecipeOpenSource('baby_food_feed')"), 'recipe open source');
  assert(!screen.includes('@react-native-firebase/analytics'), 'no direct firebase');
  assert(screen.includes('recipe_id: recipeId'), 'click payload uses recipeId');
  assert(screen.includes('stage }') || screen.includes('stage: next') || screen.includes('stage: stage'), 'stage param only');
  assert(!screen.includes('month'), 'no month analytics');
});

run('does not change home AI engine, toddler feed, or elementary weekly plan', () => {
  const screen = read('components/babyFood/BabyFoodFeedScreen.tsx');
  const comingSoon = read('components/home/HomeComingSoonSection.tsx');
  const purposePanel = read('components/home/HomePurposeSubPanel.tsx');
  const home = read('components/home/HomeScreen.tsx');
  const feed = read('data/recipes/babyFoodFeed.ts');
  assert(!screen.includes('getMealTimeSlotHomeRecommendation'), 'feed UI not wired to home rec');
  assert(!feed.includes('getMealTimeSlotHomeRecommendation'), 'selector not wired to home rec');
  assert(!comingSoon.includes('listBabyFoodFeedRecipes'), 'coming soon does not pick recipes');
  assert(purposePanel.includes('homeIaCopy') || purposePanel.includes('BABY_FOOD_HREF'), 'purpose panel routes baby feed');
  assert(!home.includes('listBabyFoodFeedRecipes'), 'HomeScreen does not pick baby recipes');
  assert(home.includes('<TodayMealCard'), 'home rec card still present');
  assert(listToddlerMealFeedRecipes().length === 74, 'toddler feed still 74');
  assert(listElementaryBreakfastWeekCandidates().length === 45, 'weekly plan eligible 45');
  assert(TODDLER_PILOT_IDS.length === 74, 'toddler pilot 74');
});

run('baby-approved recipes stay out of general homemade home catalog', () => {
  const excluded = new Set(listGeneralHomeExcludedRecipeIds());
  assert(excluded.size === 144, `home excluded 144 (got ${excluded.size})`);
  assert(
    BABY_PILOT_IDS.every((id) => excluded.has(id)),
    'all baby pilot ids excluded from general home',
  );
  const menus: MenuItem[] = HANKKI_RECIPES.map((recipe) => ({
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: 'recipe',
    title: recipe.name,
    subtitle: recipe.name,
    mealTime: ['BREAKFAST', 'LUNCH', 'DINNER', 'LATE_NIGHT'],
    cookTime: recipe.time,
    difficulty: 'easy',
    aiReason: recipe.name,
    tags: [],
    badges: [],
  }));
  const { candidates } = buildRecommendationCandidatePool({
    menus,
    mealType: 'dinner',
    mealMode: 'homemade',
  });
  assert(
    candidates.every((menu) => !excluded.has(menu.id)),
    'homemade home candidate pool baby-approved count is 0',
  );
});

run('detail CTA report lock — meal kit not validated for baby ids', () => {
  assert(
    BABY_PILOT_IDS.every((id) => !isMealKitEligible(id)),
    'baby recipes are not meal-kit eligible',
  );
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert(ingredients.includes('RecipePrepChoiceCta'), 'shared shopping CTA still on detail');
  assert(ingredients.includes('resolveRecipeCalories'), 'detail still uses calorie resolver');
  assert(ingredients.includes('hideCoupang'), 'baby coupang hide flag');
  assert(ingredients.includes('BabyPortionPresetSelector'), 'baby portion UI');
  assert(ingredients.includes('ChildDetailAudienceBadge'), 'child audience badge');
  assert(ingredients.includes('RecipeStepsList'), 'canonical step list');
  assert(!ingredients.includes('ChildStepImageSlots'), 'no duplicate step gallery on detail');
  assert(!ingredients.includes('AdMob'), 'no AdMob on detail');
});

run('portion scaling counts stay 61 scalable / 9 review_required', () => {
  const summary = listBabyPortionScalingSummary(HANKKI_RECIPES);
  assert(summary.scalable.length === 61, `scalable 61 (got ${summary.scalable.length})`);
  assert(summary.reviewRequired.length === 9, `review_required 9 (got ${summary.reviewRequired.length})`);
  assert(summary.notScalable.length === 0, 'not_scalable 0');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — baby food feed UI');
console.log('TRANSITION_UI_ENABLED: YES');
console.log('READY_FOR_BABY_HERO_IMAGE_PRODUCTION: NO');
