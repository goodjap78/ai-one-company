/**
 * Sprint 59 — Meal-time recommendation engine wiring QA.
 * Run: npm run test:meal-time-recommendation-engine
 *
 * Uses metadata + policy modules only (no Metro image require chain in Node).
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listRecipeMealTimeMetadata } from '../data/recommendation/recipeMealTimeMetadata';
import { pickDiverseMealTimeSet } from '../services/recommendation/mealTime/mealTimeSetPicker';
import {
  resolveClockPrimarySlot,
  mealTimeSlotToMealType,
} from '../services/recommendation/mealTime/mealTimeSlotMapping';
import {
  blendFitWithClockWeights,
  resolveMealTimeWeights,
} from '../services/recommendation/mealTime/mealTimeTransitionPolicy';
import { setDateProviderForTests } from '../utils/dateProvider';
import type { MealTimeSlotKey } from '../types/mealTimeRecommendation';
import type { ScoredMenuItem } from '../types/mealIntelligenceEngine';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function atLocal(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function metadataTopForSlot(slot: MealTimeSlotKey, limit = 30): string[] {
  return listRecipeMealTimeMetadata()
    .sort((a, b) => b.fit[slot] - a.fit[slot])
    .slice(0, limit)
    .map((entry) => entry.recipeId);
}

function avgSlotFit(slot: MealTimeSlotKey, ids: string[]): number {
  const meta = listRecipeMealTimeMetadata();
  const map = new Map(meta.map((m) => [m.recipeId, m.fit[slot]]));
  let sum = 0;
  for (const id of ids) sum += map.get(id) ?? 0;
  return ids.length ? sum / ids.length : 0;
}

console.log('Sprint 59 meal-time recommendation engine QA — start\n');

assert(resolveClockPrimarySlot(atLocal(2026, 8, 10, 5, 30)) === 'breakfast', '05:30 → breakfast slot');
assert(resolveClockPrimarySlot(atLocal(2026, 8, 10, 12, 30)) === 'lunch', '12:30 → lunch slot');
assert(resolveClockPrimarySlot(atLocal(2026, 8, 10, 19, 0)) === 'dinner', '19:00 → dinner slot');
assert(resolveClockPrimarySlot(atLocal(2026, 8, 10, 1, 0)) === 'lateNight', '01:00 → lateNight slot');

const transition1030 = resolveMealTimeWeights(atLocal(2026, 8, 10, 10, 30));
assert(
  transition1030.breakfast === 0.45 && transition1030.lunch === 0.52,
  '10:30 breakfast+lunch transition weights',
);
const transition2230 = resolveMealTimeWeights(atLocal(2026, 8, 10, 22, 30));
assert(
  transition2230.dinner === 0.55 && transition2230.lateNight === 0.4,
  '22:30 dinner+lateNight transition weights',
);

const breakfastTop = metadataTopForSlot('breakfast', 4);
assert(breakfastTop.length === 4, 'breakfast metadata top 4');
assert(
  avgSlotFit('breakfast', breakfastTop) >= 0.7,
  `breakfast top avg fit ≥0.7 (${avgSlotFit('breakfast', breakfastTop).toFixed(2)})`,
);

const lunchTop = metadataTopForSlot('lunch', 4);
assert(avgSlotFit('lunch', lunchTop) >= 0.7, `lunch top avg fit ≥0.7`);

const dinnerTop = metadataTopForSlot('dinner', 4);
assert(avgSlotFit('dinner', dinnerTop) >= 0.7, `dinner top avg fit ≥0.7`);

const lateTop = metadataTopForSlot('lateNight', 4);
assert(avgSlotFit('lateNight', lateTop) >= 0.55, `lateNight top avg fit ≥0.55`);

const dinnerIds = metadataTopForSlot('dinner', 40);
const menus = HANKKI_RECIPES.map((recipe) => ({
  id: recipe.id,
  mode: 'homemade' as const,
  type: 'main' as const,
  title: recipe.name,
  subtitle: '',
  mealTime: [],
  cookTime: 0,
  difficulty: 'easy' as const,
  aiReason: '',
  tags: [],
  badges: [],
}));
const scored: ScoredMenuItem[] = listRecipeMealTimeMetadata()
  .sort((a, b) => b.fit.dinner - a.fit.dinner)
  .slice(0, 100)
  .map((entry, index) => ({
    menuId: entry.recipeId,
    score: 100 - index,
    breakdown: {
      baseScore: 0,
      total: 100 - index,
      factors: {},
      notes: [],
      excluded: false,
      exclusionReasons: [],
    },
  }));

const diverse = pickDiverseMealTimeSet(scored, menus, { limit: 4 });
const foodTypeCounts = new Map<string, number>();
for (const entry of diverse) {
  const meta = listRecipeMealTimeMetadata().find((m) => m.recipeId === entry.menuId);
  for (const ft of meta?.foodTypes ?? ['unknown']) {
    foodTypeCounts.set(ft, (foodTypeCounts.get(ft) ?? 0) + 1);
  }
}
const maxFoodType = Math.max(...foodTypeCounts.values(), 0);
assert(maxFoodType <= 2, `diversity max same foodType ≤2 (max=${maxFoodType})`);

const metaEntry = listRecipeMealTimeMetadata()[0];
const clockWeights = resolveMealTimeWeights(atLocal(2026, 8, 10, 10, 30));
const blended = blendFitWithClockWeights(metaEntry.fit, clockWeights);
assert(blended >= 0 && blended <= 1, 'blended fit in range');

assert(mealTimeSlotToMealType('lateNight') === 'late_night', 'lateNight → late_night meal type');

const useHome = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'home', 'useHomeScreen.ts'),
  'utf8',
);
assert(useHome.includes('getMealTimeSlotHomeRecommendation'), 'useHomeScreen uses slot service');
assert(useHome.includes('checkDateAndSlotRefresh'), 'foreground date+slot refresh');

const homeScreen = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'home', 'HomeScreen.tsx'),
  'utf8',
);
assert(homeScreen.includes('MealTimeSlotTabs'), 'HomeScreen slot tabs');
assert(homeScreen.includes('AlternativeMealsRow'), 'HomeScreen alternative row');

const scoreLayer = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'recommendation', 'mealIntelligence', 'smartRecommendationScore.ts'),
  'utf8',
);
assert(scoreLayer.includes('mealTimeRanking'), 'smart score meal-time layer');

setDateProviderForTests(null);

console.log('\nSprint 59 meal-time recommendation engine QA — done');
if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} scenario(s) failed`);
}
