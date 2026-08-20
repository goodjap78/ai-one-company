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

run('V1 event list is exactly 12', () => {
  assert(ANALYTICS_EVENT_NAMES.length === 12, '12 event names');
  assert(new Set(ANALYTICS_EVENT_NAMES).size === 12, 'no duplicate names');
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

  assert(received.length === 12, `got ${received.length} events`);
  assert(received[0]?.name === ANALYTICS_EVENTS.recipeImpression, 'impression');
  assert(received[2]?.params.action === 'add', 'favorite action');
  assert(received[9]?.params.is_affiliate === 'true', 'affiliate flag');
  assert(received[9]?.params.keyword === undefined, 'no keyword on product click');
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
