import type { MealType } from '../../../types/home';
import {
  MEAL_TIME_SLOT_KEYS,
  type MealTimeSlotKey,
} from '../../../types/mealTimeRecommendation';
import { resolveMealTimeWeights } from './mealTimeTransitionPolicy';

export function mealTimeSlotToMealType(slot: MealTimeSlotKey): MealType {
  if (slot === 'lateNight') return 'late_night';
  return slot;
}

export function mealTypeToMealTimeSlot(mealType: MealType): MealTimeSlotKey {
  if (mealType === 'late_night') return 'lateNight';
  return mealType;
}

/** Highest-weight slot from the current clock band (local time). */
export function resolveClockPrimarySlot(date = new Date()): MealTimeSlotKey {
  const weights = resolveMealTimeWeights(date);
  let best: MealTimeSlotKey = 'dinner';
  let bestWeight = -1;
  for (const slot of MEAL_TIME_SLOT_KEYS) {
    if (weights[slot] > bestWeight) {
      bestWeight = weights[slot];
      best = slot;
    }
  }
  return best;
}

export function buildSlotEmphasisWeights(slot: MealTimeSlotKey): Record<MealTimeSlotKey, number> {
  const emphasis = 0.85;
  const remainder = 0.15 / 3;
  return {
    breakfast: slot === 'breakfast' ? emphasis : remainder,
    lunch: slot === 'lunch' ? emphasis : remainder,
    dinner: slot === 'dinner' ? emphasis : remainder,
    lateNight: slot === 'lateNight' ? emphasis : remainder,
  };
}
