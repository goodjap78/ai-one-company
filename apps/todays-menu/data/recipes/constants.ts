import type { MealType } from '../../types/home';
import type { MealTimeSlot } from '../../types/mealTime';
import { mealTypeToSlot } from '../../types/mealTime';
import type { CoreMealType } from '../../types/coreRecipe';

/** Core recipe mealTypes → recommendation engine slots. */
export const MEAL_TYPE_TO_SLOT: Record<CoreMealType, MealTimeSlot> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'LATE_NIGHT',
};

/** Aliases for recommendation slot matching (morning ↔ breakfast, lateNight ↔ snack). */
export const MEAL_TYPE_SLOT_ALIASES: Record<MealType, MealTimeSlot[]> = {
  breakfast: ['BREAKFAST'],
  lunch: ['LUNCH'],
  dinner: ['DINNER'],
  late_night: ['LATE_NIGHT', 'DINNER'],
};

export const MIN_CANDIDATE_POOL_SIZE = 8;

export function mealTypesToSlots(mealTypes: CoreMealType[]): MealTimeSlot[] {
  return [...new Set(mealTypes.map((mealType) => MEAL_TYPE_TO_SLOT[mealType]))];
}

export function mealSlotsForType(mealType: MealType): MealTimeSlot[] {
  return MEAL_TYPE_SLOT_ALIASES[mealType] ?? [mealTypeToSlot(mealType)];
}

export function menuMatchesMealType(menuSlots: MealTimeSlot[], mealType: MealType): boolean {
  const accepted = mealSlotsForType(mealType);
  return accepted.some((slot) => menuSlots.includes(slot));
}
