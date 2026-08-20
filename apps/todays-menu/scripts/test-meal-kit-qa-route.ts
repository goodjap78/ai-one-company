/**
 * Preview/dev Meal Kit QA route — production must hide the entry.
 * Run: npx tsx scripts/test-meal-kit-qa-route.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { listMealKitQaRecipes, MEAL_KIT_QA_MENU_COUNT } from '../constants/mealKitQaFixtures';
import {
  MEAL_KIT_VALIDATED_COUNT,
  MEAL_KIT_VALIDATED_ELIGIBILITY,
} from '../data/shopping/mealKitValidatedEligibility';
import { isQaToolsEnvEnabled } from '../utils/isInternalQaEnabled';

const APP_ROOT = path.resolve(__dirname, '..');
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

console.log('Meal kit QA route — start\n');

run('QA list auto-syncs from production eligibility', () => {
  const qa = listMealKitQaRecipes();
  assert.equal(MEAL_KIT_QA_MENU_COUNT, MEAL_KIT_VALIDATED_COUNT);
  assert.equal(qa.length, MEAL_KIT_VALIDATED_COUNT);
  assert.equal(qa.length, 27);
  const qaIds = qa.map((item) => item.recipeId);
  const sourceIds = MEAL_KIT_VALIDATED_ELIGIBILITY.map((item) => item.recipeId);
  assert.deepEqual([...qaIds].sort(), [...sourceIds].sort());
  assert.ok(qaIds.includes('001'));
  assert.ok(qaIds.includes('024'));
  assert.ok(qaIds.includes('recipe_0301'));
  assert.ok(qaIds.includes('recipe_0304'));
  assert.equal(qa.filter((item) => item.section === 'expansion').length, 4);
});

run('QA fixtures do not hard-code a duplicate recipe array', () => {
  const fixtures = read('constants/mealKitQaFixtures.ts');
  assert.ok(fixtures.includes('MEAL_KIT_VALIDATED_ELIGIBILITY'));
  assert.ok(!fixtures.includes("recipeName: '제육볶음'"));
  assert.ok(!fixtures.includes("name: '밀푀유나베'"));
});

run('Env gate — production default hidden', () => {
  assert.equal(isQaToolsEnvEnabled(undefined), false);
  assert.equal(isQaToolsEnvEnabled(''), false);
  assert.equal(isQaToolsEnvEnabled('0'), false);
  assert.equal(isQaToolsEnvEnabled('1'), true);
  assert.equal(isQaToolsEnvEnabled('true'), true);
});

run('EAS preview enables QA tools; production profile does not', () => {
  const eas = read('eas.json');
  const parsed = JSON.parse(eas) as {
    build: {
      preview?: { env?: Record<string, string> };
      production?: { env?: Record<string, string> };
    };
  };
  assert.equal(parsed.build.preview?.env?.EXPO_PUBLIC_QA_TOOLS, '1');
  assert.notEqual(parsed.build.production?.env?.EXPO_PUBLIC_QA_TOOLS, '1');
});

run('QA screen uses eligibility list + existing routes only', () => {
  const screen = read('components/qa/MealKitQaScreen.tsx');
  assert.ok(screen.includes('isInternalQaEnabled'));
  assert.ok(screen.includes('listMealKitQaRecipes'));
  assert.ok(screen.includes('/ingredients/${recipeId}'));
  assert.ok(screen.includes('/shopping/${recipeId}?mode=meal-kit'));
  assert.ok(screen.includes("router.replace('/(tabs)')"));
  assert.ok(!screen.includes('recommend'));
});

run('My settings entry is gated and production-hidden', () => {
  const entry = read('components/qa/MealKitQaEntry.tsx');
  const settings = read('components/my/MyAppSettingsSection.tsx');
  assert.ok(entry.includes('isInternalQaEnabled'));
  assert.ok(entry.includes('isMealKitFeatureEnabled'));
  assert.ok(entry.includes('return null'));
  assert.ok(entry.includes('/qa/meal-kit'));
  assert.ok(settings.includes('MealKitQaEntry'));
});

run('QA screen also respects meal-kit feature flag', () => {
  const screen = read('components/qa/MealKitQaScreen.tsx');
  assert.ok(screen.includes('isMealKitFeatureEnabled'));
  assert.ok(screen.includes('isInternalQaEnabled'));
});

run('Route registered; no recipe/recommendation mutation', () => {
  const layout = read('app/_layout.tsx');
  assert.ok(layout.includes('qa/meal-kit'));
  assert.ok(fs.existsSync(path.join(APP_ROOT, 'app/qa/meal-kit.tsx')));
  const eligibility = read('data/shopping/mealKitHighEligibility.ts');
  assert.ok(!eligibility.includes('QA Meal Kit'));
  const validated = read('data/shopping/mealKitValidatedEligibility.ts');
  assert.ok(!validated.includes('MealKitQa'));
});

console.log(`\nMeal kit QA route — ${failed === 0 ? 'PASS' : `FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
