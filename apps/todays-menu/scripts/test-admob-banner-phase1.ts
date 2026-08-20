/**
 * AdMob Android banner phase 1 — static config / placement QA.
 * Run: npx tsx scripts/test-admob-banner-phase1.ts
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

console.log('AdMob banner phase 1 QA — start\n');

const pkg = JSON.parse(read('package.json')) as {
  dependencies?: Record<string, string>;
};
assert(
  Boolean(pkg.dependencies?.['react-native-google-mobile-ads']),
  'package installed',
);

const appConfig = read('app.config.js');
assert(appConfig.includes('react-native-google-mobile-ads'), 'config plugin registered');
assert(appConfig.includes('ADMOB_ANDROID_APP_ID'), 'Android App ID from env');
assert(
  appConfig.includes('ca-app-pub-3940256099942544~3347511713'),
  'Google TEST App ID fallback',
);
assert(
  appConfig.includes("com.google.android.gms.permission.AD_ID"),
  'AD_ID still in blockedPermissions list',
);
assert(appConfig.includes('blockedPermissions'), 'blockedPermissions kept');

const banner = read('components/ads/AdMobBanner.tsx');
assert(banner.includes('TestIds') || read('constants/admobConfig.ts').includes('TestIds'), 'uses TestIds path');
assert(banner.includes('requestNonPersonalizedAdsOnly'), 'NPA request');
assert(banner.includes("Platform.OS !== 'android'") || banner.includes("Platform.OS === 'android'"), 'Android gated');
assert(banner.includes('onAdFailedToLoad'), 'hides on failure');
assert(!banner.includes('InterstitialAd'), 'no interstitial');
assert(!banner.includes('RewardedAd'), 'no rewarded');

const config = read('constants/admobConfig.ts');
assert(config.includes('TestIds.ADAPTIVE_BANNER'), 'phase1 adaptive test unit');
assert(config.includes('EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID') || config.includes('production'), 'prod unit path reserved in comments/config');
assert(!/ca-app-pub-\d{16}\/\d{10}/.test(config.replace(/3940256099942544/g, '')), 'no real production unit hardcoded');

const home = read('components/home/HomeScreen.tsx');
const coupang = home.indexOf('<CoupangDynamicBanner');
const admob = home.indexOf('<AdMobBanner');
assert(coupang > 0 && admob > coupang, 'Home: AdMob after Coupang');

const layout = read('app/_layout.tsx');
assert(layout.includes('initAdMob'), 'root init');
assert(layout.includes('initAnalytics'), 'analytics init kept');

const init = read('services/ads/initAdMob.ts');
assert(init.includes('initStarted'), 'one-shot guard');
assert(init.includes("Platform.OS !== 'android'"), 'Android-only init');

const privacy = read('legal/privacy.html');
assert(privacy.includes('Google AdMob'), 'privacy AdMob');
assert(privacy.includes('Google Mobile Ads SDK'), 'privacy Mobile Ads');
assert(!privacy.includes('별도의 배너·전면 광고 SDK는 현재 앱에 포함되어 있지 않습니다'), 'obsolete no-AdMob removed');

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — AdMob banner phase 1');
