/**
 * Reuses existing clock → meal-time slot mapping.
 * Does not invent snack hours. lateNight falls back to breakfast.
 */
import { resolveClockPrimarySlot } from '../recommendation/mealTime/mealTimeSlotMapping';
import type { ToddlerFeedMealType } from '../../data/recipes/toddlerMealFeed';

export function resolveDefaultToddlerFeedMealType(date = new Date()): ToddlerFeedMealType {
  const slot = resolveClockPrimarySlot(date);
  if (slot === 'breakfast' || slot === 'lunch' || slot === 'dinner') return slot;
  return 'breakfast';
}
