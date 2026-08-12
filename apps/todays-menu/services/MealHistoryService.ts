import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodMemoryCategory } from '../types/foodMemory';
import type { MealType } from '../types/home';
import type { MealHistoryEntry, SaveMealInput } from '../types/mealHistory';
import { resolveMealFoodMeta } from './memory/foodMemory';

const MEAL_HISTORY_KEY = '@hankki/meal_history';
const MAX_HISTORY_RECORDS = 30;
export const RECENT_MEAL_WINDOW_DAYS = 3;

export type SaveMealResult = {
  saved: boolean;
  entry: MealHistoryEntry;
};

function mealSlotKey(cookedDate: string, mealType: MealType): string {
  return `${cookedDate}:${mealType}`;
}

/** One record per date + mealType — keep the most recent. */
export function dedupeMealHistoryEntries(entries: MealHistoryEntry[]): MealHistoryEntry[] {
  const slotMap = new Map<string, MealHistoryEntry>();

  for (const entry of entries) {
    const key = mealSlotKey(entry.cookedDate, entry.mealType);
    const existing = slotMap.get(key);
    if (!existing || new Date(entry.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      slotMap.set(key, entry);
    }
  }

  return Array.from(slotMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function matchesMealSlot(
  entry: MealHistoryEntry,
  recipeId: string,
  cookedDate: string,
  mealType: MealType,
): boolean {
  return (
    entry.recipeId === recipeId &&
    entry.cookedDate === cookedDate &&
    entry.mealType === mealType
  );
}

export function findMealRecord(
  entries: MealHistoryEntry[],
  recipeId: string,
  cookedDate: string,
  mealType: MealType,
): MealHistoryEntry | undefined {
  return entries.find((entry) => matchesMealSlot(entry, recipeId, cookedDate, mealType));
}

function isMealHistoryEntry(value: unknown): value is MealHistoryEntry {
  if (!value || typeof value !== 'object') return false;

  const record = value as MealHistoryEntry;
  return (
    typeof record.id === 'string' &&
    typeof record.recipeId === 'string' &&
    typeof record.cookedDate === 'string' &&
    typeof record.mealType === 'string' &&
    typeof record.createdAt === 'string'
  );
}

function normalizeEntry(entry: MealHistoryEntry): MealHistoryEntry {
  const meta = resolveMealFoodMeta(entry.recipeId);
  return {
    ...entry,
    recipeName: entry.recipeName ?? meta.mealName,
    category: entry.category ?? meta.category,
    satisfaction: entry.satisfaction ?? null,
    cookingTime: entry.cookingTime ?? 0,
  };
}

function parseMealHistory(raw: string | null): MealHistoryEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isMealHistoryEntry).map(normalizeEntry);
  } catch {
    return [];
  }
}

async function readMealHistory(): Promise<MealHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(MEAL_HISTORY_KEY);
    const entries = dedupeMealHistoryEntries(parseMealHistory(raw));
    return entries;
  } catch {
    return [];
  }
}

async function writeMealHistory(entries: MealHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_RECORDS)));
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function yesterdayDateKey(now = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

/** Persist a meal the user confirmed via Detail "오늘 먹었어요". */
export async function saveMeal(input: SaveMealInput): Promise<SaveMealResult> {
  const entries = await readMealHistory();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const cookedDate = toDateKey(createdAt);

  const existingSameSlot = entries.find(
    (entry) => entry.cookedDate === cookedDate && entry.mealType === input.mealType,
  );
  if (existingSameSlot?.recipeId === input.recipeId) {
    return { saved: false, entry: existingSameSlot };
  }

  const withoutSlot = entries.filter(
    (entry) => !(entry.cookedDate === cookedDate && entry.mealType === input.mealType),
  );

  const entry: MealHistoryEntry = {
    id: `meal_${Date.now()}`,
    recipeId: input.recipeId,
    recipeName: input.recipeName,
    category: input.category,
    cookedDate,
    mealType: input.mealType,
    satisfaction: null,
    cookingTime: 0,
    createdAt,
  };

  await writeMealHistory([entry, ...withoutSlot]);
  return { saved: true, entry };
}

export async function getHistory(): Promise<MealHistoryEntry[]> {
  return readMealHistory();
}

export async function getRecentMeals(
  withinDays = RECENT_MEAL_WINDOW_DAYS,
): Promise<MealHistoryEntry[]> {
  const entries = await readMealHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);

  return entries.filter((entry) => new Date(entry.cookedDate) >= cutoff);
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(MEAL_HISTORY_KEY);
}

export async function getYesterdayMeals(now = new Date()): Promise<MealHistoryEntry[]> {
  const target = yesterdayDateKey(now);
  const entries = await readMealHistory();
  return entries.filter((entry) => entry.cookedDate === target);
}

export async function getYesterdayRecipeIds(now = new Date()): Promise<string[]> {
  const meals = await getYesterdayMeals(now);
  return [...new Set(meals.map((meal) => meal.recipeId))];
}

export async function getRecentMealRecipeIds(
  withinDays = RECENT_MEAL_WINDOW_DAYS,
): Promise<string[]> {
  const recent = await getRecentMeals(withinDays);
  return [...new Set(recent.map((entry) => entry.recipeId))];
}

export function resolveEntryCategory(entry: MealHistoryEntry): FoodMemoryCategory {
  return entry.category ?? resolveMealFoodMeta(entry.recipeId).category;
}
