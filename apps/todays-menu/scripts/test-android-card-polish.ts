/**
 * Android card polish — layout math for 360 / 390 / 430.
 * Run: npx tsx scripts/test-android-card-polish.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  alternativeRowFits,
  fridgeCardFitsContent,
  resolveAlternativeColumnWidth,
  resolveHomeContentWidth,
} from '../utils/androidCardLayout';
import {
  resolveFridgeCompactCardMetrics,
  resolveFridgeCompactCardWidth,
} from '../constants/fridgeCompactLayout';

const APP_ROOT = path.resolve(__dirname, '..');
const WIDTHS = [360, 390, 430] as const;
let failed = 0;

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
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

console.log('Android card polish QA — start\n');

for (const w of WIDTHS) {
  run(`Home alternatives fit @ ${w}px`, () => {
    assert.ok(alternativeRowFits(w), `row fits ${w}`);
    const col = resolveAlternativeColumnWidth(w);
    assert.ok(col >= 90, `column wide enough (${col})`);
    console.log(`   content=${resolveHomeContentWidth(w)} col=${col}`);
  });

  run(`Fridge compact cards fit @ ${w}px`, () => {
    assert.ok(fridgeCardFitsContent(w), `fridge cards fit ${w}`);
    const card = resolveFridgeCompactCardWidth(w);
    assert.ok(card >= 144 && card <= 176, `card width in range (${card})`);
    console.log(`   cardWidth=${card}`);
  });
}

run('AlternativeMealsRow — focal image + no 33% clip', () => {
  const src = read('components/home/AlternativeMealsRow.tsx');
  assert.ok(src.includes('flexBasis: 0'));
  assert.ok(!src.includes("maxWidth: '33.33%'"));
  assert.ok(src.includes('FocalMealImage'));
  assert.ok(!/row:\s*\{[^}]*overflow:\s*'hidden'/s.test(src));
});

run('MealImageView — direct cover (no mediaFrame regression)', () => {
  const src = read('components/meal/MealImageView.tsx');
  assert.ok(src.includes('resizeMode="cover"'));
  assert.ok(!src.includes('mediaFrame'));
  assert.ok(!src.includes('resizeMode="stretch"'));
});

run('FocalMealImage — focal layout for food centering', () => {
  const src = read('components/meal/FocalMealImage.tsx');
  assert.ok(src.includes('computeHomeHeroImageLayout'));
  assert.ok(src.includes('resolveHomeHeroFocalPoint'));
});

run('FridgeRaidCompactCard — content height, no minHeight clip', () => {
  const src = read('components/fridge/FridgeRaidCompactCard.tsx');
  assert.ok(!src.includes('minHeight: metrics.minHeight'));
  assert.ok(!src.includes('flexGrow: 1'));
  assert.ok(src.includes('imageWrap'));
  assert.ok(src.includes('resizeMode="cover"'));
  assert.ok(src.includes('shoppingCta'));
});

run('Fridge feed — alignItems flex-start', () => {
  const src = read('components/fridge/FridgeRaidCompactFeed.tsx');
  assert.ok(src.includes("alignItems: 'flex-start'"));
});

run('More menus CTA — secondary cream style + arrow', () => {
  const src = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert.ok(src.includes('secondaryButton'));
  assert.ok(src.includes('showMoreMenus} →') || src.includes("showMoreMenus} →"));
  assert.ok(!/moreButton:\s*\{[^}]*backgroundColor:\s*ds\.colors\.borderLight/s.test(src));
});

run('Rotate CTA — anotherMenuRecommendation copy present', () => {
  const copy = read('constants/fridgeRaidCopy.ts');
  const screen = read('components/fridge/FridgeRaidResultsScreen.tsx');
  assert.ok(copy.includes('anotherMenuRecommendation: \'다른 메뉴 추천\''));
  assert.ok(screen.includes('anotherMenuRecommendation} →'));
});

run('HomeComingSoon — Android shadow bleed padding', () => {
  const src = read('components/home/HomeComingSoonSection.tsx');
  assert.ok(src.includes('clipToPadding={false}'));
  assert.ok(src.includes('paddingBottom: 10'));
});

run('Metrics still expose soft minHeight hint (not applied as clip)', () => {
  const m = resolveFridgeCompactCardMetrics('mobile-scroll');
  assert.ok(m.minHeight >= 260);
  assert.ok(m.imageHeight >= 100);
});

if (failed > 0) {
  console.error(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log('\nPASS — android card polish');
