/**
 * HANKKI Sprint 5.1 — share card image crop fix QA.
 * Run: npx tsx scripts/test-elementary-weekly-sprint5-1-share.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SHARE_GRID_IMAGE_MIN_HEIGHT,
  SHARE_SUNDAY_CARD_HEIGHT,
} from '../constants/elementaryWeeklyShareCardLayout';
import {
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';

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

console.log('HANKKI Sprint 5.1 share card crop fix QA — start\n');

run('4:5 output unchanged', () => {
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, '1080 width');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, '1350 height');
});

run('image area ratio >= 50%', () => {
  assert(SHARE_GRID_IMAGE_MIN_HEIGHT >= 50, `min image height ${SHARE_GRID_IMAGE_MIN_HEIGHT}`);
  assert(SHARE_GRID_IMAGE_MIN_HEIGHT > 44, 'taller than sprint 5 strip');
});

run('sunday / featured accent in grid', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(
    card.includes('variant="featured"') || card.includes('variant="sunday"'),
    'featured or sunday variant',
  );
  assert(!card.includes('ElementaryWeeklyShareTipCell'), 'no tip food card');
});

run('seed removed from share card', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(!card.includes('SeedMascot'), 'no Seed on share card');
  assert(!card.includes('recipeId'), 'no recipeId in share card');
});

run('meal cell image heights', () => {
  const cell = read('components/elementaryWeekly/ElementaryWeeklyShareMealCell.tsx');
  assert(
    cell.includes('SHARE_GRID_IMAGE_FLEX') || cell.includes('SHARE_HERO_IMAGE_FLEX'),
    'grid/hero image sizing',
  );
  assert(
    cell.includes('variant === \'hero\'') || cell.includes('isHero'),
    'hero variant present',
  );
  assert(!cell.includes('height: 44'), 'no 44px strip');
  assert(cell.includes('dayBadgeOnImage'), 'badge overlays image');
  assert(!cell.includes('foodPoint'), 'no food point clutter');
});

run('qa preview route intact', () => {
  assert(fs.existsSync(path.join(ROOT, 'app/qa/elementary-weekly-share.tsx')), 'qa route');
  const qa = read('components/qa/ElementaryWeeklyShareQaScreen.tsx');
  assert(qa.includes('ElementaryWeeklyShareCardPreview'), 'preview wrapper');
});

console.log(`\nSprint 5.1 metrics:`);
console.log(`  GRID_IMAGE_MIN_HEIGHT=${SHARE_GRID_IMAGE_MIN_HEIGHT}`);
console.log(`  SUNDAY_CARD_HEIGHT=${SHARE_SUNDAY_CARD_HEIGHT}`);

console.log(`\nHANKKI Sprint 5.1 share card crop fix QA — ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed > 0 ? 1 : 0;
