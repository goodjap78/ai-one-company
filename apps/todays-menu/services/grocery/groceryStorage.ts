import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GroceryListSnapshot, GroceryListStore } from '../../types/grocery';
import { GROCERY_CATEGORY_ORDER, GROCERY_CATEGORY_LABELS } from '../../types/grocery';

export const GROCERY_LIST_STORAGE_KEY = '@hankki/grocery_list';

function emptyStore(now = new Date()): GroceryListStore {
  return {
    version: 2,
    generatedAt: now.toISOString(),
    sources: { savedMealIds: [], completedMealIds: [] },
    groups: GROCERY_CATEGORY_ORDER.map((category) => ({
      category,
      label: GROCERY_CATEGORY_LABELS[category],
      items: [],
    })),
    items: [],
    extensions: {},
  };
}

type LegacyGroceryListStore = {
  version: 1;
  generatedAt: string;
  sources: GroceryListStore['sources'];
  items: Array<GroceryListStore['items'][number] & {
    normalizedName?: string;
    category?: GroceryListStore['items'][number]['category'];
  }>;
  extensions: GroceryListStore['extensions'];
};

function isGroceryListStore(value: unknown): value is GroceryListStore | LegacyGroceryListStore {
  if (!value || typeof value !== 'object') return false;
  const record = value as { version?: number; items?: unknown };
  return (record.version === 1 || record.version === 2) && Array.isArray(record.items);
}

function migrateStore(raw: GroceryListStore | LegacyGroceryListStore): GroceryListStore {
  if (raw.version === 2 && Array.isArray(raw.groups)) {
    return raw;
  }

  return {
    version: 2,
    generatedAt: raw.generatedAt,
    sources: raw.sources,
    items: raw.items.map((item) => ({
      ...item,
      normalizedName: item.normalizedName ?? item.name,
      category: item.category ?? 'others',
    })),
    groups: GROCERY_CATEGORY_ORDER.map((category) => ({
      category,
      label: GROCERY_CATEGORY_LABELS[category],
      items: (raw.items as GroceryListStore['items']).filter(
        (item) => (item.category ?? 'others') === category,
      ),
    })).filter((group) => group.items.length > 0),
    extensions: raw.extensions ?? {},
  };
}

export async function readGroceryListStore(now = new Date()): Promise<GroceryListStore> {
  try {
    const raw = await AsyncStorage.getItem(GROCERY_LIST_STORAGE_KEY);
    if (!raw) return emptyStore(now);
    const parsed = JSON.parse(raw) as unknown;
    if (!isGroceryListStore(parsed)) return emptyStore(now);
    return migrateStore(parsed);
  } catch {
    return emptyStore(now);
  }
}

export async function writeGroceryListStore(store: GroceryListStore): Promise<void> {
  await AsyncStorage.setItem(GROCERY_LIST_STORAGE_KEY, JSON.stringify(store));
}

export async function writeGroceryListSnapshot(snapshot: GroceryListSnapshot): Promise<void> {
  await writeGroceryListStore({
    version: 2,
    generatedAt: snapshot.generatedAt,
    sources: snapshot.sources,
    groups: snapshot.groups,
    items: snapshot.items,
    extensions: snapshot.extensions,
  });
}
