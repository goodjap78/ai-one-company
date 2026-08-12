import type { ContextMemorySnapshot, ContextMemoryStore } from '../../../types/contextMemory';
import { readContextMemoryStore } from './contextMemoryStorage';

export function buildContextMemorySnapshotFromStore(
  store: ContextMemoryStore,
): ContextMemorySnapshot {
  const hasExplicitInput =
    store.diningSituation !== null || store.mealGoal !== null || store.mood !== null;

  return {
    version: 1,
    date: store.date,
    diningSituation: store.diningSituation,
    mealGoal: store.mealGoal,
    mood: store.mood,
    hasExplicitInput,
    extensions: store.extensions,
  };
}

export async function buildContextMemorySnapshot(): Promise<ContextMemorySnapshot> {
  const store = await readContextMemoryStore();
  return buildContextMemorySnapshotFromStore(store);
}
