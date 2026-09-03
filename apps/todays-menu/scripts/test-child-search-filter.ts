/**
 * HANKKI v1.1 — Child context search + filter QA.
 * Run: npm run test:child-search-filter
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ELEMENTARY_BROWSE_HREF,
  ELEMENTARY_BREAKFAST_WEEK_HREF,
} from '../constants/appRoutes';
import { childSearchCopy } from '../constants/childSearchCopy';
import { listBabyFoodFeedRecipes } from '../data/recipes/babyFoodFeed';
import {
  applyBabyFilters,
  EMPTY_BABY_FILTERS,
  EMPTY_ELEMENTARY_FILTERS,
  EMPTY_TODDLER_FILTERS,
  matchesBabyTextureFilter,
} from '../data/recipes/childSearchFilters';
import { listElementaryBrowseRecipes } from '../data/recipes/elementaryBrowseFeed';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { listToddlerMealFeedRecipes } from '../data/recipes/toddlerMealFeed';
import {
  searchBabyFeedRecipes,
  searchElementaryBrowseRecipes,
  searchToddlerFeedRecipes,
} from '../services/search/childRecipeSearch';
import {
  countBabyToddlerIngredientMatchesInGlobal,
  isExactChildMenuNameMatch,
  searchHankkiGlobalSupplement,
} from '../services/search/globalHankkiSearchPolicy';
import {
  ANALYTICS_EVENTS,
  FORBIDDEN_ANALYTICS_PARAM_KEYS,
} from '../services/analytics/analyticsEvents';

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

console.log('HANKKI v1.1 child search + filter QA — start\n');

run('catalog counts unchanged', () => {
  assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
  assert(listBabyFoodFeedRecipes().length === 70, `baby feed 70 (got ${listBabyFoodFeedRecipes().length})`);
  assert(
    listToddlerMealFeedRecipes().length === 74,
    `toddler feed 74 (got ${listToddlerMealFeedRecipes().length})`,
  );
  assert(
    listElementaryBrowseRecipes().length === 78,
    `elementary browse 78 (got ${listElementaryBrowseRecipes().length})`,
  );
});

run('baby search 소고기 → baby eligible only', () => {
  const results = searchBabyFeedRecipes('early', '소고기', EMPTY_BABY_FILTERS);
  assert(results.length > 0, 'baby beef search has results');
  assert(
    results.every((recipe) => listBabyFoodFeedRecipes('early').some((item) => item.id === recipe.id)),
    'results stay in baby early pool',
  );
  assert(
    results.every((recipe) => recipe.familyAudience.audiences.includes('baby')),
    'baby audience only',
  );
});

run('toddler search 계란 → toddler eligible only', () => {
  const results = searchToddlerFeedRecipes('breakfast', '계란', EMPTY_TODDLER_FILTERS);
  assert(results.length > 0, 'toddler egg search has results');
  assert(
    results.every((recipe) => listToddlerMealFeedRecipes('breakfast').some((item) => item.id === recipe.id)),
    'results stay in toddler breakfast pool',
  );
  assert(
    results.every((recipe) => recipe.familyAudience.audiences.includes('toddler')),
    'toddler audience only',
  );
});

run('elementary search 주먹밥 → elementary eligible only', () => {
  const results = searchElementaryBrowseRecipes('주먹밥', EMPTY_ELEMENTARY_FILTERS);
  assert(results.length > 0, 'elementary rice ball search has results');
  assert(
    results.every((recipe) => listElementaryBrowseRecipes().some((item) => item.id === recipe.id)),
    'results stay in elementary browse pool',
  );
  assert(
    results.every((recipe) => recipe.familyAudience.audiences.includes('elementary')),
    'elementary audience only',
  );
});

run('global ingredient exclude — 계란 does not flood baby/toddler', () => {
  const wouldMatch = countBabyToddlerIngredientMatchesInGlobal('계란');
  assert(wouldMatch > 0, `baby/toddler recipes contain 계란 to guard (${wouldMatch})`);

  const supplement = searchHankkiGlobalSupplement('계란');
  const babyToddlerHits = supplement.filter((item) => {
    const recipe = HANKKI_RECIPES.find((row) => row.id === item.recipeId);
    if (!recipe) return false;
    const audiences = recipe.familyAudience.audiences;
    return (
      audiences.includes('baby') ||
      (audiences.includes('toddler') && !audiences.includes('general'))
    );
  });
  assert(babyToddlerHits.length === 0, `HANKKI supplement 계란 baby/toddler hits 0 (got ${babyToddlerHits.length})`);
});

run('exact child menu name allowed in global search', () => {
  const sample = listBabyFoodFeedRecipes().find((recipe) => recipe.name.includes('죽'));
  assert(Boolean(sample), 'sample baby porridge exists');
  const exactName = sample!.name;
  assert(isExactChildMenuNameMatch(exactName, exactName), 'exact match helper');
  const supplement = searchHankkiGlobalSupplement(exactName);
  assert(
    supplement.some((item) => item.recipeId === sample!.id),
    'exact baby menu appears in global supplement',
  );
});

run('filter AND — baby stage + texture + main ingredient', () => {
  const latePool = listBabyFoodFeedRecipes('late');
  const beefLate = latePool.filter((recipe) =>
    applyBabyFilters(recipe, {
      ...EMPTY_BABY_FILTERS,
      mainIngredient: 'beef',
      texture: 'mashed_rice',
    }),
  );
  const searched = searchBabyFeedRecipes('late', '', {
    ...EMPTY_BABY_FILTERS,
    mainIngredient: 'beef',
    texture: 'mashed_rice',
  });
  assert(searched.length === beefLate.length, 'search + filter AND matches manual filter');
  if (searched.length > 0) {
    assert(
      searched.every(
        (recipe) =>
          matchesBabyTextureFilter(recipe, 'mashed_rice') &&
          applyBabyFilters(recipe, { ...EMPTY_BABY_FILTERS, mainIngredient: 'beef' }),
      ),
      'AND semantics hold on sample',
    );
  }
});

run('zero-result copy constants present', () => {
  assert(childSearchCopy.emptyTitle.includes('없어요'), 'empty title');
  assert(childSearchCopy.emptyHint.includes('필터'), 'empty hint');
  assert(childSearchCopy.searchPlaceholder.includes('검색'), 'search placeholder');
});

run('legacy search index unchanged size', () => {
  const source = read('services/search/recipeSearchIndex.ts');
  assert(source.includes('getRecipeSearchIndex'), 'legacy index module intact');
  assert(read('services/search/recipeSearchService.ts').includes('searchHankkiGlobalSupplement'), 'global merge wired');
});

run('home/fridge exclusion count unchanged', () => {
  assert(
    listGeneralHomeExcludedRecipeIds().length === 144,
    `home excluded 144 (got ${listGeneralHomeExcludedRecipeIds().length})`,
  );
});

run('weekly breakfast candidates unchanged', () => {
  assert(
    listElementaryBreakfastWeekCandidates().length === 45,
    `weekly breakfast candidates 45 (got ${listElementaryBreakfastWeekCandidates().length})`,
  );
});

run('routes and UI wiring', () => {
  assert(read('app/elementary-browse.tsx').includes('ElementaryBrowseScreen'), 'elementary browse route');
  assert(read('app/_layout.tsx').includes('elementary-browse'), 'layout route');
  assert(read('constants/appRoutes.ts').includes(ELEMENTARY_BROWSE_HREF), 'browse href');
  assert(read('components/babyFood/BabyFoodFeedScreen.tsx').includes('ChildSearchBar'), 'baby search bar');
  assert(read('components/toddlerMeals/ToddlerMealFeedScreen.tsx').includes('ToddlerChildFilters'), 'toddler filters');
  assert(read('components/elementary/ElementaryBrowseScreen.tsx').includes('ELEMENTARY_DINNER_WEEK_HREF'), 'browse dinner entry');
  assert(read('components/elementary/ElementaryBrowseScreen.tsx').includes('ELEMENTARY_BREAKFAST_WEEK_HREF'), 'browse breakfast entry');
  assert(read('components/home/HomePurposeSubPanel.tsx').includes('ELEMENTARY_BROWSE_HREF') || read('components/home/HomePurposeSubPanel.tsx').includes('homeIaCopy'), 'home browse entry');
  assert(
    read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx').includes(
      'ElementaryWeeklyMealSwitch',
    ),
    'weekly breakfast → dinner switch',
  );
  assert(
    read('components/elementaryDinner/ElementaryDinnerWeeklyPlanScreen.tsx').includes(
      'ElementaryWeeklyMealSwitch',
    ),
    'weekly dinner → breakfast switch',
  );
});

run('analytics events registered without forbidden query params', () => {
  assert(ANALYTICS_EVENTS.childSearch === 'child_search', 'child_search event');
  assert(ANALYTICS_EVENTS.childFilterChange === 'child_filter_change', 'child_filter_change event');
  assert(ANALYTICS_EVENTS.childSearchRecipeClick === 'child_search_recipe_click', 'click event');
  assert(FORBIDDEN_ANALYTICS_PARAM_KEYS.includes('query'), 'query forbidden');
  const analyticsSource = read('services/analytics/analyticsEvents.ts');
  assert(analyticsSource.includes('query_length'), 'query_length allowed');
  assert(analyticsSource.includes('filter_types'), 'filter_types allowed');
});

run('ChildRecipeBrowseList uses FlatList virtualization', () => {
  const list = read('components/child/ChildRecipeBrowseList.tsx');
  assert(list.includes('FlatList'), 'FlatList');
  assert(list.includes('keyExtractor'), 'keyExtractor');
  assert(list.includes('scrollEnabled={false}'), 'nested scroll pattern');
  assert(!list.includes('recipes.map'), 'no full map');
});

console.log('\n--- summary ---');
if (failed === 0) {
  console.log('PASS — child search + filter QA');
  process.exit(0);
}
console.error(`FAIL — ${failed} assertion(s)`);
process.exit(1);
