/**
 * Persist the current elementary dinner week locally.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanSlot,
} from '../../data/recipes/recipeFamilyAudienceTypes';

export const ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY =
  '@hankki/elementary_dinner_weekly_plan';

const STORAGE_VERSION = 1;

export type ElementaryDinnerWeeklyPlanState = {
  version: number;
  seed: string;
  plan: WeeklyMealPlan;
};

export function createElementaryDinnerWeekSeed(): string {
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

export function isValidElementaryDinnerWeeklyPlan(plan: WeeklyMealPlan | null | undefined): boolean {
  if (!plan?.seed?.trim()) return false;
  if (plan.audience !== 'elementary') return false;
  if (plan.mealType !== 'dinner') return false;
  if (!Array.isArray(plan.slots) || plan.slots.length !== WEEKLY_PLAN_DAYS.length) return false;

  const ids = new Set<string>();
  for (let i = 0; i < WEEKLY_PLAN_DAYS.length; i += 1) {
    const slot = plan.slots[i];
    if (!isWeeklyPlanSlot(slot)) return false;
    if (slot.day !== WEEKLY_PLAN_DAYS[i]) return false;
    if (ids.has(slot.recipeId)) return false;
    if (!getHankkiRecipeById(slot.recipeId)) return false;
    ids.add(slot.recipeId);
  }
  return ids.size === WEEKLY_PLAN_DAYS.length;
}

export function parseElementaryDinnerWeeklyPlanState(
  raw: string | null,
): ElementaryDinnerWeeklyPlanState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ElementaryDinnerWeeklyPlanState;
    if (parsed?.version !== STORAGE_VERSION) return null;
    if (typeof parsed.seed !== 'string' || !parsed.seed.trim()) return null;
    if (!isValidElementaryDinnerWeeklyPlan(parsed.plan)) return null;
    if (parsed.plan.seed !== parsed.seed) {
      parsed.plan = { ...parsed.plan, seed: parsed.seed };
    }
    return {
      version: STORAGE_VERSION,
      seed: parsed.seed,
      plan: parsed.plan,
    };
  } catch {
    return null;
  }
}

export async function loadElementaryDinnerWeeklyPlanState(): Promise<ElementaryDinnerWeeklyPlanState | null> {
  const raw = await AsyncStorage.getItem(ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY);
  return parseElementaryDinnerWeeklyPlanState(raw);
}

export async function saveElementaryDinnerWeeklyPlanState(
  state: Pick<ElementaryDinnerWeeklyPlanState, 'seed' | 'plan'>,
): Promise<void> {
  const payload: ElementaryDinnerWeeklyPlanState = {
    version: STORAGE_VERSION,
    seed: state.seed,
    plan: state.plan,
  };
  await AsyncStorage.setItem(ELEMENTARY_DINNER_WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(payload));
}
