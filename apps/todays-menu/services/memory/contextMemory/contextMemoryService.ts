import type {
  ContextMemoryPatch,
  ContextMemorySelection,
  ContextMemorySnapshot,
  ContextMemoryStore,
  DiningSituation,
  MealGoal,
  ContextMood,
} from '../../../types/contextMemory';
import { buildContextMemorySnapshot, buildContextMemorySnapshotFromStore } from './buildContextMemorySnapshot';
import {
  clearContextMemory,
  readContextMemoryStore,
  saveContextMemoryPatch,
  selectionFromStore,
} from './contextMemoryStorage';

export { CONTEXT_MEMORY_STORAGE_KEY } from './contextMemoryStorage';
export { buildContextMemorySnapshot } from './buildContextMemorySnapshot';

export async function getContextMemory(): Promise<ContextMemorySnapshot> {
  return buildContextMemorySnapshot();
}

export async function getContextMemorySelection(): Promise<ContextMemorySelection> {
  const store = await readContextMemoryStore();
  return selectionFromStore(store);
}

export async function saveContextMemory(patch: ContextMemoryPatch): Promise<ContextMemorySnapshot> {
  const store = await saveContextMemoryPatch(patch);
  return buildContextMemorySnapshotFromStore(store);
}

export async function toggleContextField(
  field: keyof ContextMemorySelection,
  value: DiningSituation | MealGoal | ContextMood,
): Promise<ContextMemorySnapshot> {
  const store = await readContextMemoryStore();
  const current = store[field];
  const nextValue = current === value ? null : value;
  return saveContextMemory({ [field]: nextValue });
}

export async function resetContextMemory(): Promise<ContextMemoryStore> {
  return clearContextMemory();
}
