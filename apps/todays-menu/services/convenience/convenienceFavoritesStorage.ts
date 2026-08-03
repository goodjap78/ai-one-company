import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONVENIENCE_COMBOS } from '../../data/content/combos';
import type {
  ConvenienceFavoriteRecord,
  ConvenienceFavoritesSnapshot,
} from '../../types/convenienceFavorite';

export const CONVENIENCE_FAVORITES_KEY = '@hankki/convenience-favorites';

const VALID_COMBO_IDS = new Set(CONVENIENCE_COMBOS.map((c) => c.id));

function isRecord(value: unknown): value is ConvenienceFavoriteRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as ConvenienceFavoriteRecord;
  return typeof row.comboId === 'string' && typeof row.savedAt === 'string';
}

function normalizeSnapshot(value: unknown): ConvenienceFavoritesSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { version: 1, items: [] };
  }
  const raw = value as Partial<ConvenienceFavoritesSnapshot>;
  const items = Array.isArray(raw.items)
    ? raw.items.filter(isRecord).filter((item) => VALID_COMBO_IDS.has(item.comboId))
    : [];
  const deduped: ConvenienceFavoriteRecord[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.comboId)) continue;
    seen.add(item.comboId);
    deduped.push(item);
  }
  return { version: 1, items: deduped };
}

export async function getConvenienceFavorites(): Promise<ConvenienceFavoritesSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(CONVENIENCE_FAVORITES_KEY);
    if (!raw) return { version: 1, items: [] };
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return { version: 1, items: [] };
  }
}

export async function getConvenienceFavoriteIds(): Promise<string[]> {
  const snapshot = await getConvenienceFavorites();
  return snapshot.items.map((item) => item.comboId);
}

export async function isConvenienceFavorite(comboId: string): Promise<boolean> {
  const ids = await getConvenienceFavoriteIds();
  return ids.includes(comboId);
}

async function persist(snapshot: ConvenienceFavoritesSnapshot): Promise<void> {
  await AsyncStorage.setItem(CONVENIENCE_FAVORITES_KEY, JSON.stringify(snapshot));
}

export async function addConvenienceFavorite(comboId: string): Promise<boolean> {
  if (!VALID_COMBO_IDS.has(comboId)) return false;
  const snapshot = await getConvenienceFavorites();
  if (snapshot.items.some((item) => item.comboId === comboId)) return true;
  const next: ConvenienceFavoritesSnapshot = {
    version: 1,
    items: [
      ...snapshot.items,
      { comboId, savedAt: new Date().toISOString() },
    ],
  };
  try {
    await persist(next);
    return true;
  } catch {
    return false;
  }
}

export async function removeConvenienceFavorite(comboId: string): Promise<boolean> {
  const snapshot = await getConvenienceFavorites();
  const next: ConvenienceFavoritesSnapshot = {
    version: 1,
    items: snapshot.items.filter((item) => item.comboId !== comboId),
  };
  try {
    await persist(next);
    return true;
  } catch {
    return false;
  }
}

export async function toggleConvenienceFavorite(comboId: string): Promise<boolean> {
  const snapshot = await getConvenienceFavorites();
  const exists = snapshot.items.some((item) => item.comboId === comboId);
  if (exists) {
    return removeConvenienceFavorite(comboId);
  }
  return addConvenienceFavorite(comboId);
}
