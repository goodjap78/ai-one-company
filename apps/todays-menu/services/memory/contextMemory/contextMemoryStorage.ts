import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ContextMemoryPatch,
  ContextMemorySelection,
  ContextMemoryStore,
  ContextMood,
  DiningSituation,
  MealGoal,
} from '../../../types/contextMemory';

export const CONTEXT_MEMORY_STORAGE_KEY = '@hankki/context_memory';

const DINING: DiningSituation[] = ['alone', 'family', 'partner', 'friends', 'work'];
const GOALS: MealGoal[] = ['light', 'filling', 'quick', 'warm', 'refreshing'];
const MOODS: ContextMood[] = ['good', 'tired', 'stressed', 'sick', 'special'];

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function emptyStore(now = new Date()): ContextMemoryStore {
  return {
    version: 1,
    date: todayKey(now),
    diningSituation: null,
    mealGoal: null,
    mood: null,
    updatedAt: now.toISOString(),
    extensions: {},
  };
}

function isContextMemoryStore(value: unknown): value is ContextMemoryStore {
  if (!value || typeof value !== 'object') return false;
  const record = value as ContextMemoryStore;
  return (
    record.version === 1 &&
    typeof record.date === 'string' &&
    (record.diningSituation === null || DINING.includes(record.diningSituation)) &&
    (record.mealGoal === null || GOALS.includes(record.mealGoal)) &&
    (record.mood === null || MOODS.includes(record.mood))
  );
}

async function writeStore(store: ContextMemoryStore): Promise<void> {
  await AsyncStorage.setItem(CONTEXT_MEMORY_STORAGE_KEY, JSON.stringify(store));
}

export async function readContextMemoryStore(now = new Date()): Promise<ContextMemoryStore> {
  try {
    const raw = await AsyncStorage.getItem(CONTEXT_MEMORY_STORAGE_KEY);
    if (!raw) return emptyStore(now);

    const parsed = JSON.parse(raw) as unknown;
    if (!isContextMemoryStore(parsed)) return emptyStore(now);

    if (parsed.date !== todayKey(now)) {
      return emptyStore(now);
    }

    return parsed;
  } catch {
    return emptyStore(now);
  }
}

export async function saveContextMemoryPatch(
  patch: ContextMemoryPatch,
  now = new Date(),
): Promise<ContextMemoryStore> {
  const current = await readContextMemoryStore(now);
  const next: ContextMemoryStore = {
    ...current,
    ...patch,
    date: todayKey(now),
    updatedAt: now.toISOString(),
  };
  await writeStore(next);
  return next;
}

export async function clearContextMemory(now = new Date()): Promise<ContextMemoryStore> {
  const fresh = emptyStore(now);
  await writeStore(fresh);
  return fresh;
}

export function selectionFromStore(store: ContextMemoryStore): ContextMemorySelection {
  return {
    diningSituation: store.diningSituation,
    mealGoal: store.mealGoal,
    mood: store.mood,
  };
}
