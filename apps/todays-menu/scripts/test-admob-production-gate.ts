/**
 * AdMob production gate QA.
 * Run: npm run test:admob-production-gate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
  GOOGLE_TEST_ADMOB_APP_IDS,
  isAdMobBannerEnabledFor,
  isAdMobProductionReady,
  isAndroidAdMobAppIdProductionReady,
  resolveAdMobBannerUnitId,
  shouldFailEasProductionWithoutAppId,
  shouldInitializeAdMob,
} from '../constants/admobGate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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

const FIXTURE_APP_ID = 'ca-app-pub-1234567890123456~1234567890';
const FIXTURE_UNIT_ID = 'ca-app-pub-1234567890123456/1234567890';

const productionReadyEnv = {
  ADMOB_ANDROID_APP_ID: FIXTURE_APP_ID,
  EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID: FIXTURE_UNIT_ID,
  EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS: 'true',
};

console.log('AdMob production gate QA — start\n');

assert(
  resolveAdMobBannerUnitId({ platform: 'android', isDev: true }) ===
    GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
  'gate false + __DEV__ → TestIds adaptive banner',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: { EXPO_PUBLIC_QA_TOOLS: '1' },
  }) === GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
  'A. preview QA_TOOLS=1 → Google TEST adaptive banner unit',
);

assert(
  isAdMobBannerEnabledFor({
    platform: 'android',
    isDev: false,
    env: { EXPO_PUBLIC_QA_TOOLS: '1' },
  }) === true,
  'A. preview QA_TOOLS=1 → isAdMobBannerEnabled true',
);

assert(
  shouldInitializeAdMob({
    platform: 'android',
    isDev: false,
    env: { EXPO_PUBLIC_QA_TOOLS: '1' },
  }) === true,
  'E. preview QA_TOOLS=1 → shouldInitializeAdMob true',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: { EAS_BUILD_PROFILE: 'preview' },
  }) === null,
  'EAS_BUILD_PROFILE preview alone does not enable test ads',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: productionReadyEnv,
  }) === FIXTURE_UNIT_ID,
  'C. production gate on + real IDs → production unit',
);

assert(
  isAdMobBannerEnabledFor({
    platform: 'android',
    isDev: false,
    env: productionReadyEnv,
  }) === true,
  'C. production gate on + real IDs → isAdMobBannerEnabled true',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: true,
    env: productionReadyEnv,
  }) === FIXTURE_UNIT_ID,
  'gate true wins over __DEV__ (no test fallback)',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: {
      EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS: 'true',
    },
  }) === null,
  'gate true + missing unit → disabled, not TestIds',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: {
      EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS: 'true',
      EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID: GOOGLE_TEST_ADAPTIVE_BANNER_UNIT_ID,
    },
  }) === null,
  'gate true + Google sample unit → rejected',
);

assert(
  resolveAdMobBannerUnitId({
    platform: 'android',
    isDev: false,
    env: {
      EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS: '1',
      EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID: FIXTURE_UNIT_ID,
    },
  }) === null,
  'gate value must be the string true, not 1',
);

assert(
  resolveAdMobBannerUnitId({ platform: 'android', isDev: false, env: {} }) === null,
  'B. production env + production gate off → banner disabled',
);

assert(
  isAdMobBannerEnabledFor({ platform: 'android', isDev: false, env: {} }) === false,
  'B. production gate off → isAdMobBannerEnabled false',
);

assert(
  resolveAdMobBannerUnitId({ platform: 'ios', isDev: true, env: productionReadyEnv }) ===
    null,
  'D. iOS never gets a banner unit',
);

assert(
  isAdMobBannerEnabledFor({
    platform: 'ios',
    isDev: false,
    env: { EXPO_PUBLIC_QA_TOOLS: '1' },
  }) === false,
  'D. iOS + preview QA tools → banner disabled',
);

assert(
  shouldInitializeAdMob({ platform: 'ios', isDev: true }) === false,
  'D. iOS init off',
);

assert(
  shouldInitializeAdMob({ platform: 'android', isDev: false, env: {} }) === false,
  'B. production without gate does not initialize',
);

assert(isAdMobProductionReady({}) === false, 'current env is not production-ready');
assert(isAdMobProductionReady(productionReadyEnv) === true, 'fixture env is production-ready');
assert(
  isAndroidAdMobAppIdProductionReady({ ADMOB_ANDROID_APP_ID: GOOGLE_TEST_ADMOB_APP_IDS.android }) ===
    false,
  'Google sample App ID is not production-ready',
);

assert(
  shouldFailEasProductionWithoutAppId({
    EAS_BUILD_PROFILE: 'production',
    EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS: 'true',
  }) === true,
  'EAS production + gate + missing App ID → fail',
);

assert(
  shouldFailEasProductionWithoutAppId({
    EAS_BUILD_PROFILE: 'production',
  }) === false,
  'EAS production without gate does not fail config (ads stay off in JS)',
);

const gate = read('constants/admobGate.ts');
assert(!/ca-app-pub-(?!3940256099942544)\d{16}/.test(gate), 'gate file has no real publisher IDs');

const config = read('constants/admobConfig.ts');
assert(config.includes('TestIds.ADAPTIVE_BANNER'), 'runtime maps test env to TestIds');
assert(!/return\s+process\.env\b/.test(config), 'admobConfig does not pass whole process.env');
assert(config.includes('readClientAdMobRuntimeEnv'), 'admobConfig uses explicit client env helper');

const clientEnv = read('constants/admobClientEnv.ts');
assert(
  clientEnv.includes('process.env.EXPO_PUBLIC_QA_TOOLS'),
  'client env static EXPO_PUBLIC_QA_TOOLS',
);
assert(
  clientEnv.includes('process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID'),
  'client env static banner unit',
);
assert(
  clientEnv.includes('process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS'),
  'client env static production gate',
);
assert(!/return\s+process\.env\b/.test(clientEnv), 'client env does not return process.env');

assert(gate.includes('EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS'), 'gate env named');
assert(gate.includes('EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID'), 'banner env named');
assert(
  !/profile === 'development' \|\| profile === 'preview'/.test(gate),
  'client test-ad env does not use EAS_BUILD_PROFILE',
);

const banner = read('components/ads/AdMobBanner.native.tsx');
assert(banner.includes('requestNonPersonalizedAdsOnly'), 'NPA kept');
assert(banner.includes("Platform.OS !== 'android'"), 'Android UI gate kept');
assert(banner.includes('!unitId'), 'no BannerAd without unit');
assert(banner.includes('[AdMob QA] onAdFailedToLoad'), 'QA load-failure console log');
assert(banner.includes('isInternalQaEnabled'), 'QA diagnostics gated');

const init = read('services/ads/initAdMob.native.ts');
assert(init.includes('shouldInitializeAdMob'), 'init respects gate');
assert(init.includes("from '../../constants/admobGate'"), 'init does not eager-load TestIds');
assert(init.includes('readClientAdMobRuntimeEnv'), 'init uses explicit client env helper');
assert(!/env:\s*process\.env\b/.test(init), 'init does not pass whole process.env');

const appConfig = read('app.config.js');
assert(appConfig.includes("com.google.android.gms.permission.AD_ID"), 'AD_ID still blocked');
assert(appConfig.includes('blockedPermissions'), 'blockedPermissions kept');
assert(appConfig.includes('EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS'), 'config fail-closed when gate on');
assert(appConfig.includes('iosAppId'), 'iOS plugin App ID kept (GMA Info.plist)');

const home = read('components/home/HomeScreen.tsx');
assert(home.includes('<AdMobBanner'), 'home still mounts banner component');
assert(home.indexOf('<AdMobBanner') > home.indexOf('<CoupangDynamicBanner'), 'AdMob after Coupang');

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — AdMob production gate');
