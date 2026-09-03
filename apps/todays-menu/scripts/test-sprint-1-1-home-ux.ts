/**
 * HANKKI v1.1 Sprint 1.1 — Home UX cleanup (static QA).
 * Run: npx tsx scripts/test-sprint-1-1-home-ux.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME_PURPOSES } from '../constants/homeIaCopy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

let failed = 0;

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${msg}`);
  }
}

console.log('HANKKI Sprint 1.1 Home UX — start\n');

run('default purpose is today', () => {
  const src = read('components/home/HomeScreen.tsx');
  assert(src.includes("useState<HomePurposeId>('today')"), 'today default');
});

run('only one submenu row visible at a time', () => {
  const src = read('components/home/HomeScreen.tsx');
  assert(src.includes("activePurpose !== 'today'"), 'kids/weekly sub panel gated');
  assert(src.includes("activePurpose === 'today'"), 'today feature row gated');
  const subIdx = src.indexOf('<HomePurposeSubPanel');
  const featureIdx = src.indexOf('<HomeFeatureCards');
  assert(subIdx > 0 && featureIdx > 0, 'both blocks present in source');
  assert(
    src.includes("activePurpose !== 'today' ? (\n              <HomePurposeSubPanel") ||
      src.includes("activePurpose !== 'today' ? (\r\n              <HomePurposeSubPanel"),
    'sub panel wrapped in today guard',
  );
  assert(
    src.includes("activePurpose === 'today' ? (\n              <HomeFeatureCards") ||
      src.includes("activePurpose === 'today' ? (\r\n              <HomeFeatureCards"),
    'feature cards wrapped in today guard',
  );
});

run('today submenu — 집밥 / 편의점 / 냉장고', () => {
  const copy = read('constants/northStarHomeCopy.ts');
  assert(copy.includes("title: '집밥'"), 'homemade');
  assert(copy.includes("title: '편의점 꿀조합'"), 'convenience');
  assert(copy.includes("title: '냉장고 털기'"), 'fridge');
  const src = read('components/home/HomeFeatureCards.tsx');
  assert(src.includes('northStarHomeCopy.features'), 'feature cards use north star copy');
});

run('kids submenu — 이유식 / 유아식 / 초등학생', () => {
  const kids = HOME_PURPOSES.find((p) => p.id === 'kids');
  const titles = kids?.entries?.map((e) => e.title) ?? [];
  assert(titles.join('|') === '이유식|유아식|초등학생', `got ${titles.join('|')}`);
});

run('weekly submenu — toddler + elementary breakfast/dinner', () => {
  const weekly = HOME_PURPOSES.find((p) => p.id === 'weekly');
  const titles = weekly?.entries?.map((e) => e.title) ?? [];
  assert(titles.includes('유아 아침 7일'), 'toddler breakfast week');
  assert(titles.includes('유아 저녁 7일'), 'toddler dinner week');
  assert(titles.includes('초등 아침 7일'), 'breakfast week');
  assert(titles.includes('초등 저녁 7일'), 'dinner week');
});

run('weekly sub panel — 2-step audience then meal', () => {
  const src = read('components/home/HomePurposeSubPanel.tsx');
  assert(src.includes('HOME_WEEKLY_AUDIENCES'), 'audience step');
  assert(src.includes('HOME_WEEKLY_MEAL_LABELS'), 'meal step labels');
  assert(src.includes('toddlerBreakfast') || src.includes('elemBreakfast'), 'entry ids wired');
});

run('sub panel has no duplicate purpose title', () => {
  const src = read('components/home/HomePurposeSubPanel.tsx');
  assert(!src.includes('sectionTitle'), 'no section title style');
  assert(!src.includes('purpose.title'), 'no repeated purpose label');
});

run('recommendation block preserved', () => {
  const src = read('components/home/HomeScreen.tsx');
  assert(src.includes('<TodayMealCard'), 'today meal card');
  assert(src.includes('<AlternativeMealsRow'), 'alternatives');
  assert(src.includes('useHomeScreen'), 'home engine unchanged');
});

run('purpose cards compact — description only when active', () => {
  const src = read('components/home/HomePurposeCards.tsx');
  assert(src.includes('active && !narrow'), 'description gated on active card');
});

console.log(`\nHANKKI Sprint 1.1 Home UX — done (${failed === 0 ? 'PASS' : 'FAIL'})`);
process.exitCode = failed > 0 ? 1 : 0;
