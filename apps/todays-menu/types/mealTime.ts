import type { MealType } from './home';

/** Product Decision #002 — when a recipe fits in the day. */
export const MEAL_TIME_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'LATE_NIGHT'] as const;

export type MealTimeSlot = (typeof MEAL_TIME_SLOTS)[number];

const MEAL_TYPE_TO_SLOT: Record<MealType, MealTimeSlot> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  late_night: 'LATE_NIGHT',
};

export function mealTypeToSlot(mealType: MealType): MealTimeSlot {
  return MEAL_TYPE_TO_SLOT[mealType];
}

export function mealTimeIncludes(mealTime: MealTimeSlot[], mealType: MealType): boolean {
  return mealTime.includes(mealTypeToSlot(mealType));
}
