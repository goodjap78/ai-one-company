/**
 * Sprint 57 — Pool counts and gap analysis from derived meal-time fits.
 */
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';
import { MEAL_TIME_SLOT_KEYS } from '../../../types/mealTimeRecommendation';
import {
  BREAKFAST_FOOD_TYPES,
  DINNER_FOOD_TYPES,
  foodTypeSlotAffinity,
  LATE_NIGHT_FOOD_TYPES,
  LUNCH_FOOD_TYPES,
  type MealFoodType,
} from './classifyMealFoodType';
import type { MealTimeFitResult } from '../../../types/mealTimeRecommendation';

export const POOL_THRESHOLDS = [0.7, 0.5, 0.3] as const;

export type PoolThreshold = (typeof POOL_THRESHOLDS)[number];

export const MEAL_TIME_POOL_TARGETS: Record<
  MealTimeSlotKey,
  { minScore070: number; label: string }
> = {
  breakfast: { minScore070: 45, label: '아침' },
  lunch: { minScore070: 70, label: '점심' },
  dinner: { minScore070: 80, label: '저녁' },
  lateNight: { minScore070: 40, label: '야식' },
};

export type SlotPoolCounts = Record<PoolThreshold, number>;

export type MealTimePoolSummary = {
  slot: MealTimeSlotKey;
  label: string;
  counts: SlotPoolCounts;
  targetMin070: number;
  gap070: number;
  primaryCount: number;
};

export type FoodTypeGapRow = {
  foodType: MealFoodType;
  slot: MealTimeSlotKey;
  current: number;
  target: number;
  gap: number;
};

const FOOD_TYPE_TARGETS: Record<MealTimeSlotKey, Partial<Record<MealFoodType, number>>> = {
  breakfast: {
    toast: 8,
    porridge: 6,
    egg: 12,
    sandwich: 10,
    soup: 8,
    light_soup: 4,
    light_rice: 6,
    yogurt_fruit: 8,
    salad_light: 6,
  },
  lunch: {
    rice_bowl: 18,
    fried_rice: 12,
    noodle: 20,
    quick_korean: 25,
    gimbap: 8,
    sandwich_lunch: 8,
  },
  dinner: {
    soup_stew: 25,
    fish: 15,
    meat: 30,
    family_meal: 20,
    side_dish_combo: 15,
    pasta_western: 12,
    grilled: 12,
  },
  lateNight: {
    ramen: 12,
    snack: 15,
    spicy_quick: 12,
    noodle: 10,
    convenience_style: 8,
    light_late: 6,
  },
};

export function countPool(entries: MealTimeFitResult[], slot: MealTimeSlotKey): SlotPoolCounts {
  const counts: SlotPoolCounts = { 0.7: 0, 0.5: 0, 0.3: 0 };
  for (const e of entries) {
    const score = e.fit[slot];
    if (score >= 0.7) counts[0.7] += 1;
    if (score >= 0.5) counts[0.5] += 1;
    if (score >= 0.3) counts[0.3] += 1;
  }
  return counts;
}

export function buildMealTimePoolSummary(entries: MealTimeFitResult[]): MealTimePoolSummary[] {
  return MEAL_TIME_SLOT_KEYS.map((slot) => {
    const counts = countPool(entries, slot);
    const targetMin070 = MEAL_TIME_POOL_TARGETS[slot].minScore070;
    const primaryCount = entries.filter((e) => e.primaryMealTime === slot).length;
    return {
      slot,
      label: MEAL_TIME_POOL_TARGETS[slot].label,
      counts,
      targetMin070,
      gap070: targetMin070 - counts[0.7],
      primaryCount,
    };
  });
}

export function countFoodTypeInSlot(
  entries: MealTimeFitResult[],
  slot: MealTimeSlotKey,
  foodType: MealFoodType,
  minScore = 0.7,
): number {
  return entries.filter(
    (e) => e.fit[slot] >= minScore && e.foodTypes.includes(foodType),
  ).length;
}

export function buildFoodTypeGapAnalysis(entries: MealTimeFitResult[]): FoodTypeGapRow[] {
  const rows: FoodTypeGapRow[] = [];

  const slotFoodTypes: Record<MealTimeSlotKey, readonly MealFoodType[]> = {
    breakfast: BREAKFAST_FOOD_TYPES,
    lunch: LUNCH_FOOD_TYPES,
    dinner: DINNER_FOOD_TYPES,
    lateNight: LATE_NIGHT_FOOD_TYPES,
  };

  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const targets = FOOD_TYPE_TARGETS[slot];
    for (const foodType of slotFoodTypes[slot]) {
      const target = targets[foodType] ?? 0;
      const current = countFoodTypeInSlot(entries, slot, foodType);
      rows.push({
        foodType,
        slot,
        current,
        target,
        gap: Math.max(0, target - current),
      });
    }
  }

  return rows.sort((a, b) => b.gap - a.gap);
}

export function totalExpansionGap070(entries: MealTimeFitResult[]): number {
  return buildMealTimePoolSummary(entries).reduce((sum, s) => sum + Math.max(0, s.gap070), 0);
}

export { foodTypeSlotAffinity, FOOD_TYPE_TARGETS };
