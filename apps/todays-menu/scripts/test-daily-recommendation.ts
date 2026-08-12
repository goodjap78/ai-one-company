/**
 * Sprint 57 — daily home recommendation persistence + date rollover.
 * Run: npm run test:daily-recommendation
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  DAILY_RECOMMENDATION_STORAGE_KEY,
  loadDailyRecommendationState,
  saveDailyRecommendationState,
  type DailyRecommendationState,
} from '../services/recommendation/dailyRecommendationStorage';
import { resolveDailyRecommendationSync } from '../services/recommendation/dailyRecommendationSync';
import {
  clearRecommendationSession,
  setRecommendationSession,
} from '../services/recommendationSession';
import {
  getLocalDateKey,
  setDateProviderForTests,
} from '../utils/dateProvider';
import type { HomeRecommendationDTO, MealMode, MealType } from '../types/home';

const memoryStore = new Map<string, string>();

async function mockAsyncStorage(): Promise<void> {
  const mod = await import('@react-native-async-storage/async-storage');
  const storage = mod.default;
  (storage as { setItem: typeof storage.setItem }).setItem = async (key: string, value: string) => {
    memoryStore.set(key, value);
  };
  (storage as { getItem: typeof storage.getItem }).getItem = async (key: string) =>
    memoryStore.get(key) ?? null;
  (storage as { removeItem: typeof storage.removeItem }).removeItem = async (key: string) => {
    memoryStore.delete(key);
  };
}

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

function makeRecommendation(recipeId: string, title = 'Test Menu'): HomeRecommendationDTO {
  return {
    recommendationId: `rec-${recipeId}`,
    mealMode: 'homemade',
    chefMessage: '테스트',
    badges: [],
    honeyTip: null,
    seedMessage: 'seed',
    recipe: {
      id: recipeId,
      title,
      subtitle: '',
      imageUrl: null,
      cookingTimeMinutes: 20,
      difficulty: 'easy',
    },
    alternatives: [],
  };
}

function localDateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function setVirtualDate(year: number, month: number, day: number, hour = 12): void {
  setDateProviderForTests(() => new Date(year, month - 1, day, hour, 0, 0, 0));
}

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
  }
}

console.log('Daily recommendation QA — start\n');

async function main(): Promise<void> {
  await mockAsyncStorage();

  const mealType: MealType = 'lunch';
  const mealMode: MealMode = 'homemade';

  await run('1 — 8/8 최초 실행 → 추천 생성', async () => {
  memoryStore.clear();
  clearRecommendationSession();
  setVirtualDate(2026, 8, 8);

  const dateKey = getLocalDateKey();
  const resolution = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted: null,
    session: null,
  });
  assert(resolution.action === 'generate', 'should generate on first run');

  const rec = makeRecommendation('homemade_001', '제육볶음');
  await saveDailyRecommendationState({
    dateKey,
    mealType,
    mealMode,
    recipeId: rec.recipe.id,
    recommendation: rec,
  });

  const loaded = await loadDailyRecommendationState();
  assert(loaded?.recipeId === 'homemade_001', 'persisted recipe id');
  assert(loaded?.dateKey === '2026-08-08', 'persisted date key');
});

await run('2 — 8/8 재실행 → 동일 추천', async () => {
  setVirtualDate(2026, 8, 8, 18);
  const dateKey = getLocalDateKey();
  const persisted = await loadDailyRecommendationState();

  const resolution = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted,
    session: null,
  });
  assert(resolution.action === 'restore', 'should restore same day');
  assert(resolution.recommendation.recipe.id === 'homemade_001', 'same recipe');
});

await run('3 — 8/8 session restore (background → foreground)', async () => {
  setVirtualDate(2026, 8, 8, 23);
  const dateKey = getLocalDateKey();
  const rec = makeRecommendation('homemade_001', '제육볶음');
  setRecommendationSession({
    dateKey,
    mealType,
    mealMode,
    recommendation: rec,
  });

  const resolution = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted: await loadDailyRecommendationState(),
    session: { dateKey, mealType, mealMode, recommendation: rec },
  });
  assert(resolution.action === 'restore', 'restore from persisted or session');
  assert(resolution.recommendation.recipe.id === 'homemade_001', 'stable across foreground');
});

await run('4 — 8/9 실행 → 새 추천', async () => {
  setVirtualDate(2026, 8, 9, 7);
  const dateKey = getLocalDateKey();
  const persisted = await loadDailyRecommendationState();

  const resolution = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted,
    session: null,
  });
  assert(resolution.action === 'generate', 'new day should generate');
  assert(resolution.excludeRecipeId === 'homemade_001', 'exclude prior day primary');
});

await run('5 — 8/9 exclude yesterday primary recipe', async () => {
  assert(
    resolveDailyRecommendationSync({
      dateKey: '2026-08-09',
      mealType,
      defaultMealMode: mealMode,
      persisted: {
        dateKey: '2026-08-08',
        mealType,
        mealMode,
        recipeId: 'homemade_003',
        recommendation: makeRecommendation('homemade_003', '김치찌개'),
      },
      session: null,
    }).excludeRecipeId === 'homemade_003',
    'excludeRecipeId from previous date',
  );
});

await run('6 — 같은 날 수동 refresh → 변경 후 유지', async () => {
  setVirtualDate(2026, 8, 9, 10);
  const dateKey = getLocalDateKey();
  const manual = makeRecommendation('homemade_002', '된장찌개');
  await saveDailyRecommendationState({
    dateKey,
    mealType,
    mealMode,
    recipeId: manual.recipe.id,
    recommendation: manual,
  });

  const restored = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted: await loadDailyRecommendationState(),
    session: null,
  });
  assert(restored.action === 'restore', 'restore manual pick');
  assert(restored.recommendation.recipe.id === 'homemade_002', 'manual refresh persisted');
});

await run('7 — invalid recipeId → generate', async () => {
  setVirtualDate(2026, 8, 10);
  const dateKey = getLocalDateKey();
  const bad: DailyRecommendationState = {
    dateKey,
    mealType,
    mealMode,
    recipeId: 'nonexistent_recipe_xyz',
    recommendation: makeRecommendation('nonexistent_recipe_xyz'),
  };
  await saveDailyRecommendationState(bad);

  const resolution = resolveDailyRecommendationSync({
    dateKey,
    mealType,
    defaultMealMode: mealMode,
    persisted: await loadDailyRecommendationState(),
    session: null,
  });
  assert(resolution.action === 'generate', 'invalid catalog id triggers generate');
});

await run('8 — favorites key untouched by daily recommendation', async () => {
  const favoritesKey = '@hankki/favorites';
  memoryStore.set(favoritesKey, JSON.stringify(['homemade_001']));
  setVirtualDate(2026, 8, 11);
  await saveDailyRecommendationState({
    dateKey: getLocalDateKey(),
    mealType,
    mealMode,
    recipeId: 'homemade_004',
    recommendation: makeRecommendation('homemade_004'),
  });
  assert(memoryStore.get(favoritesKey) !== undefined, 'favorites still present');
});

await run('9 — local date key (not UTC midnight edge)', () => {
  // 2026-08-08 23:30 KST-style local = still 2026-08-08
  setDateProviderForTests(() => new Date(2026, 7, 8, 23, 30, 0, 0));
  assert(getLocalDateKey() === '2026-08-08', 'local evening same calendar day');

  // UTC would be 2026-08-08 14:30 — still same. Edge: local date parts used.
  const utcSame = new Date(Date.UTC(2026, 7, 9, 0, 30, 0, 0));
  setDateProviderForTests(() => utcSame);
  const localKey = getLocalDateKey(utcSame);
  const utcKey = utcSame.toISOString().slice(0, 10);
  assert(localKey !== utcKey || localKey === localDateKeyFromParts(
    utcSame.getFullYear(),
    utcSame.getMonth() + 1,
    utcSame.getDate(),
  ), 'getLocalDateKey uses local parts');
});

await run('useHomeScreen — date check on focus + AppState', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'home', 'useHomeScreen.ts'),
    'utf8',
  );
  assert(source.includes('useFocusEffect'), 'focus effect');
  assert(source.includes('AppState'), 'app state listener');
  assert(source.includes('checkDateAndSlotRefresh'), 'date+slot rollover handler');
  assert(source.includes('silent: true'), 'silent refresh on date change');
});

await run('homeService — persist on get + refresh', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'services', 'homeService.ts'),
    'utf8',
  );
  assert(source.includes('persistDailyRecommendation'), 'persist helper');
  assert(source.includes('dailyExcludeRecipeId'), 'exclude prior day');
});

  setDateProviderForTests(null);
  clearRecommendationSession();
  memoryStore.clear();

  console.log('\nDaily recommendation QA — done');
  if (failed > 0) {
    process.exitCode = 1;
    console.error(`${failed} scenario(s) failed`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
