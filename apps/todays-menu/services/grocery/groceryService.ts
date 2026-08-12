import type { GroceryListSnapshot } from '../../types/grocery';
import { buildGroceryListSnapshot, snapshotToStore } from './buildGroceryList';
import { GROCERY_LIST_STORAGE_KEY, readGroceryListStore, writeGroceryListSnapshot } from './groceryStorage';

export { GROCERY_LIST_STORAGE_KEY } from './groceryStorage';

export async function getGroceryList(): Promise<GroceryListSnapshot> {
  const store = await readGroceryListStore();
  return {
    version: 2,
    generatedAt: store.generatedAt,
    sources: store.sources,
    groups: store.groups,
    items: store.items,
    extensions: store.extensions,
  };
}

export async function regenerateGroceryList(): Promise<GroceryListSnapshot> {
  const snapshot = await buildGroceryListSnapshot();
  await writeGroceryListSnapshot(snapshot);
  return snapshot;
}

export async function clearGroceryList(): Promise<GroceryListSnapshot> {
  const snapshot = await buildGroceryListSnapshot();
  const empty: GroceryListSnapshot = {
    ...snapshot,
    items: [],
    groups: [],
    generatedAt: new Date().toISOString(),
  };
  await writeGroceryListSnapshot(empty);
  return empty;
}

export function groceryListToStore(snapshot: GroceryListSnapshot) {
  return snapshotToStore(snapshot);
}
