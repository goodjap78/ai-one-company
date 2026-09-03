/**
 * Sprint v1.1 toddler feed UI QA.
 * Run: npm run test:toddler-feed
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TODDLER_MEALS_HREF } from '../constants/appRoutes';
import { northStarHomeCopy } from '../constants/northStarHomeCopy';
import { HOME_PURPOSES } from '../constants/homeIaCopy';
import { toddlerMealFeedCopy } from '../constants/toddlerMealFeedCopy';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import {
  isEligibleToddlerMealFeedRecipe,
  listToddlerMealFeedRecipes,
  pickToddlerMealFeed,
  TODDLER_FEED_MEAL_TYPES,
} from '../data/recipes/toddlerMealFeed';
import { TODDLER_CANDIDATE_REVIEW_IDS } from '../data/recipes/toddlerCandidateReviews';
import { TODDLER_PILOT_IDS } from '../data/recipes/toddlerPilotOverrides';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import { buildRecommendationCandidatePool } from '../services/recommendation/buildCandidatePool';
import { resolveDefaultToddlerFeedMealType } from '../services/toddlerMeals/resolveDefaultToddlerFeedMealType';
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

function atLocal(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

console.log('Sprint v1.1 toddler feed UI QA — start\n');

run('catalog 517 with toddler explicit recipes', () => {
  assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
  const toddler = HANKKI_RECIPES.filter((recipe) =>
    recipe.familyAudience.audiences.includes('toddler'),
  );
  assert(toddler.length === 74, `toddler explicit 74 (got ${toddler.length})`);
  assert(
    toddler.every((recipe) => TODDLER_PILOT_IDS.includes(recipe.id as (typeof TODDLER_PILOT_IDS)[number])),
    'feed uses existing toddler pilot ids only',
  );
});

run('mealType eligible counts match toddler pilot slots', () => {
  const expectedByMealType: Record<(typeof TODDLER_FEED_MEAL_TYPES)[number], number> = {
    breakfast: 21,
    lunch: 19,
    dinner: 24,
    snack: 16,
  };
  for (const mealType of TODDLER_FEED_MEAL_TYPES) {
    const recipes = listToddlerMealFeedRecipes(mealType);
    assert(
      recipes.length === expectedByMealType[mealType],
      `${mealType} ${expectedByMealType[mealType]} (got ${recipes.length})`,
    );
    assert(
      recipes.every((recipe) => recipe.standardMetadata.mealTypes.includes(mealType)),
      `${mealType} recipes match standardMetadata.mealTypes`,
    );
  }
  assert(listToddlerMealFeedRecipes().length === 74, 'all toddler feed eligible 74');
});

run('needs_adaptation / excluded / kids_meal-only / elementary-only stay out', () => {
  const feedIds = new Set(listToddlerMealFeedRecipes().map((recipe) => recipe.id));
  for (const id of TODDLER_CANDIDATE_REVIEW_IDS) {
    assert(!feedIds.has(id), `${id} original STRONG candidate is not in feed`);
  }

  const needsAdaptation = HANKKI_RECIPES.filter(
    (recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'needs_adaptation',
  );
  assert(needsAdaptation.length === 14, `needs_adaptation 14 (got ${needsAdaptation.length})`);
  assert(
    needsAdaptation.every((recipe) => !isEligibleToddlerMealFeedRecipe(recipe)),
    'needs_adaptation feed 0',
  );

  const excluded = HANKKI_RECIPES.filter(
    (recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'excluded',
  );
  assert(excluded.length === 2, `excluded 2 (got ${excluded.length})`);
  assert(
    excluded.every((recipe) => !isEligibleToddlerMealFeedRecipe(recipe)),
    'excluded feed 0',
  );

  const kidsMealOnly = HANKKI_RECIPES.filter(
    (recipe) =>
      recipe.familyAudience.kidsMealTag && !recipe.familyAudience.audiences.includes('toddler'),
  );
  assert(kidsMealOnly.length > 0, 'kids_meal-only recipes exist');
  assert(
    kidsMealOnly.every((recipe) => !isEligibleToddlerMealFeedRecipe(recipe)),
    'kids_meal-only feed 0',
  );

  const elementaryOnly = HANKKI_RECIPES.filter(
    (recipe) =>
      recipe.familyAudience.audiences.includes('elementary') &&
      !recipe.familyAudience.audiences.includes('toddler'),
  );
  assert(elementaryOnly.length === 78, `elementary-only 78 (got ${elementaryOnly.length})`);
  assert(
    elementaryOnly.every((recipe) => !isEligibleToddlerMealFeedRecipe(recipe)),
    'elementary-only feed 0',
  );

  assert(
    HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby')).every(
      (recipe) => !isEligibleToddlerMealFeedRecipe(recipe),
    ),
    'baby audience stays out of toddler feed',
  );
});

run('default meal reuses clock slots; lateNight falls back to breakfast', () => {
  assert(resolveDefaultToddlerFeedMealType(atLocal(2026, 8, 25, 8, 0)) === 'breakfast', '08:00 breakfast');
  assert(resolveDefaultToddlerFeedMealType(atLocal(2026, 8, 25, 12, 0)) === 'lunch', '12:00 lunch');
  assert(resolveDefaultToddlerFeedMealType(atLocal(2026, 8, 25, 19, 0)) === 'dinner', '19:00 dinner');
  assert(
    resolveDefaultToddlerFeedMealType(atLocal(2026, 8, 25, 2, 0)) === 'breakfast',
    '02:00 lateNight → breakfast, not snack',
  );
});

run('refresh stays in mealType and does not repeat consecutively', () => {
  const first = pickToddlerMealFeed('breakfast');
  assert(Boolean(first), 'breakfast pick exists');
  if (!first) return;
  assert(first.alternatives.length === listToddlerMealFeedRecipes('breakfast').length - 1, 'alternatives = breakfast pool minus main');
  assert(
    !first.alternatives.some((recipe) => recipe.id === first.main.id),
    'main is not listed as alternative',
  );

  const second = pickToddlerMealFeed('breakfast', first.main.id);
  assert(Boolean(second), 'refresh pick exists');
  if (!second) return;
  assert(second.main.id !== first.main.id, 'refresh changes main when pool > 1');
  assert(second.mealType === 'breakfast', 'refresh stays in breakfast');
  assert(
    second.alternatives.every((recipe) => recipe.standardMetadata.mealTypes.includes('breakfast')),
    'alternatives stay breakfast',
  );

  const third = pickToddlerMealFeed('breakfast', second.main.id);
  assert(Boolean(third && third.main.id !== second.main.id), 'second refresh also changes');
});

run('unverified nutrition is not a display value', () => {
  const feed = listToddlerMealFeedRecipes();
  assert(
    feed.every((recipe) => recipe.nutrition.source === 'unverified'),
    'feed nutrition source unverified',
  );
  const calorieResolver = read('utils/resolveRecipeCalories.ts');
  assert(calorieResolver.includes("source === 'unverified'"), 'resolver hides unverified');
  assert(calorieResolver.includes('return null'), 'unverified returns null');
  const ingredients = read('components/ingredients/IngredientsScreen.tsx');
  assert(ingredients.includes('resolveRecipeCalories'), 'recipe detail uses calorie resolver');
  const screen = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(!screen.includes('resolveRecipeCalories'), 'feed does not show calories');
});

run('home entry is a live card beside elementary, not Coming Soon', () => {
  const kidsPurpose = HOME_PURPOSES.find((purpose) => purpose.id === 'kids');
  const toddler = kidsPurpose?.entries?.find((entry) => entry.id === 'toddlerMeals');
  const elementary = kidsPurpose?.entries?.find((entry) => entry.id === 'elementary');
  assert(Boolean(toddler), 'toddler home entry exists');
  assert(Boolean(elementary), 'elementary home entry remains');
  assert(toddler?.title === '유아식', 'home submenu title');
  assert(!('badge' in (toddler ?? {})), 'no 준비 중 badge');
  assert(!toddlerMealFeedCopy.screenTitle.toLowerCase().includes('toddler'), 'screen title has no toddler');
  assert(!toddlerMealFeedCopy.homeCardTitle.toLowerCase().includes('toddler'), 'home title has no toddler');
});

run('route and screen files exist', () => {
  assert(TODDLER_MEALS_HREF === '/toddler-meals', 'canonical href');
  assert(fs.existsSync(path.join(ROOT, 'app/toddler-meals.tsx')), 'route file');
  assert(
    fs.existsSync(path.join(ROOT, 'components/toddlerMeals/ToddlerMealFeedScreen.tsx')),
    'screen file',
  );
  const layout = read('app/_layout.tsx');
  assert(layout.includes('toddler-meals'), 'stack registers route');
});

run('home purpose panel opens toddler feed, not survey or weekly plan', () => {
  const src = read('components/home/HomePurposeSubPanel.tsx');
  assert(src.includes('TODDLER_MEALS_HREF') || src.includes('homeIaCopy'), 'toddler uses feed href');
  assert(src.includes('toddlerMeals'), 'toddler entry wired');
  assert(src.includes('ELEMENTARY_BROWSE_HREF') || src.includes('homeIaCopy'), 'elementary browse href');
});

run('feed screen uses existing recipe route, MealImageView, and refresh copy', () => {
  const screen = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(screen.includes('`/recipe/${recipeId}`'), 'recipeId detail route');
  assert(!screen.includes('ToddlerRecipeDetail'), 'no new detail screen');
  assert(screen.includes('MealImageView'), 'uses existing image view');
  assert(screen.includes('showEmojiFallback'), 'placeholder when image missing');
  assert(screen.includes('pickToddlerMealFeed'), 'uses feed picker');
  assert(screen.includes('inFlightRef'), 'in-flight guard');
  assert(toddlerMealFeedCopy.refreshButton === '다른 메뉴 추천', 'refresh copy');
  assert(!screen.includes('저염'), 'no 저염');
  assert(!screen.includes('저당'), 'no 저당');
  assert(!screen.includes('영양 균형') && !screen.includes('영양균형'), 'no 영양균형');
  assert(!screen.includes('아이에게 안전'), 'no unverified safety claim');
  assert(!screen.includes('kcal'), 'no kcal on feed');
  assert(!screen.includes('nutrition.calorie'), 'no nutrition number on feed');
});

run('analytics wrapper only, structured params, no recipe names', () => {
  const screen = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(screen.includes('trackToddlerMealFeedView'), 'view event');
  assert(screen.includes('trackToddlerMealRefresh'), 'refresh event');
  assert(screen.includes('trackToddlerMealRecipeClick'), 'click event');
  assert(screen.includes("setRecipeOpenSource('toddler_meal_feed')"), 'recipe open source');
  assert(!screen.includes('@react-native-firebase/analytics'), 'no direct firebase');
  assert(screen.includes('recipe_id: recipeId'), 'click payload uses recipeId');
  assert(screen.includes('meal_type: mealType'), 'click payload uses meal_type');
});

run('does not change home AI engine or elementary weekly plan', () => {
  const screen = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  const comingSoon = read('components/home/HomeComingSoonSection.tsx');
  const home = read('components/home/HomeScreen.tsx');
  const feed = read('data/recipes/toddlerMealFeed.ts');
  assert(!screen.includes('getMealTimeSlotHomeRecommendation'), 'feed UI not wired to home rec');
  assert(!screen.includes('recommendationEngine'), 'no home engine');
  assert(!feed.includes('getMealTimeSlotHomeRecommendation'), 'selector not wired to home rec');
  assert(!comingSoon.includes('pickToddlerMealFeed'), 'home card does not pick recipes');
  assert(!home.includes('pickToddlerMealFeed'), 'HomeScreen does not pick toddler recipes');
  assert(home.includes('<TodayMealCard'), 'home rec card still present');
  assert(listElementaryBreakfastWeekCandidates().length === 45, 'weekly plan eligible 45');
});

run('toddler-approved recipes are out of general homemade home catalog', () => {
  const excluded = new Set(listGeneralHomeExcludedRecipeIds());
  assert(excluded.size === 144, `home excluded 144 (got ${excluded.size})`);
  assert(
    TODDLER_PILOT_IDS.every((id) => excluded.has(id)),
    'all toddler pilot ids excluded from general home',
  );
  const gold = read('services/recommendation/goldMealCatalog.ts');
  assert(gold.includes('isExcludedFromGeneralHomeByRecipeId'), 'homemade catalog applies toddler home exclusion');
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
    'homemade home candidate pool eligible toddler count is 0',
  );
  assert(listToddlerMealFeedRecipes().length === 74, 'toddler feed still 74');
});

run('favorite stays on existing recipe detail; no new persistence', () => {
  const screen = read('components/toddlerMeals/ToddlerMealFeedScreen.tsx');
  assert(!screen.includes('AsyncStorage'), 'no new storage');
  assert(!screen.includes('Share'), 'no share');
  assert(!screen.includes('MediaLibrary'), 'no image save');
  assert(!screen.includes('generateElementaryBreakfastWeek'), 'no weekly plan save');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — toddler meal feed UI');
