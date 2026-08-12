/**
 * Sprint 59 — date+slot recommendation cache QA.
 * Run: npm run test:daily-slot-cache
 */
import {
  buildMealTimeCacheKey,
  MEAL_TIME_CACHE_NAMESPACE,
  nextRefreshGeneration,
} from '../services/recommendation/mealTime/mealTimeCachePolicy';
import {
  buildRecipeIdsFromRecommendation,
  clearMealTimeSlotCache,
  loadMealTimeSlotCacheEntry,
  saveMealTimeSlotCacheEntry,
  isValidMealTimeSlotCacheEntry,
} from '../services/recommendation/mealTime/mealTimeSlotCacheStorage';
import { getLocalDateKey, setDateProviderForTests } from '../utils/dateProvider';
import type { HomeRecommendationDTO } from '../types/home';

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

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function makeRecommendation(primaryId: string, altIds: string[] = []): HomeRecommendationDTO {
  return {
    recommendationId: 'rec_test',
    mealMode: 'homemade',
    chefMessage: '테스트',
    reason: '테스트',
    badges: [],
    recipe: {
      id: primaryId,
      title: primaryId,
      subtitle: '',
      imageUrl: null,
      cookingTimeMinutes: 20,
      difficulty: 'easy',
    },
    alternatives: altIds.map((id, index) => ({
      rank: (index + 2) as 2 | 3,
      recipe: {
        id,
        title: id,
        subtitle: '',
        cookingTimeMinutes: 20,
        difficulty: 'easy' as const,
      },
      confidence: 0.8,
      reason: 'alt',
    })),
  };
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

console.log('Daily slot cache QA — start\n');

async function main(): Promise<void> {
  await mockAsyncStorage();
  memoryStore.clear();
  await clearMealTimeSlotCache();

  await run('cache key format', () => {
    assert(
      buildMealTimeCacheKey('2026-08-10', 'breakfast') === '2026-08-10:breakfast',
      'date:slot key',
    );
    assert(nextRefreshGeneration(0) === 1, 'refresh generation increment');
  });

  await run('same day same slot → stable cache', async () => {
    setVirtualDate(2026, 8, 10, 7);
    const dateKey = getLocalDateKey();
    const rec = makeRecommendation('001', ['002', '003', '004']);
    await saveMealTimeSlotCacheEntry({
      dateKey,
      slot: 'breakfast',
      recipeIds: buildRecipeIdsFromRecommendation(rec),
      refreshGeneration: 0,
      createdAt: new Date().toISOString(),
      recommendation: rec,
    });

    const loaded = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    assert(loaded?.recommendation.recipe.id === '001', 'cached primary');
    assert(isValidMealTimeSlotCacheEntry(loaded), 'valid entry');

    const reloaded = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    assert(reloaded?.recipeIds.join(',') === '001,002,003,004', 'ids stable');
  });

  await run('same day slot change → separate cache keys', async () => {
    setVirtualDate(2026, 8, 10, 12);
    const dateKey = getLocalDateKey();
    const lunchRec = makeRecommendation('010', ['011', '012', '013']);
    await saveMealTimeSlotCacheEntry({
      dateKey,
      slot: 'lunch',
      recipeIds: buildRecipeIdsFromRecommendation(lunchRec),
      refreshGeneration: 0,
      createdAt: new Date().toISOString(),
      recommendation: lunchRec,
    });

    const breakfast = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    const lunch = await loadMealTimeSlotCacheEntry(dateKey, 'lunch');
    assert(breakfast?.recommendation.recipe.id === '001', 'breakfast untouched');
    assert(lunch?.recommendation.recipe.id === '010', 'lunch separate entry');
  });

  await run('next day same slot → new date key', async () => {
    setVirtualDate(2026, 8, 11, 7);
    const dateKey = getLocalDateKey();
    const nextRec = makeRecommendation('020', ['021', '022', '023']);
    await saveMealTimeSlotCacheEntry({
      dateKey,
      slot: 'breakfast',
      recipeIds: buildRecipeIdsFromRecommendation(nextRec),
      refreshGeneration: 0,
      createdAt: new Date().toISOString(),
      recommendation: nextRec,
    });

    const prev = await loadMealTimeSlotCacheEntry('2026-08-10', 'breakfast');
    const today = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    assert(prev?.recommendation.recipe.id === '001', 'previous day preserved');
    assert(today?.recommendation.recipe.id === '020', 'new day new entry');
  });

  await run('manual refresh generation persisted', async () => {
    setVirtualDate(2026, 8, 11, 8);
    const dateKey = getLocalDateKey();
    const refreshed = makeRecommendation('025', ['026', '027', '028']);
    await saveMealTimeSlotCacheEntry({
      dateKey,
      slot: 'breakfast',
      recipeIds: buildRecipeIdsFromRecommendation(refreshed),
      refreshGeneration: nextRefreshGeneration(0),
      createdAt: new Date().toISOString(),
      recommendation: refreshed,
    });

    const loaded = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    assert(loaded?.refreshGeneration === 1, 'generation bumped');
    assert(loaded?.recommendation.recipe.id === '025', 'refreshed set stored');

    setVirtualDate(2026, 8, 11, 9);
    const restored = await loadMealTimeSlotCacheEntry(dateKey, 'breakfast');
    assert(restored?.recommendation.recipe.id === '025', 'refresh set survives re-run');
  });

  await run('invalid cached recipeId → rejected on load', async () => {
    setVirtualDate(2026, 8, 12, 10);
    const dateKey = getLocalDateKey();
    const bad = makeRecommendation('nonexistent_recipe_xyz');
    await saveMealTimeSlotCacheEntry({
      dateKey,
      slot: 'lunch',
      recipeIds: ['nonexistent_recipe_xyz'],
      refreshGeneration: 0,
      createdAt: new Date().toISOString(),
      recommendation: bad,
    });

    const loaded = await loadMealTimeSlotCacheEntry(dateKey, 'lunch');
    assert(loaded === null, 'invalid entry purged on load');
  });

  await run('namespace isolated', () => {
    assert(MEAL_TIME_CACHE_NAMESPACE === '@hankki/meal_time_recommendation', 'cache namespace');
  });

  setDateProviderForTests(null);
  memoryStore.clear();

  console.log('\nDaily slot cache QA — done');
  if (failed > 0) {
    process.exitCode = 1;
    console.error(`${failed} scenario(s) failed`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
