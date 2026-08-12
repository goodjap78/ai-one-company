/**
 * Sprint 57 — Clock → meal-time slot weight policy (design only; not wired to production).
 */
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';

export type MealTimeWeightMap = Record<MealTimeSlotKey, number>;

export type MealTimeTransitionBand = {
  id: string;
  startHour: number;
  endHour: number;
  weights: MealTimeWeightMap;
  label: string;
};

/**
 * Hour ranges use local time [startHour, endHour).
 * Transition bands blend adjacent slots — never hard-filter.
 */
export const MEAL_TIME_TRANSITION_BANDS: MealTimeTransitionBand[] = [
  {
    id: 'late_night_core',
    startHour: 0,
    endHour: 5,
    label: '야식',
    weights: { breakfast: 0, lunch: 0, dinner: 0.1, lateNight: 0.9 },
  },
  {
    id: 'breakfast_core',
    startHour: 5,
    endHour: 10,
    label: '아침',
    weights: { breakfast: 0.92, lunch: 0.06, dinner: 0.02, lateNight: 0 },
  },
  {
    id: 'breakfast_lunch_transition',
    startHour: 10,
    endHour: 11.5,
    label: '아침→점심',
    weights: { breakfast: 0.45, lunch: 0.52, dinner: 0.03, lateNight: 0 },
  },
  {
    id: 'lunch_core',
    startHour: 11.5,
    endHour: 14.5,
    label: '점심',
    weights: { breakfast: 0.05, lunch: 0.9, dinner: 0.05, lateNight: 0 },
  },
  {
    id: 'lunch_light_transition',
    startHour: 14.5,
    endHour: 17,
    label: '점심→저녁(가벼운)',
    weights: { breakfast: 0.05, lunch: 0.55, dinner: 0.38, lateNight: 0.02 },
  },
  {
    id: 'dinner_core',
    startHour: 17,
    endHour: 21,
    label: '저녁',
    weights: { breakfast: 0.02, lunch: 0.08, dinner: 0.88, lateNight: 0.02 },
  },
  {
    id: 'dinner_late_transition',
    startHour: 21,
    endHour: 24,
    label: '저녁→야식',
    weights: { breakfast: 0, lunch: 0.05, dinner: 0.55, lateNight: 0.4 },
  },
];

export function resolveMealTimeWeights(date = new Date()): MealTimeWeightMap {
  const hour = date.getHours() + date.getMinutes() / 60;
  for (const band of MEAL_TIME_TRANSITION_BANDS) {
    if (hour >= band.startHour && hour < band.endHour) {
      return { ...band.weights };
    }
  }
  return MEAL_TIME_TRANSITION_BANDS[0].weights;
}

export function blendFitWithClockWeights(
  fit: Record<MealTimeSlotKey, number>,
  weights: MealTimeWeightMap,
): number {
  return (
    fit.breakfast * weights.breakfast +
    fit.lunch * weights.lunch +
    fit.dinner * weights.dinner +
    fit.lateNight * weights.lateNight
  );
}

export function activeTransitionBand(date = new Date()): MealTimeTransitionBand {
  const hour = date.getHours() + date.getMinutes() / 60;
  for (const band of MEAL_TIME_TRANSITION_BANDS) {
    if (hour >= band.startHour && hour < band.endHour) {
      return band;
    }
  }
  return MEAL_TIME_TRANSITION_BANDS[0];
}
