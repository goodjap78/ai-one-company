import type { FoodMemorySnapshot } from '../../types/foodMemory';
import type { MealDNA, MealDnaHealth } from '../../types/mealDna';

/** Gentle balance patterns — not medical diagnosis. */
export type HealthPatternTag =
  | 'recent_meat_heavy'
  | 'recent_noodle_heavy'
  | 'recent_soup_heavy'
  | 'recent_fried_heavy'
  | 'recent_spicy_heavy'
  | 'recent_low_vegetable'
  | 'recent_low_protein'
  | 'recent_repetitive_meals';

/** Category/DNA traits used for pattern detection. */
export type MealHealthTraits = {
  isMeat: boolean;
  isNoodle: boolean;
  isSoup: boolean;
  isFried: boolean;
  isSpicy: boolean;
  hasVegetable: boolean;
  hasProtein: boolean;
  isLight: boolean;
};

export type HealthMemoryAnalysis = {
  tags: HealthPatternTag[];
  windowSize: number;
  mealCount: number;
};

/** Read model for HMIE — built from Food Memory + Meal DNA. */
export type HealthMemorySnapshot = {
  version: 1;
  analysis: HealthMemoryAnalysis;
  /** Source meal ids in the analysis window. */
  mealIds: string[];
};

export type HealthMemoryScoreNote =
  | 'health_meat_balance'
  | 'health_noodle_balance'
  | 'health_soup_balance'
  | 'health_fried_balance'
  | 'health_spicy_balance'
  | 'health_vegetable_balance'
  | 'health_protein_balance'
  | 'health_general_balance'
  | 'health_heavy_repeat';

export type HealthMemoryScoreResult = {
  rawDelta: number;
  notes: string[];
};

export type HealthBalanceContext = {
  foodMemory?: FoodMemorySnapshot;
  healthMemory?: HealthMemorySnapshot;
};

/** Map Meal DNA health band to analysis helpers. */
export function isLightHealth(health: MealDnaHealth): boolean {
  return health === 'light';
}

export function isIndulgentHealth(health: MealDnaHealth): boolean {
  return health === 'indulgent' || health === 'hearty';
}
