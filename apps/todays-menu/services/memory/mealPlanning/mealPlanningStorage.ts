import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MealPlanningCompleteInput,
  MealPlanningEntry,
  MealPlanningRecommendInput,
  MealPlanningSaveInput,
  MealPlanningStatus,
  MealPlanningStore,
} from '../../../types/mealPlanning';
import { resolveMealFoodMeta } from '../foodMemory/resolveMealFoodMeta';
import { getMenuById } from '../../recipe/mockRecipeDetails';
import { getPrimaryArchetype } from '../../recommendation/mealIntelligence/mealProfile';
import { isSavedMealActive, todayKey } from './mealPlanningDates';

export const MEAL_PLANNING_STORAGE_KEY = '@hankki/meal_planning';
const LEGACY_MEAL_CALENDAR_STORAGE_KEY = '@hankki/meal_calendar';

const LOCKED_RECOMMEND_STATUSES: MealPlanningStatus[] = ['saved', 'completed', 'archived'];

type RawPlanningEntry = {
  id: string;
  recipeId: string;
  mealType: MealPlanningEntry['mealType'];
  mealMode: MealPlanningEntry['mealMode'];
  status?: MealPlanningStatus | 'planned';
  category: MealPlanningEntry['category'];
  cuisine: MealPlanningEntry['cuisine'];
  cookingStyle: string;
  recommendedAt?: string;
  savedAt?: string | null;
  plannedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  recommendationId?: string;
  horizon?: string;
  targetDate?: string;
  weekKey?: string;
};

type RawPlanningStore = {
  version?: number;
  entries: RawPlanningEntry[];
  extensions?: MealPlanningStore['extensions'];
  updatedAt: string;
};

function emptyStore(now = new Date()): MealPlanningStore {
  return {
    version: 4,
    entries: [],
    extensions: {},
    updatedAt: now.toISOString(),
  };
}

function normalizeStatus(status: RawPlanningEntry['status']): MealPlanningStatus {
  if (status === 'planned') return 'saved';
  return status ?? 'saved';
}

function normalizeEntry(entry: RawPlanningEntry, now = new Date()): MealPlanningEntry {
  const status = normalizeStatus(entry.status);
  const recommendedAt = entry.recommendedAt ?? entry.plannedAt ?? entry.savedAt ?? now.toISOString();
  const savedAt =
    status === 'recommended'
      ? null
      : entry.savedAt ?? entry.plannedAt ?? recommendedAt;

  return {
    id: entry.id,
    recipeId: entry.recipeId,
    mealType: entry.mealType,
    mealMode: entry.mealMode,
    status,
    category: entry.category,
    cuisine: entry.cuisine,
    cookingStyle: entry.cookingStyle,
    recommendedAt,
    savedAt,
    completedAt: entry.completedAt ?? null,
    archivedAt: entry.archivedAt ?? null,
    recommendationId: entry.recommendationId,
  };
}

function migrateStore(raw: RawPlanningStore, now = new Date()): MealPlanningStore {
  return {
    version: 4,
    entries: raw.entries.map((entry) => normalizeEntry(entry, now)),
    extensions: raw.extensions ?? {},
    updatedAt: raw.updatedAt,
  };
}

function isPlanningStore(value: unknown): value is RawPlanningStore {
  if (!value || typeof value !== 'object') return false;
  return Array.isArray((value as RawPlanningStore).entries);
}

function recommendSlotKey(mealType: MealPlanningEntry['mealType']): string {
  return `recommended:${mealType}`;
}

function savedSlotKey(recipeId: string): string {
  return `saved:${recipeId}`;
}

function entrySlotKey(entry: MealPlanningEntry): string {
  if (entry.status === 'recommended') {
    return recommendSlotKey(entry.mealType);
  }
  return savedSlotKey(entry.recipeId);
}

function isEntryActive(entry: MealPlanningEntry, now = new Date()): boolean {
  if (entry.status === 'archived' || entry.status === 'completed') {
    return false;
  }
  if (entry.status === 'recommended') {
    return todayKey(now) === todayKey(new Date(entry.recommendedAt));
  }
  if (entry.status === 'saved') {
    return entry.savedAt ? isSavedMealActive(entry.savedAt, now) : true;
  }
  return false;
}

export function pruneMealPlanningStore(
  store: MealPlanningStore,
  now = new Date(),
): MealPlanningStore {
  const activeEntries = store.entries.filter((entry) => {
    if (entry.status === 'archived' || entry.status === 'completed') return true;
    return isEntryActive(entry, now);
  });

  if (activeEntries.length === store.entries.length) return store;
  return { ...store, entries: activeEntries, updatedAt: now.toISOString() };
}

async function readRawStorage(now = new Date()): Promise<MealPlanningStore> {
  for (const key of [MEAL_PLANNING_STORAGE_KEY, LEGACY_MEAL_CALENDAR_STORAGE_KEY]) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!isPlanningStore(parsed)) continue;
      const migrated = migrateStore(parsed, now);
      if (key === LEGACY_MEAL_CALENDAR_STORAGE_KEY) {
        await AsyncStorage.setItem(MEAL_PLANNING_STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      continue;
    }
  }
  return emptyStore(now);
}

async function writeStore(store: MealPlanningStore): Promise<void> {
  await AsyncStorage.setItem(MEAL_PLANNING_STORAGE_KEY, JSON.stringify(store));
}

export async function readMealPlanningStore(now = new Date()): Promise<MealPlanningStore> {
  return pruneMealPlanningStore(await readRawStorage(now), now);
}

function buildMeta(recipeId: string) {
  const meta = resolveMealFoodMeta(recipeId);
  const menu = getMenuById(recipeId);
  return {
    category: meta.category,
    cuisine: meta.cuisine,
    cookingStyle: menu ? getPrimaryArchetype(menu) : 'rice',
  };
}

function upsertEntry(
  store: MealPlanningStore,
  entry: MealPlanningEntry,
  now = new Date(),
): MealPlanningStore {
  const key = entrySlotKey(entry);
  const nextEntries = [
    ...store.entries.filter((item) => entrySlotKey(item) !== key),
    entry,
  ];
  return { ...store, entries: nextEntries, updatedAt: now.toISOString() };
}

export async function upsertRecommendedMeal(
  input: MealPlanningRecommendInput,
  now = new Date(),
): Promise<MealPlanningStore> {
  const store = await readMealPlanningStore(now);
  const key = recommendSlotKey(input.mealType);
  const existing = store.entries.find((item) => entrySlotKey(item) === key) ?? null;

  if (existing && LOCKED_RECOMMEND_STATUSES.includes(existing.status)) {
    return store;
  }

  const meta = buildMeta(input.recipeId);
  const entry: MealPlanningEntry = {
    id: `plan_rec_${input.mealType}_${now.getTime()}`,
    recipeId: input.recipeId,
    mealType: input.mealType,
    mealMode: input.mealMode,
    status: 'recommended',
    ...meta,
    recommendedAt: now.toISOString(),
    savedAt: null,
    completedAt: null,
    archivedAt: null,
    recommendationId: input.recommendationId,
  };

  const next = upsertEntry(store, entry, now);
  await writeStore(next);
  return next;
}

export async function upsertSavedMeal(
  input: MealPlanningSaveInput,
  now = new Date(),
): Promise<MealPlanningStore> {
  const store = await readMealPlanningStore(now);
  const key = savedSlotKey(input.recipeId);
  const existing = store.entries.find((item) => entrySlotKey(item) === key) ?? null;
  const meta = buildMeta(input.recipeId);

  const entry: MealPlanningEntry = {
    id: existing?.id ?? `plan_saved_${input.recipeId}_${now.getTime()}`,
    recipeId: input.recipeId,
    mealType: input.mealType,
    mealMode: input.mealMode,
    status: 'saved',
    ...meta,
    recommendedAt: existing?.recommendedAt ?? now.toISOString(),
    savedAt: now.toISOString(),
    completedAt: null,
    archivedAt: null,
    recommendationId: input.recommendationId,
  };

  const withoutRecommend =
    existing?.status === 'recommended'
      ? store.entries.filter((item) => entrySlotKey(item) !== recommendSlotKey(input.mealType))
      : store.entries;

  const next = upsertEntry({ ...store, entries: withoutRecommend }, entry, now);
  await writeStore(next);
  return next;
}

export async function completeMealPlanningEntry(
  input: MealPlanningCompleteInput,
  now = new Date(),
): Promise<MealPlanningStore> {
  const store = await readMealPlanningStore(now);
  const match = store.entries.find(
    (entry) =>
      entry.recipeId === input.recipeId &&
      entry.mealType === input.mealType &&
      (entry.status === 'saved' || entry.status === 'recommended'),
  );

  if (!match) return store;

  const completed: MealPlanningEntry = {
    ...match,
    status: 'completed',
    savedAt: match.savedAt ?? now.toISOString(),
    completedAt: now.toISOString(),
    archivedAt: null,
  };

  const next = upsertEntry(store, completed, now);
  await writeStore(next);
  return next;
}

export async function archiveMealPlanningEntry(
  input: MealPlanningCompleteInput,
  now = new Date(),
): Promise<MealPlanningStore> {
  const store = await readMealPlanningStore(now);
  const match = store.entries.find(
    (entry) =>
      entry.recipeId === input.recipeId &&
      entry.mealType === input.mealType &&
      entry.status === 'completed',
  );

  if (!match) return store;

  const archived: MealPlanningEntry = {
    ...match,
    status: 'archived',
    archivedAt: now.toISOString(),
  };

  const next = upsertEntry(store, archived, now);
  await writeStore(next);
  return next;
}

export function getActivePlanningEntries(
  store: MealPlanningStore,
  now = new Date(),
): MealPlanningEntry[] {
  return store.entries.filter(
    (entry) => entry.status !== 'archived' && isEntryActive(entry, now),
  );
}
