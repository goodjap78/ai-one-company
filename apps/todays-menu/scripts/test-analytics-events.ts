/**
 * Analytics V1 — event contract + privacy + no-crash QA.
 * Run: npm run test:analytics-events
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_EVENTS,
  initAnalytics,
  resetAnalyticsContextForTests,
  resetAnalyticsForTests,
  sanitizeAnalyticsParams,
  setAnalyticsTestListener,
  toAnalyticsShoppingMode,
  trackConvenienceComboOpen,
  trackConvenienceOpen,
  trackElementaryWeeklyPlanImageSave,
  trackElementaryWeeklyPlanRecipeClick,
  trackElementaryWeeklyPlanRefresh,
  trackElementaryWeeklyPlanShare,
  trackElementaryWeeklyPlanView,
  trackToddlerMealFeedView,
  trackToddlerMealRecipeClick,
  trackToddlerMealRefresh,
  trackBabyFoodFeedView,
  trackBabyFoodRecipeClick,
  trackBabyFoodStageChange,
  trackBabyFoodTransitionView,
  trackBabyPortionChange,
  trackBabyWeeklyPlanRefresh,
  trackBabyWeeklyPlanRecipeClick,
  trackBabyWeeklyPlanSave,
  trackBabyWeeklyPlanShare,
  trackBabyWeeklyPlanStageChange,
  trackBabyWeeklyPlanView,
  trackBabyBatchCookingOpen,
  trackBabyBatchRecipeToggle,
  trackBabyBatchPortionChange,
  trackBabyBatchIngredientView,
  trackBabyGroceryChecklistView,
  trackBabyGroceryChecklistItemToggle,
  trackBabyGroceryChecklistReset,
  trackBabyGroceryChecklistShare,
  trackToddlerWeeklyPlanMealChange,
  trackToddlerWeeklyPlanRecipeClick,
  trackToddlerWeeklyPlanRefresh,
  trackToddlerWeeklyPlanSave,
  trackToddlerWeeklyPlanShare,
  trackToddlerWeeklyPlanView,
  trackChildRecipeDetailView,
  trackEvent,
  trackFavoriteChange,
  trackFridgeOpen,
  trackFridgeResult,
  trackMealKitCtaClick,
  trackRecipeImpression,
  trackRecipeOpen,
  trackRecommendationRefresh,
  trackShoppingCtaClick,
  trackShoppingProductClick,
  trackShoppingScreenView,
} from '../services/analytics';
import {
  isFirebaseAnalyticsNativeAvailable,
  resetFirebaseNativeCacheForTests,
} from '../services/analytics/firebaseNative';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
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

console.log('HANKKI Analytics V1 event QA — start\n');

run('V1 event list is exactly 49', () => {
  assert(ANALYTICS_EVENT_NAMES.length === 49, '49 event names');
  assert(new Set(ANALYTICS_EVENT_NAMES).size === 49, 'no duplicate names');
});

run('sanitize strips personal / forbidden params', () => {
  const sanitized = sanitizeAnalyticsParams({
    recipe_id: '001',
    nickname: '민수',
    email: 'a@b.com',
    keyword: '김치찌개 밀키트',
    title: '제육볶음',
    advertising_id: 'abc',
    ip: '1.2.3.4',
    is_affiliate: true,
    result_count: 3,
  });
  assert(sanitized.recipe_id === '001', 'keeps recipe_id');
  assert(sanitized.is_affiliate === 'true', 'boolean to string');
  assert(sanitized.result_count === 3, 'keeps number');
  assert(sanitized.nickname === undefined, 'drops nickname');
  assert(sanitized.email === undefined, 'drops email');
  assert(sanitized.keyword === undefined, 'drops keyword');
  assert(sanitized.title === undefined, 'drops title');
  assert(sanitized.advertising_id === undefined, 'drops advertising_id');
  assert(sanitized.ip === undefined, 'drops ip');
});

run('typed helpers emit expected event names and params', () => {
  const received: Array<{ name: string; params: Record<string, string | number> }> = [];
  resetAnalyticsForTests();
  setAnalyticsTestListener((name, params) => {
    received.push({ name, params });
  });

  trackRecipeImpression({ recipe_id: '001', meal_time: 'lunch', source: 'home' });
  trackRecipeOpen({ recipe_id: '001', source: 'home' });
  trackFavoriteChange({ recipe_id: '001', action: 'add' });
  trackRecommendationRefresh({ meal_time: 'lunch' });
  trackFridgeOpen();
  trackFridgeResult({ result_count: 4 });
  trackShoppingCtaClick({ recipe_id: '001', mode: 'all' });
  trackMealKitCtaClick({ recipe_id: '001' });
  trackShoppingScreenView({ recipe_id: '001', mode: 'meal_kit' });
  trackShoppingProductClick({
    recipe_id: '001',
    mode: 'all',
    merchant: 'coupang',
    is_affiliate: true,
  });
  trackConvenienceOpen();
  trackConvenienceComboOpen({ combo_id: 'combo_0001' });
  trackElementaryWeeklyPlanView({ mode: 'breakfast', seed: '42' });
  trackElementaryWeeklyPlanRefresh({ mode: 'breakfast', seed: '43' });
  trackElementaryWeeklyPlanRecipeClick({ mode: 'dinner', recipe_id: '001', seed: '42' });
  trackElementaryWeeklyPlanImageSave({ mode: 'breakfast', seed: '42' });
  trackElementaryWeeklyPlanShare({ mode: 'dinner', seed: '42' });
  trackToddlerMealFeedView({ meal_type: 'lunch' });
  trackToddlerMealRefresh({ meal_type: 'lunch' });
  trackToddlerMealRecipeClick({ recipe_id: 'recipe_0320', meal_type: 'breakfast' });
  trackBabyFoodFeedView({ stage: 'early' });
  trackBabyFoodStageChange({ stage: 'middle' });
  trackBabyFoodRecipeClick({ recipe_id: 'recipe_0336', stage: 'early' });
  trackBabyFoodTransitionView({ stage: 'completion' });
  trackChildRecipeDetailView({ recipe_id: 'recipe_0336', audience: 'baby', stage: 'early' });
  trackBabyPortionChange({ recipe_id: 'recipe_0336', audience: 'baby', portion: 3 });
  trackBabyWeeklyPlanView({ stage: 'early', seed: '42' });
  trackBabyWeeklyPlanStageChange({ stage: 'middle' });
  trackBabyWeeklyPlanRefresh({ stage: 'early', seed: '43' });
  trackBabyWeeklyPlanRecipeClick({ stage: 'late', recipe_id: 'recipe_0336', seed: '42' });
  trackBabyWeeklyPlanShare({ stage: 'early', seed: '42' });
  trackBabyWeeklyPlanSave({ stage: 'completion', seed: '42' });
  trackBabyBatchCookingOpen({ stage: 'early', selected_count: 0 });
  trackBabyBatchRecipeToggle({ stage: 'early', recipe_id: 'recipe_0336', selected_count: 2 });
  trackBabyBatchPortionChange({ stage: 'middle', recipe_id: 'recipe_0336', portion: 3 });
  trackBabyBatchIngredientView({ stage: 'early', selected_count: 3 });

  trackBabyGroceryChecklistView({ stage: 'early', item_count: 7, checked_count: 0 });
  trackBabyGroceryChecklistItemToggle({ stage: 'middle', item_count: 7, checked_count: 1 });
  trackBabyGroceryChecklistReset({ stage: 'early', item_count: 7, checked_count: 0 });
  trackBabyGroceryChecklistShare({ stage: 'late', item_count: 7, checked_count: 3 });

  trackToddlerWeeklyPlanView({ meal_type: 'dinner', seed: '42' });
  trackToddlerWeeklyPlanMealChange({ meal_type: 'lunch' });
  trackToddlerWeeklyPlanRefresh({ meal_type: 'breakfast', seed: '43' });
  trackToddlerWeeklyPlanRecipeClick({ meal_type: 'snack', recipe_id: 'recipe_0320', seed: '42' });
  trackToddlerWeeklyPlanSave({ meal_type: 'dinner', seed: '42' });
  trackToddlerWeeklyPlanShare({ meal_type: 'dinner', seed: '42' });

  assert(received.length === 46, `got ${received.length} events`);
  assert(received[0]?.name === ANALYTICS_EVENTS.recipeImpression, 'impression');
  assert(received[2]?.params.action === 'add', 'favorite action');
  assert(received[9]?.params.is_affiliate === 'true', 'affiliate flag');
  assert(received[9]?.params.keyword === undefined, 'no keyword on product click');
  assert(received[12]?.name === ANALYTICS_EVENTS.elementaryWeeklyPlanView, 'weekly plan view');
  assert(received[12]?.params.seed === '42', 'view seed only');
  assert(received[12]?.params.mode === 'breakfast', 'view mode');
  assert(received[14]?.params.recipe_id === '001', 'click recipe_id');
  assert(received[14]?.params.mode === 'dinner', 'click mode');
  assert(received[14]?.params.title === undefined, 'no recipe name on weekly plan click');
  assert(received[15]?.name === ANALYTICS_EVENTS.elementaryWeeklyPlanImageSave, 'image save');
  assert(received[16]?.name === ANALYTICS_EVENTS.elementaryWeeklyPlanShare, 'share');
  assert(received[16]?.params.seed === '42', 'share seed only');
  assert(received[16]?.params.mode === 'dinner', 'share mode');
  assert(received[17]?.name === ANALYTICS_EVENTS.toddlerMealFeedView, 'toddler feed view');
  assert(received[17]?.params.meal_type === 'lunch', 'view meal_type only');
  assert(received[18]?.name === ANALYTICS_EVENTS.toddlerMealRefresh, 'toddler refresh');
  assert(received[19]?.params.recipe_id === 'recipe_0320', 'toddler click recipe_id');
  assert(received[19]?.params.title === undefined, 'no recipe name on toddler click');
  assert(received[20]?.name === ANALYTICS_EVENTS.babyFoodFeedView, 'baby feed view');
  assert(received[20]?.params.stage === 'early', 'view stage only');
  assert(received[21]?.name === ANALYTICS_EVENTS.babyFoodStageChange, 'baby stage change');
  assert(received[22]?.params.recipe_id === 'recipe_0336', 'baby click recipe_id');
  assert(received[22]?.params.title === undefined, 'no recipe name on baby click');
  assert(received[22]?.params.stage === 'early', 'click stage only');
  assert(received[23]?.name === ANALYTICS_EVENTS.babyFoodTransitionView, 'transition view');
  assert(received[23]?.params.stage === 'completion', 'transition stage');
  assert(received[24]?.name === ANALYTICS_EVENTS.childRecipeDetailView, 'child detail view');
  assert(received[24]?.params.audience === 'baby', 'child detail audience');
  assert(received[24]?.params.title === undefined, 'no recipe name on child detail');
  assert(received[25]?.name === ANALYTICS_EVENTS.babyPortionChange, 'portion change');
  assert(received[25]?.params.portion === 3, 'portion value');
  assert(received[26]?.name === ANALYTICS_EVENTS.babyWeeklyPlanView, 'baby weekly view');
  assert(received[26]?.params.stage === 'early', 'baby weekly view stage');
  assert(received[26]?.params.seed === '42', 'baby weekly view seed');
  assert(received[27]?.name === ANALYTICS_EVENTS.babyWeeklyPlanStageChange, 'baby weekly stage change');
  assert(received[28]?.name === ANALYTICS_EVENTS.babyWeeklyPlanRefresh, 'baby weekly refresh');
  assert(received[29]?.params.recipe_id === 'recipe_0336', 'baby weekly click recipe_id');
  assert(received[29]?.params.title === undefined, 'no recipe name on baby weekly click');
  assert(received[30]?.name === ANALYTICS_EVENTS.babyWeeklyPlanShare, 'baby weekly share');
  assert(received[31]?.name === ANALYTICS_EVENTS.babyWeeklyPlanSave, 'baby weekly save');
  assert(received[32]?.name === ANALYTICS_EVENTS.babyBatchCookingOpen, 'batch open');
  assert(received[32]?.params.selected_count === 0, 'batch open count');
  assert(received[33]?.name === ANALYTICS_EVENTS.babyBatchRecipeToggle, 'batch toggle');
  assert(received[33]?.params.recipe_id === 'recipe_0336', 'toggle recipe_id');
  assert(received[34]?.name === ANALYTICS_EVENTS.babyBatchPortionChange, 'batch portion');
  assert(received[34]?.params.portion === 3, 'portion value');
  assert(received[35]?.name === ANALYTICS_EVENTS.babyBatchIngredientView, 'batch ingredient view');
  assert(received[36]?.name === ANALYTICS_EVENTS.babyGroceryChecklistView, 'grocery checklist view');
  assert(received[36]?.params.item_count === 7, 'checklist item_count');
  assert(received[36]?.params.title === undefined, 'no ingredient name on checklist view');
  assert(received[37]?.name === ANALYTICS_EVENTS.babyGroceryItemToggle, 'grocery item toggle');
  assert(received[38]?.name === ANALYTICS_EVENTS.babyGroceryChecklistReset, 'grocery reset');
  assert(received[39]?.name === ANALYTICS_EVENTS.babyGroceryChecklistShare, 'grocery share');
  assert(received[40]?.name === ANALYTICS_EVENTS.toddlerWeeklyPlanView, 'toddler weekly view');
  assert(received[40]?.params.meal_type === 'dinner', 'toddler view meal_type');
  assert(received[41]?.name === ANALYTICS_EVENTS.toddlerWeeklyPlanMealChange, 'toddler meal change');
  assert(received[42]?.name === ANALYTICS_EVENTS.toddlerWeeklyPlanRefresh, 'toddler refresh');
  assert(received[43]?.params.recipe_id === 'recipe_0320', 'toddler click recipe_id');
  assert(received[43]?.params.title === undefined, 'no recipe name on toddler weekly click');
  assert(received[44]?.name === ANALYTICS_EVENTS.toddlerWeeklyPlanSave, 'toddler save');
  assert(received[45]?.name === ANALYTICS_EVENTS.toddlerWeeklyPlanShare, 'toddler share');
  resetAnalyticsForTests();
});

run('view events are deduped within 2s; revisits with new params are kept', () => {
  const received: string[] = [];
  resetAnalyticsForTests();
  setAnalyticsTestListener((name) => {
    received.push(name);
  });

  trackRecipeOpen({ recipe_id: '001', source: 'home' });
  trackRecipeOpen({ recipe_id: '001', source: 'home' });
  trackRecipeOpen({ recipe_id: '003', source: 'home' });
  trackFavoriteChange({ recipe_id: '001', action: 'add' });
  trackFavoriteChange({ recipe_id: '001', action: 'add' });

  assert(received.filter((name) => name === 'recipe_open').length === 2, 'open deduped by params');
  assert(received.filter((name) => name === 'favorite_change').length === 2, 'clicks not deduped');
  resetAnalyticsForTests();
});

run('missing native firebase does not throw', () => {
  resetFirebaseNativeCacheForTests();
  resetAnalyticsForTests();
  initAnalytics();
  trackEvent('recipe_open', { recipe_id: '001', source: 'home' });
  assert(isFirebaseAnalyticsNativeAvailable() === false, 'node test has no native module');
});

run('shopping mode maps meal-kit to meal_kit', () => {
  assert(toAnalyticsShoppingMode('all') === 'all', 'all');
  assert(toAnalyticsShoppingMode('missing') === 'missing', 'missing');
  assert(toAnalyticsShoppingMode('meal-kit') === 'meal_kit', 'meal_kit');
});

run('screens call wrapper, not Firebase SDK directly', () => {
  const files = [
    'components/home/useHomeScreen.ts',
    'components/ingredients/IngredientsScreen.tsx',
    'components/fridge/FridgeRaidScreen.tsx',
    'components/fridge/FridgeRaidResultsScreen.tsx',
    'components/shopping/RecipePrepChoiceCta.tsx',
    'components/shopping/MealKitShoppingCta.tsx',
    'components/shopping/ShoppingScreen.tsx',
    'components/convenience/ConvenienceComboRecommendationScreen.tsx',
    'components/convenience/ConvenienceComboDetailScreen.tsx',
    'components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx',
    'components/toddlerMeals/ToddlerMealFeedScreen.tsx',
    'components/toddlerMeals/ToddlerWeeklyPlanScreen.tsx',
    'components/babyFood/BabyFoodFeedScreen.tsx',
    'components/babyFood/BabyFoodWeeklyPlanScreen.tsx',
    'components/babyFood/BabyBatchCookingSelectScreen.tsx',
    'components/babyFood/BabyBatchCookingResultScreen.tsx',
    'services/favorite/favoriteService.ts',
  ];
  for (const rel of files) {
    const src = read(rel);
    assert(!src.includes('@react-native-firebase/analytics'), `${rel} no direct firebase`);
    assert(
      src.includes("from '../../services/analytics'") || src.includes("from '../analytics'"),
      `${rel} uses wrapper`,
    );
  }
});

run('no custom install id / ad id collection', () => {
  const analytics = read('services/analytics/analytics.ts');
  const native = read('services/analytics/firebaseNative.ts');
  const combined = `${analytics}\n${native}`;
  assert(!combined.includes('installId'), 'no custom installId');
  assert(!combined.includes('advertisingId'), 'no advertisingId');
  assert(!combined.includes('getAdvertisingId'), 'no ad id API');
  assert(!combined.includes('nickname'), 'no nickname in wrapper');
});

run('Android AD_ID permissions are blocked; Ad ID collection remains off', () => {
  const firebaseJson = JSON.parse(read('firebase.json')) as {
    'react-native': Record<string, boolean>;
  };
  assert(
    firebaseJson['react-native'].google_analytics_adid_collection_enabled === false,
    'firebase.json adid collection disabled',
  );

  const appConfigSrc = read('app.config.js');
  for (const permission of [
    'com.google.android.gms.permission.AD_ID',
    'android.permission.ACCESS_ADSERVICES_AD_ID',
    'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
  ]) {
    assert(appConfigSrc.includes(`'${permission}'`), `app.config.js lists ${permission}`);
  }
  assert(appConfigSrc.includes('blockedPermissions'), 'uses Expo blockedPermissions');
  assert(appConfigSrc.includes('ANDROID_AD_ID_BLOCKED_PERMISSIONS'), 'Android-only AD_ID block list');
  assert(
    !appConfigSrc.includes('NSUserTrackingUsageDescription'),
    'iOS ATT description not introduced',
  );

  // Evaluate resolved config (google-services.json present in this repo).
  const requireFromHere = createRequire(import.meta.url);
  const { expo } = requireFromHere('../app.config.js') as {
    expo: { android?: { blockedPermissions?: string[] } };
  };
  const blocked = expo.android?.blockedPermissions ?? [];
  assert(blocked.includes('com.google.android.gms.permission.AD_ID'), 'resolved AD_ID blocked');
  assert(
    blocked.includes('android.permission.ACCESS_ADSERVICES_AD_ID'),
    'resolved ACCESS_ADSERVICES_AD_ID blocked',
  );
  assert(
    blocked.includes('android.permission.ACCESS_ADSERVICES_ATTRIBUTION'),
    'resolved ACCESS_ADSERVICES_ATTRIBUTION blocked',
  );
});

resetAnalyticsForTests();
resetAnalyticsContextForTests();

console.log('\nHANKKI Analytics V1 event QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS — analytics events');
