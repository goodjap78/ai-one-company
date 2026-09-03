/**
 * Stage-scoped baby weekly plan persistence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import {
  isBabyWeeklyPlanEligible,
} from '../../data/recipes/babyWeeklyPlan';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanSlot,
} from '../../data/recipes/recipeFamilyAudienceTypes';

const STORAGE_VERSION = 1;

export const BABY_WEEKLY_PLAN_STORAGE_KEYS: Record<BabyFoodFeedStage, string> = {
  early: '@hankki/baby_weekly_plan/early',
  middle: '@hankki/baby_weekly_plan/middle',
  late: '@hankki/baby_weekly_plan/late',
  completion: '@hankki/baby_weekly_plan/completion',
};

export type BabyWeeklyPlanState = {
  version: number;
  seed: string;
  stage: BabyFoodFeedStage;
  plan: WeeklyMealPlan;
};

export function createBabyWeeklyPlanSeed(): string {
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

export function isValidBabyWeeklyPlan(
  plan: WeeklyMealPlan | null | undefined,
  stage: BabyFoodFeedStage,
): boolean {
  if (!plan?.seed?.trim()) return false;
  if (plan.audience !== 'baby') return false;
  if (plan.babyStage !== stage) return false;
  if (!Array.isArray(plan.slots) || plan.slots.length !== WEEKLY_PLAN_DAYS.length) return false;

  const ids = new Set<string>();
  for (let i = 0; i < WEEKLY_PLAN_DAYS.length; i += 1) {
    const slot = plan.slots[i];
    if (!isWeeklyPlanSlot(slot)) return false;
    if (slot.day !== WEEKLY_PLAN_DAYS[i]) return false;
    if (ids.has(slot.recipeId)) return false;
    const recipe = getHankkiRecipeById(slot.recipeId);
    if (!recipe || !isBabyWeeklyPlanEligible(recipe, stage)) return false;
    ids.add(slot.recipeId);
  }
  return ids.size === WEEKLY_PLAN_DAYS.length;
}

export function parseBabyWeeklyPlanState(
  raw: string | null,
  stage: BabyFoodFeedStage,
): BabyWeeklyPlanState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BabyWeeklyPlanState;
    if (parsed?.version !== STORAGE_VERSION) return null;
    if (parsed.stage !== stage) return null;
    if (typeof parsed.seed !== 'string' || !parsed.seed.trim()) return null;
    if (!isValidBabyWeeklyPlan(parsed.plan, stage)) return null;
    if (parsed.plan.seed !== parsed.seed) {
      parsed.plan = { ...parsed.plan, seed: parsed.seed };
    }
    return {
      version: STORAGE_VERSION,
      seed: parsed.seed,
      stage,
      plan: parsed.plan,
    };
  } catch {
    return null;
  }
}

export async function loadBabyWeeklyPlanState(
  stage: BabyFoodFeedStage,
): Promise<BabyWeeklyPlanState | null> {
  const raw = await AsyncStorage.getItem(BABY_WEEKLY_PLAN_STORAGE_KEYS[stage]);
  return parseBabyWeeklyPlanState(raw, stage);
}

export async function saveBabyWeeklyPlanState(
  state: Pick<BabyWeeklyPlanState, 'seed' | 'stage' | 'plan'>,
): Promise<void> {
  const payload: BabyWeeklyPlanState = {
    version: STORAGE_VERSION,
    seed: state.seed,
    stage: state.stage,
    plan: state.plan,
  };
  await AsyncStorage.setItem(BABY_WEEKLY_PLAN_STORAGE_KEYS[state.stage], JSON.stringify(payload));
}
