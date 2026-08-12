import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FoodMemoryCategory,
  FoodMemoryCuisine,
  FoodMemoryEvent,
  FoodMemoryOutcome,
  FoodMemoryRecord,
  FoodMemoryStore,
  RecordFoodMemoryInput,
} from '../../../types/foodMemory';
import { MOCK_FOOD_MEMORY_EVENTS } from '../mockMemoryData';
import {
  applyPreferenceDelta,
  createPreferenceScore,
} from './preferenceScores';
import { resolveMealFoodMeta } from './resolveMealFoodMeta';

export const FOOD_MEMORY_STORAGE_KEY = '@hankki/food_memory';
export const FOOD_MEMORY_MAX_ACCEPTED = 20;
export const FOOD_MEMORY_MAX_EVENTS = 120;
const USE_MOCK_SEED = __DEV__;

const OUTCOMES: FoodMemoryOutcome[] = ['accepted', 'skipped'];
const CATEGORIES: FoodMemoryCategory[] = [
  'noodle', 'soup', 'stew', 'rice', 'meat', 'salad', 'delivery', 'other',
];
const CUISINES: FoodMemoryCuisine[] = [
  'korean', 'japanese', 'chinese', 'western', 'catalog',
];

function isFoodMemoryEvent(value: unknown): value is FoodMemoryEvent {
  if (!value || typeof value !== 'object') return false;
  const record = value as FoodMemoryEvent;
  return (
    typeof record.id === 'string' &&
    typeof record.mealId === 'string' &&
    typeof record.mealName === 'string' &&
    CATEGORIES.includes(record.category) &&
    CUISINES.includes(record.cuisine) &&
    OUTCOMES.includes(record.outcome) &&
    typeof record.timestamp === 'string'
  );
}

function isLegacyFoodMemoryRecord(value: unknown): value is FoodMemoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as FoodMemoryRecord;
  return (
    typeof record.mealId === 'string' &&
    typeof record.mealName === 'string' &&
    typeof record.category === 'string' &&
    typeof record.cuisine === 'string' &&
    typeof record.timestamp === 'string' &&
    !('outcome' in record)
  );
}

function migrateLegacyRecords(records: FoodMemoryRecord[]): FoodMemoryStore {
  const events: FoodMemoryEvent[] = records.map((record) => ({
    id: `fm_evt_${record.mealId}_${record.timestamp}`,
    ...record,
    outcome: 'accepted' as const,
  }));

  const preferenceScores: FoodMemoryStore['preferenceScores'] = {};
  for (const event of events) {
    const current = preferenceScores[event.mealId] ?? createPreferenceScore(event.mealId, event.mealName);
    preferenceScores[event.mealId] = applyPreferenceDelta(current, 'accepted', event.mealName);
  }

  return {
    version: 2,
    events,
    preferenceScores,
    extensions: {},
  };
}

function parseFoodMemoryStore(raw: string | null): FoodMemoryStore | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === 'object' && (parsed as FoodMemoryStore).version === 2) {
      const store = parsed as FoodMemoryStore;
      return {
        version: 2,
        events: Array.isArray(store.events) ? store.events.filter(isFoodMemoryEvent) : [],
        preferenceScores: store.preferenceScores ?? {},
        extensions: store.extensions ?? {},
      };
    }

    if (Array.isArray(parsed)) {
      const legacy = parsed.filter(isLegacyFoodMemoryRecord);
      if (legacy.length > 0) return migrateLegacyRecords(legacy);
    }
  } catch {
    return null;
  }

  return null;
}

function emptyStore(): FoodMemoryStore {
  return { version: 2, events: [], preferenceScores: {}, extensions: {} };
}

async function writeFoodMemoryStore(store: FoodMemoryStore): Promise<void> {
  await AsyncStorage.setItem(FOOD_MEMORY_STORAGE_KEY, JSON.stringify(store));
}

export async function readFoodMemoryStore(): Promise<FoodMemoryStore> {
  try {
    const raw = await AsyncStorage.getItem(FOOD_MEMORY_STORAGE_KEY);
    const store = parseFoodMemoryStore(raw);

    if (!store && USE_MOCK_SEED && !raw) {
      const seeded: FoodMemoryStore = {
        version: 2,
        events: MOCK_FOOD_MEMORY_EVENTS,
        preferenceScores: {},
        extensions: {},
      };
      for (const event of MOCK_FOOD_MEMORY_EVENTS) {
        const current =
          seeded.preferenceScores[event.mealId] ??
          createPreferenceScore(event.mealId, event.mealName);
        seeded.preferenceScores[event.mealId] = applyPreferenceDelta(
          current,
          event.outcome,
          event.mealName,
        );
      }
      await writeFoodMemoryStore(seeded);
      return seeded;
    }

    return store ?? emptyStore();
  } catch {
    return emptyStore();
  }
}

function sortEvents(events: FoodMemoryEvent[]): FoodMemoryEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function acceptedMealsFromEvents(events: FoodMemoryEvent[]): FoodMemoryRecord[] {
  const accepted = events.filter((event) => event.outcome === 'accepted');
  const deduped: FoodMemoryRecord[] = [];
  const seen = new Set<string>();

  for (const event of accepted) {
    const dayKey = `${event.mealId}:${event.timestamp.slice(0, 10)}`;
    if (seen.has(dayKey)) continue;
    seen.add(dayKey);
    deduped.push({
      mealId: event.mealId,
      mealName: event.mealName,
      category: event.category,
      cuisine: event.cuisine,
      timestamp: event.timestamp,
    });
    if (deduped.length >= FOOD_MEMORY_MAX_ACCEPTED) break;
  }

  return deduped;
}

/** Record accepted or skipped food-memory interaction. */
export async function saveFoodMemoryEvent(input: RecordFoodMemoryInput): Promise<FoodMemoryEvent> {
  const store = await readFoodMemoryStore();
  const meta = resolveMealFoodMeta(input.mealId);
  const now = new Date().toISOString();

  const latestSame = store.events.find(
    (event) =>
      event.mealId === input.mealId &&
      event.outcome === input.outcome &&
      event.timestamp.slice(0, 10) === now.slice(0, 10),
  );
  if (latestSame) return latestSame;

  const event: FoodMemoryEvent = {
    id: `fm_evt_${Date.now()}`,
    mealId: meta.mealId,
    mealName: meta.mealName,
    category: meta.category,
    cuisine: meta.cuisine,
    outcome: input.outcome,
    timestamp: now,
  };

  const currentScore =
    store.preferenceScores[event.mealId] ??
    createPreferenceScore(event.mealId, event.mealName);

  const nextStore: FoodMemoryStore = {
    ...store,
    events: sortEvents([event, ...store.events]).slice(0, FOOD_MEMORY_MAX_EVENTS),
    preferenceScores: {
      ...store.preferenceScores,
      [event.mealId]: applyPreferenceDelta(currentScore, input.outcome, event.mealName),
    },
  };

  await writeFoodMemoryStore(nextStore);
  return event;
}

/** @deprecated Use saveFoodMemoryEvent({ outcome: 'accepted' }). */
export async function saveFoodMemoryRecord(input: { mealId: string }): Promise<FoodMemoryRecord> {
  const event = await saveFoodMemoryEvent({ mealId: input.mealId, outcome: 'accepted' });
  return {
    mealId: event.mealId,
    mealName: event.mealName,
    category: event.category,
    cuisine: event.cuisine,
    timestamp: event.timestamp,
  };
}

export async function getFoodMemoryRecords(): Promise<FoodMemoryRecord[]> {
  const store = await readFoodMemoryStore();
  return acceptedMealsFromEvents(store.events);
}

export async function getFoodMemoryEvents(): Promise<FoodMemoryEvent[]> {
  const store = await readFoodMemoryStore();
  return sortEvents(store.events);
}
