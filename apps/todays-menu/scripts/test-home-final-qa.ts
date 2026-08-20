/**
 * Sprint 61-E — Home production structure lock (static QA).
 * Run: npm run test:home-final-qa
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const HOME = path.join(ROOT, 'components', 'home');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${msg}`);
    process.exitCode = 1;
  }
}

console.log('Sprint 61-E Home final QA — start\n');

run('HomeScreen — final section order', () => {
  const src = read('components/home/HomeScreen.tsx');
  const heroIdx = src.indexOf('<HomeHeroTitles');
  const primaryIdx = src.indexOf('<HomeFeatureCards');
  const tabsIdx = src.indexOf('<MealTimeSlotTabs');
  const heroCardIdx = src.indexOf('<TodayMealCard');
  const altIdx = src.indexOf('<AlternativeMealsRow');
  const secondaryIdx = src.indexOf('<HomeComingSoonSection');
  const personalIdx = src.indexOf('<HomePersonalSection');
  assert(heroIdx > 0, 'header present');
  assert(heroIdx < primaryIdx, 'header before primary');
  assert(primaryIdx < tabsIdx, 'primary before meal tabs');
  assert(tabsIdx < heroCardIdx, 'meal tabs before hero card');
  assert(heroCardIdx < altIdx, 'hero before alternatives');
  assert(altIdx < secondaryIdx, 'alternatives before 한끼 더하기');
  assert(secondaryIdx < personalIdx, '한끼 더하기 before personal');
  const bannerIdx = src.indexOf('<CoupangDynamicBanner');
  assert(bannerIdx > personalIdx, 'dynamic banner after 나의 한끼');
  const admobIdx = src.indexOf('<AdMobBanner');
  assert(admobIdx > bannerIdx, 'AdMob banner after Coupang');
});

run('TodayMealCard — badge/title inside hero image', () => {
  const src = read('components/home/TodayMealCard.tsx');
  assert(src.includes('heroTopOverlay'), 'hero top overlay');
  assert(src.includes('heroBadge'), 'badge inside hero');
  assert(src.includes('heroTitle'), 'title inside hero');
  assert(!src.includes('recommendationHeader'), 'no external recommendation header');
  assert(!src.includes('shortDescription'), 'no duplicate description block');
  assert(!src.includes('menuDescription'), 'no external menu description');
  assert(src.includes('HomeRecommendTip') && src.includes('compact'), 'mascot speech in hero');
});

run('TodayMealCard — CTA copy', () => {
  const messages = read('constants/HankkiMessages.ts');
  assert(messages.includes('다른 메뉴 볼래요'), 'refresh CTA');
  assert(messages.includes('이 메뉴로 할게요 →'), 'accept CTA');
});

run('HomeFeatureCards — mini buttons no subtitle', () => {
  const src = read('components/home/HomeFeatureCards.tsx');
  assert(src.includes('flexDirection: \'row\''), 'horizontal buttons');
  assert(!src.includes('subtitle'), 'no subtitle UI');
  assert(src.includes('adjustsFontSizeToFit'), 'convenience single line guard');
});

run('MealTimeSlotTabs — full width segmented', () => {
  const src = read('components/home/MealTimeSlotTabs.tsx');
  assert(src.includes('flex: 1'), 'equal width tabs');
  assert(src.includes('flexDirection: \'row\''), 'single row');
});

run('AlternativeMealsRow — 3-column wide image', () => {
  const src = read('components/home/AlternativeMealsRow.tsx');
  assert(src.includes('flexDirection: \'row\''), 'row layout');
  assert(src.includes('aspectRatio'), 'wide image not circle thumb only');
  assert(src.includes('flexBasis: 0'), 'equal flex columns');
  assert(!src.includes("maxWidth: '33.33%'"), 'no percent maxWidth clip');
  assert(!src.includes('THUMB_SIZE = 32') || src.includes('aspectRatio'), 'image uses card width');
  assert(src.includes('.slice(0, 3)'), 'max 3 items');
});

run('HomeComingSoonSection — horizontal scroll shortcuts', () => {
  const src = read('components/home/HomeComingSoonSection.tsx');
  assert(src.includes('ScrollView'), 'horizontal scroll');
  assert(src.includes('FULL_VISIBLE_CARDS') || src.includes('PEEK_PX'), 'peek scroll sizing');
  assert(!src.includes('cardSubtitle'), 'no subtitle UI');
});

run('HomePersonalSection — routes', () => {
  const src = read('components/home/HomePersonalSection.tsx');
  assert(src.includes('/favorites'), 'favorites route');
  assert(src.includes('/recently-viewed'), 'recently viewed route');
  assert(!src.includes('/meal-history'), 'meal history proxy removed');
});

run('Home routes — primary features', () => {
  const src = read('components/home/HomeScreen.tsx');
  assert(src.includes('/convenience-combos'), 'convenience route');
  assert(src.includes('/fridge-raid'), 'fridge route');
});

run('useHomeScreen — accept flow ingredients route', () => {
  const src = read('components/home/useHomeScreen.ts');
  assert(src.includes('/ingredients/'), 'accept → ingredients');
  assert(src.includes('handleSelectAlternative'), 'alternative selection');
  assert(src.includes('getMealTimeSlotHomeRecommendation'), 'slot service wired');
});

console.log('\nSprint 61-E Home final QA — done');
