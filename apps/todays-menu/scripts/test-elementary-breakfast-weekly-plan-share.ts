/**
 * Sprint v1.1 #6 — elementary breakfast weekly plan share/save QA.
 * Run: npm run test:weekly-plan-share
 *
 * Does not import the native capture/save/share module (view-shot / media-library).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WEEKLY_PLAN_SHARE_CARD_HEIGHT,
  WEEKLY_PLAN_SHARE_CARD_WIDTH,
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../constants/elementaryBreakfastShareCard';
import {
  ELEMENTARY_BREAKFAST_WEEKDAY_KO,
  elementaryBreakfastWeeklyPlanCopy,
} from '../constants/elementaryBreakfastWeeklyPlanCopy';
import { generateElementaryBreakfastWeek } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { WEEKLY_PLAN_DAYS } from '../data/recipes/recipeFamilyAudienceTypes';
import { buildElementaryBreakfastShareCardModel } from '../services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay';

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

console.log('Sprint v1.1 elementary breakfast weekly plan share QA — start\n');

run('share card is 4:5 and scales to 1080×1350', () => {
  assert(WEEKLY_PLAN_SHARE_CARD_WIDTH / WEEKLY_PLAN_SHARE_CARD_HEIGHT === 360 / 450, '4:5 logical');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_WIDTH === 1080, 'output width 1080');
  assert(WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT === 1350, 'output height 1350');
});

run('share model matches current generated plan', () => {
  const first = generateElementaryBreakfastWeek(42);
  const second = generateElementaryBreakfastWeek('share-qa');
  assert(first.ok && second.ok, 'both seeds generate');
  if (!first.ok || !second.ok) return;

  const model = buildElementaryBreakfastShareCardModel(first.plan);
  assert(model.rows.length === 7, '7 days');
  assert(
    model.rows.map((row) => row.day).join(',') === WEEKLY_PLAN_DAYS.join(','),
    'MON–SUN order',
  );
  assert(
    model.rows.map((row) => row.dayLabel).join('') ===
      WEEKLY_PLAN_DAYS.map((day) => ELEMENTARY_BREAKFAST_WEEKDAY_KO[day]).join(''),
    'Korean weekdays',
  );
  assert(
    model.rows.map((row) => row.recipeId).join(',') ===
      first.plan.slots.map((slot) => slot.recipeId).join(','),
    'same recipe ids as current plan',
  );
  assert(
    model.rows.every((row, index) => row.name === first.plan.slots[index]?.recipeName),
    'menu names match plan',
  );

  const refreshed = buildElementaryBreakfastShareCardModel(second.plan);
  assert(refreshed.seed === second.seed, 'refresh seed follows new plan');
  assert(
    refreshed.rows.map((row) => row.recipeId).join(',') ===
      second.plan.slots.map((slot) => slot.recipeId).join(','),
    'refresh share card follows new plan',
  );
});

run('share card layout excludes chrome / ads / debug', () => {
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(card.includes('card-news'), 'share-only card');
  assert(!card.includes('SeedMascot'), 'no Seed mascot on elementary share card');
  assert(card.includes('shareCardBrandName'), '한끼 wordmark copy');
  assert(!card.includes('AdMob'), 'no ads');
  assert(!card.includes('ScreenBackButton'), 'no nav');
  assert(!card.includes('captureScreen'), 'no full screenshot API in card');
  assert(!card.includes('schoolMorningFriendly'), 'no tech flags');
  assert(!card.includes('Pressable'), 'no buttons on share card');
});

run('screen captures share card, not the visible screen', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  const share = read('services/weeklyPlan/elementaryBreakfastWeeklyPlanShare.ts');
  assert(screen.includes('ElementaryWeeklyShareCard'), 'renders share card');
  assert(screen.includes('captureElementaryBreakfastShareCard'), 'capture wired');
  assert(screen.includes('saveElementaryBreakfastShareImage'), 'save wired');
  assert(screen.includes('shareElementaryBreakfastShareImage'), 'share wired');
  assert(screen.includes('saveImageButton'), 'save button');
  assert(screen.includes('shareButton'), 'share button');
  assert(screen.includes('opacity: 1'), 'capture host is fully opaque for PNG quality');
  assert(!screen.includes('opacity: 0.011'), 'does not use near-zero opacity capture');
  assert(share.includes("from 'react-native-view-shot'"), 'uses view-shot');
  assert(share.includes('captureRef'), 'captures a view ref');
  assert(!share.includes('captureScreen'), 'does not capture full screen');
  assert(share.includes('expo-sharing'), 'OS share sheet');
  assert(share.includes('expo-media-library'), 'media library save');
  assert(share.includes('requestPermissionsAsync(true'), 'write-only permission');
  assert(share.includes('Share.dismissedAction'), 'iOS cancel is not an error');
  assert(share.includes('isWeeklyPlanShareCancelError'), 'cancel helper');
  assert(share.includes("lower.includes('user did not share')"), 'treats share cancel as cancel');
});

run('share text has no guessed store URL', () => {
  const text = elementaryBreakfastWeeklyPlanCopy.shareText;
  assert(text.includes('한끼에서 골라봤어요'), 'share copy');
  assert(!text.includes('http'), 'no URL');
  assert(!text.includes('play.google'), 'no Play URL');
  assert(!text.includes('apps.apple'), 'no App Store URL');
  const share = read('services/weeklyPlan/elementaryBreakfastWeeklyPlanShare.ts');
  assert(!share.includes('play.google.com'), 'service has no Play URL');
  assert(!share.includes('apps.apple.com'), 'service has no App Store URL');
  assert(share.includes('copy.shareText'), 'uses short share text');
});

run('analytics save/share events', () => {
  const screen = read('components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx');
  assert(screen.includes('trackElementaryWeeklyPlanImageSave'), 'save event');
  assert(screen.includes('trackElementaryWeeklyPlanShare'), 'share event');
  assert(screen.includes('seed: plan.seed'), 'seed only');
});

run('home recommendation not touched', () => {
  const share = read('services/weeklyPlan/elementaryBreakfastWeeklyPlanShare.ts');
  const card = read('components/elementaryWeekly/ElementaryWeeklyShareCard.tsx');
  assert(!share.includes('getMealTimeSlotHomeRecommendation'), 'share not wired to home rec');
  assert(!card.includes('recommendationEngine'), 'card has no home engine');
});

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}

console.log('\nPASS — elementary breakfast weekly plan share');
