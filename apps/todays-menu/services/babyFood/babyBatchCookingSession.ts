/**
 * Ephemeral baby batch cooking session — not persisted across app restarts.
 */
import type { BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import type { BabyPortionPreset } from '../../data/recipes/babyPortionScaling';
import type { WeeklyPlanDay } from '../../data/recipes/recipeFamilyAudienceTypes';
import type { BabyBatchGroceryResult } from './buildBabyBatchGroceryList';

export type BabyBatchSlotState = {
  recipeId: string;
  recipeName: string;
  day: WeeklyPlanDay;
  dayLabel: string;
  selected: boolean;
  portion: BabyPortionPreset;
};

export type BabyBatchCookingSession = {
  stage: BabyFoodFeedStage;
  seed: string;
  slots: BabyBatchSlotState[];
};

let activeSession: BabyBatchCookingSession | null = null;
let activeResult: BabyBatchGroceryResult | null = null;

export function setBabyBatchCookingSession(session: BabyBatchCookingSession): void {
  activeSession = session;
}

export function getBabyBatchCookingSession(): BabyBatchCookingSession | null {
  return activeSession;
}

export function clearBabyBatchCookingSession(): void {
  activeSession = null;
}

export function setBabyBatchCookingResult(result: BabyBatchGroceryResult): void {
  activeResult = result;
}

export function getBabyBatchCookingResult(): BabyBatchGroceryResult | null {
  return activeResult;
}

export function clearBabyBatchCookingResult(): void {
  activeResult = null;
}

export function resetBabyBatchCookingSessionForTests(): void {
  activeSession = null;
  activeResult = null;
}
