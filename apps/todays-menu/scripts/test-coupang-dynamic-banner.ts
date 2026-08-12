/**
 * Coupang Partners Dynamic Banner — placement & contract QA (no secrets / no full tracking logs).
 * Run: npx tsx scripts/test-coupang-dynamic-banner.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COUPANG_DYNAMIC_BANNER,
  COUPANG_DYNAMIC_BANNER_URL,
  COUPANG_DYNAMIC_BANNER_WIDGET_HOST,
} from '../constants/coupangDynamicBanner';

const APP_ROOT = path.resolve(__dirname, '..');
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
    console.log(`✅ ${name}\n`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

console.log('Coupang Dynamic Banner QA — start\n');

run('Banner URL matches user-provisioned widget', () => {
  assert(COUPANG_DYNAMIC_BANNER.widgetId === '1016733', 'widget id');
  assert(COUPANG_DYNAMIC_BANNER.template === 'carousel', 'template carousel');
  assert(COUPANG_DYNAMIC_BANNER.trackingCode === 'AF7656335', 'tracking code');
  assert(COUPANG_DYNAMIC_BANNER.width === 328, 'width 328');
  assert(COUPANG_DYNAMIC_BANNER.height === 50, 'height 50');
  assert(
    COUPANG_DYNAMIC_BANNER_URL ===
      'https://ads-partners.coupang.com/widgets.html?id=1016733&template=carousel&trackingCode=AF7656335&subId=&width=328&height=50&tsource=',
    'exact iframe URL',
  );
  assert(COUPANG_DYNAMIC_BANNER_WIDGET_HOST === 'ads-partners.coupang.com', 'widget host');
});

run('Component uses WebView + quiet failure + external open', () => {
  const src = read('components/ads/CoupangDynamicBanner.tsx');
  assert(src.includes('from \'react-native-webview\''), 'react-native-webview');
  assert(src.includes('COUPANG_DYNAMIC_BANNER_URL'), 'loads banner URL');
  assert(src.includes('onShouldStartLoadWithRequest'), 'intercepts navigation');
  assert(src.includes('openOutboundUrl'), 'external open helper');
  assert(src.includes('scrollEnabled={false}'), 'no inner scroll');
  assert(src.includes('setFailed(true)'), 'load error → hide');
  assert(src.includes('if (failed)'), 'failed returns null');
  assert(!src.includes('console.log(url)'), 'no raw url log');
  assert(!src.includes('console.log(request'), 'no request url dump');
  assert(!/boxShadow|elevation:\s*[1-9]/.test(src), 'no heavy card chrome');
});

run('Home placement — after 나의 한끼 / Personal, scroll content', () => {
  const src = read('components/home/HomeScreen.tsx');
  assert(src.includes('CoupangDynamicBanner'), 'banner imported/used');
  const personalIdx = src.indexOf('<HomePersonalSection');
  const bannerIdx = src.indexOf('<CoupangDynamicBanner');
  assert(personalIdx >= 0 && bannerIdx > personalIdx, 'banner after HomePersonalSection');
  const heroIdx = src.indexOf('<HomeHeroTitles');
  const featureIdx = src.indexOf('<HomeFeatureCards');
  assert(bannerIdx > heroIdx && bannerIdx > featureIdx, 'not between hero/features');
  // Sticky/fixed ad host forbidden — banner sits in ScrollView content only
  assert(src.includes('<ScrollView'), 'banner parent is scroll content');
  const bannerSnippet = src.slice(Math.max(0, bannerIdx - 200), bannerIdx + 80);
  assert(bannerSnippet.includes('phoneFrame') || bannerSnippet.includes('HomePersonalSection'), 'banner in main scroll frame');
});

run('Ingredients placement — after shopping CTA + body end', () => {
  const src = read('components/ingredients/IngredientsScreen.tsx');
  assert(src.includes('CoupangDynamicBanner'), 'banner on ingredients');
  assert(src.includes('IngredientsShoppingCta'), 'shopping CTA kept');
  const ctaIdx = src.indexOf('<IngredientsShoppingCta');
  const stepsIdx = src.indexOf('<RecipeStepsList');
  const bannerIdx = src.indexOf('<CoupangDynamicBanner');
  assert(ctaIdx >= 0 && bannerIdx > ctaIdx, 'banner after shopping CTA');
  assert(stepsIdx >= 0 && bannerIdx > stepsIdx, 'banner after steps');
  assert(bannerIdx > src.indexOf('<RecipeFeedbackCard'), 'banner after feedback / near end');
});

run('Excluded screens — no Dynamic Banner', () => {
  const excluded = [
    'components/shopping/ShoppingScreen.tsx',
    'components/fridge/FridgeRaidResultsScreen.tsx',
    'components/fridge/FridgeRaidCompactFeed.tsx',
    'components/fridge/FridgeRaidCompactCard.tsx',
    'components/fridge/FridgeShoppingBridge.tsx',
  ];
  for (const rel of excluded) {
    const full = path.join(APP_ROOT, rel);
    if (!fs.existsSync(full)) {
      console.log(`⏭️ skip missing ${rel}`);
      continue;
    }
    assert(!read(rel).includes('CoupangDynamicBanner'), `no banner in ${rel}`);
  }
});

run('package.json has expo-compatible webview', () => {
  const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
  assert(Boolean(pkg.dependencies?.['react-native-webview']), 'react-native-webview dependency');
});

run('Prior Android QA CTA / outbound fixes preserved', () => {
  const cta = read('components/shopping/IngredientsShoppingCta.tsx');
  assert(cta.includes("color: '#FFFFFF'"), 'Ingredients orange CTA white text');
  assert(cta.includes('ds.colors.primary'), 'primary CTA color');

  const fridgeCard = read('components/fridge/FridgeRaidCompactCard.tsx');
  assert(
    fridgeCard.includes('부족한 재료') || fridgeCard.includes('missing'),
    'fridge missing CTA still present',
  );

  const shopping = read('components/shopping/ShoppingScreen.tsx');
  assert(shopping.includes('heroThumb') || shopping.includes('variant=\"thumb\"'), 'compact shopping hero');

  const outbound = read('services/shopping/openShoppingProduct.ts');
  assert(outbound.includes('isHttpOrHttpsUrl'), 'Android https outbound fix kept');
});

if (failed > 0) {
  console.error(`\nFAIL — ${failed} check(s)`);
  process.exit(1);
}
console.log('PASS — Coupang Dynamic Banner QA');
