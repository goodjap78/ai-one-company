/**
 * MealType-scoped toddler weekly plan persistence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { ToddlerFeedMealType } from '../../data/recipes/toddlerMealFeed';
import { isToddlerWeeklyPlanEligible } from '../../data/recipes/toddlerWeeklyPlan';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanSlot,
} from '../../data/recipes/recipeFamilyAudienceTypes';

const STORAGE_VERSION = 1;

export const TODDLER_WEEKLY_PLAN_STORAGE_KEYS: Record<ToddlerFeedMealType, string> = {
  breakfast: '@hankki/toddler_weekly_plan/breakfast',
  lunch: '@hankki/toddler_weekly_plan/lunch',
  dinner: '@hankki/toddler_weekly_plan/dinner',
  snack: '@hankki/toddler_weekly_plan/snack',
};

export const TODDLER_WEEKLY_PLAN_LAST_MEAL_KEY = '@hankki/toddler_weekly_plan/last_meal';

export type ToddlerWeeklyPlanState = {
  version: number;
  seed: string;
  mealType: ToddlerFeedMealType;
  plan: WeeklyMealPlan;
};

export function createToddlerWeeklyPlanSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function isWeeklyPlanSlot(value: unknown): value is WeeklyPlanSlot {
  if (!value || typeof value !== 'object') return false;
  const slot = value as WeeklyPlanSlot;
  return (
    typeof slot.day === 'string' &&
    typeof slot.recipeId === 'string' &&
    slot.recipeId.trim().length > 0 &&
    typeof slot.recipeName === 'string' &&
    typeof slot.time === 'number' &&
    Number.isFinite(slot.time)
  );
}

export function isValidToddlerWeeklyPlan(
  plan: WeeklyMealPlan | null | undefined,
  mealType: ToddlerFeedMealType,
): boolean {
  if (!plan?.seed?.trim()) return false;
  if (plan.audience !== 'toddler') return false;
  if (plan.mealType !== mealType) return false;
  if (!Array.isArray(plan.slots) || plan.slots.length !== WEEKLY_PLAN_DAYS.length) return false;

  const ids = new Set<string>();
  for (let i = 0; i < WEEKLY_PLAN_DAYS.length; i += 1) {
    const slot = plan.slots[i];
    if (!isWeeklyPlanSlot(slot)) return false;
    if (slot.day !== WEEKLY_PLAN_DAYS[i]) return false;
    if (slot.mealType !== mealType) return false;
    if (ids.has(slot.recipeId)) return false;
    const recipe = getHankkiRecipeById(slot.recipeId);
    if (!recipe || !isToddlerWeeklyPlanEligible(recipe, mealType)) return false;
    ids.add(slot.recipeId);
  }
  return ids.size === WEEKLY_PLAN_DAYS.length;
}

export function parseToddlerWeeklyPlanState(
  raw: string | null,
  mealType: ToddlerFeedMealType,
): ToddlerWeeklyPlanState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ToddlerWeeklyPlanState;
    if (parsed?.version !== STORAGE_VERSION) return null;
    if (parsed.mealType !== mealType) return null;
    if (typeof parsed.seed !== 'string' || !parsed.seed.trim()) return null;
    if (!isValidToddlerWeeklyPlan(parsed.plan, mealType)) return null;
    if (parsed.plan.seed !== parsed.seed) {
      parsed.plan = { ...parsed.plan, seed: parsed.seed };
    }
    return {
      version: STORAGE_VERSION,
      seed: parsed.seed,
      mealType,
      plan: parsed.plan,
    };
  } catch {
    return null;
  }
}

export async function loadToddlerWeeklyPlanState(
  mealType: ToddlerFeedMealType,
): Promise<ToddlerWeeklyPlanState | null> {
  const raw = await AsyncStorage.getItem(TODDLER_WEEKLY_PLAN_STORAGE_KEYS[mealType]);
  return parseToddlerWeeklyPlanState(raw, mealType);
}

export async function saveToddlerWeeklyPlanState(
  state: Pick<ToddlerWeeklyPlanState, 'seed' | 'mealType' | 'plan'>,
): Promise<void> {
  const payload: ToddlerWeeklyPlanState = {
    version: STORAGE_VERSION,
    seed: state.seed,
    mealType: state.mealType,
    plan: state.plan,
  };
  await AsyncStorage.setItem(
    TODDLER_WEEKLY_PLAN_STORAGE_KEYS[state.mealType],
    JSON.stringify(payload),
  );
}

export async function loadToddlerWeeklyPlanLastMeal(): Promise<ToddlerFeedMealType | null> {
  const raw = await AsyncStorage.getItem(TODDLER_WEEKLY_PLAN_LAST_MEAL_KEY);
  if (raw === 'breakfast' || raw === 'lunch' || raw === 'dinner' || raw === 'snack') return raw;
  return null;
}

export async function saveToddlerWeeklyPlanLastMeal(mealType: ToddlerFeedMealType): Promise<void> {
  await AsyncStorage.setItem(TODDLER_WEEKLY_PLAN_LAST_MEAL_KEY, mealType);
}
