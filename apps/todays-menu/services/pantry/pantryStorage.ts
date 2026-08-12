import AsyncStorage from '@react-native-async-storage/async-storage';
import { lookupIngredientAlias } from '../../data/ingredients/ingredientAliases';
import type { PantryItem, PantryStore } from '../../types/pantry';
import { resolveIngredient } from '../ingredient';
import { resolvePantryItemMatchKey } from '../fridge/fridgeIngredientMatch';

export const PANTRY_STORAGE_KEY = '@hankki/pantry';

type LegacyPantryItem = PantryItem & {
  quantity?: number;
  unit?: string;
  freshness?: unknown;
  iconKey?: string;
};

type LegacyPantryStore = {
  version: 1;
  items: LegacyPantryItem[];
  updatedAt: string;
  extensions?: PantryStore['extensions'];
};

function emptyStore(now = new Date()): PantryStore {
  return {
    version: 2,
    items: [],
    updatedAt: now.toISOString(),
    extensions: {},
  };
}

function resolveStoredIconKey(name: string, normalizedName: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  return (
    lookupIngredientAlias(name) ??
    lookupIngredientAlias(normalizedName) ??
    ''
  );
}

function isPantryItem(value: unknown): value is LegacyPantryItem {
  if (!value || typeof value !== 'object') return false;
  const record = value as LegacyPantryItem;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.normalizedName === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

function isPantryStore(value: unknown): value is PantryStore | LegacyPantryStore {
  if (!value || typeof value !== 'object') return false;
  const record = value as { version?: number; items?: unknown; updatedAt?: string };
  return (record.version === 1 || record.version === 2) && Array.isArray(record.items);
}

function backfillPantryItemIconKey(item: LegacyPantryItem, now: Date): PantryItem {
  const iconKey = resolveStoredIconKey(item.name, item.normalizedName, item.iconKey);
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedName,
    iconKey,
    updatedAt: item.updatedAt ?? now.toISOString(),
  };
}

function migrateLegacyItem(item: LegacyPantryItem, now: Date): PantryItem {
  const { canonicalName, displayName } = resolveIngredient(item.name);
  const iconKey = resolveStoredIconKey(displayName, canonicalName, item.iconKey);
  const matchKey = resolvePantryItemMatchKey(iconKey, displayName);
  return {
    id: item.id || (matchKey ? `pantry_${matchKey}` : `pantry_${canonicalName}`),
    name: displayName,
    normalizedName: canonicalName,
    iconKey,
    updatedAt: item.updatedAt ?? now.toISOString(),
  };
}

function migrateStore(raw: PantryStore | LegacyPantryStore, now = new Date()): PantryStore {
  if (raw.version === 2) {
    return {
      version: 2,
      items: raw.items.filter(isPantryItem).map((item) => backfillPantryItemIconKey(item, now)),
      updatedAt: raw.updatedAt,
      extensions: raw.extensions ?? {},
    };
  }

  const byName = new Map<string, PantryItem>();
  for (const item of raw.items) {
    const migrated = migrateLegacyItem(item, now);
    if (!byName.has(migrated.normalizedName)) {
      byName.set(migrated.normalizedName, migrated);
    }
  }

  return {
    version: 2,
    items: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    updatedAt: raw.updatedAt ?? now.toISOString(),
    extensions: raw.extensions ?? {},
  };
}

function createPantryItem(name: string, iconKey: string | undefined, now: Date): PantryItem {
  const { canonicalName, displayName } = resolveIngredient(name);
  const resolvedIconKey = resolveStoredIconKey(displayName, canonicalName, iconKey);
  const matchKey = resolvePantryItemMatchKey(resolvedIconKey, displayName);

  return {
    id: matchKey ? `pantry_${matchKey}` : `pantry_${canonicalName}`,
    name: displayName,
    normalizedName: canonicalName,
    iconKey: resolvedIconKey,
    updatedAt: now.toISOString(),
  };
}

function sortPantryItems(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

function dedupePantryItems(items: PantryItem[]): PantryItem[] {
  const byMatchKey = new Map<string, PantryItem>();
  for (const item of items) {
    const matchKey = resolvePantryItemMatchKey(item.iconKey, item.name);
    const existing = byMatchKey.get(matchKey);
    if (!existing || item.updatedAt > existing.updatedAt) {
      byMatchKey.set(matchKey, item);
    }
  }
  return sortPantryItems([...byMatchKey.values()]);
}

export async function readPantryStore(now = new Date()): Promise<PantryStore> {
  try {
    const raw = await AsyncStorage.getItem(PANTRY_STORAGE_KEY);
    if (!raw) return emptyStore(now);

    const parsed = JSON.parse(raw) as unknown;
    if (!isPantryStore(parsed)) return emptyStore(now);

    return migrateStore(parsed, now);
  } catch {
    return emptyStore(now);
  }
}

async function writePantryStore(store: PantryStore): Promise<void> {
  await AsyncStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(store));
}

export async function upsertPantryItem(
  name: string,
  iconKey?: string,
  now = new Date(),
): Promise<PantryStore> {
  const store = await readPantryStore(now);
  const incoming = createPantryItem(name, iconKey, now);
  const incomingMatchKey = resolvePantryItemMatchKey(incoming.iconKey, incoming.name);

  const existingIndex = store.items.findIndex(
    (item) => resolvePantryItemMatchKey(item.iconKey, item.name) === incomingMatchKey,
  );

  const nextItems = [...store.items];
  if (existingIndex >= 0) {
    nextItems[existingIndex] = {
      ...nextItems[existingIndex],
      name: incoming.name,
      iconKey: incoming.iconKey || nextItems[existingIndex].iconKey,
      updatedAt: now.toISOString(),
    };
  } else {
    nextItems.push(incoming);
  }

  const nextStore: PantryStore = {
    version: 2,
    items: dedupePantryItems(nextItems),
    updatedAt: now.toISOString(),
    extensions: store.extensions,
  };

  await writePantryStore(nextStore);
  return nextStore;
}

export async function replacePantryItems(
  items: Array<{ name: string; iconKey: string }>,
  now = new Date(),
): Promise<PantryStore> {
  const store = await readPantryStore(now);
  const nextItems = dedupePantryItems(
    items.map((item) => createPantryItem(item.name, item.iconKey, now)),
  );

  const nextStore: PantryStore = {
    version: 2,
    items: nextItems,
    updatedAt: now.toISOString(),
    extensions: store.extensions,
  };

  await writePantryStore(nextStore);
  return nextStore;
}

export async function removePantryItem(id: string, now = new Date()): Promise<PantryStore> {
  const store = await readPantryStore(now);
  const nextStore: PantryStore = {
    ...store,
    items: store.items.filter((item) => item.id !== id),
    updatedAt: now.toISOString(),
  };
  await writePantryStore(nextStore);
  return nextStore;
}

export async function removePantryItemByMatchKey(matchKey: string, now = new Date()): Promise<PantryStore> {
  const store = await readPantryStore(now);
  const nextStore: PantryStore = {
    ...store,
    items: store.items.filter(
      (item) => resolvePantryItemMatchKey(item.iconKey, item.name) !== matchKey,
    ),
    updatedAt: now.toISOString(),
  };
  await writePantryStore(nextStore);
  return nextStore;
}

export async function clearPantryStore(now = new Date()): Promise<PantryStore> {
  const fresh = emptyStore(now);
  await writePantryStore(fresh);
  return fresh;
}
