import type { PreferenceSeason } from './preference';
import type { SituationTag, WeatherTag } from './mealIntelligence';
import type { MealTimeSlot } from './mealTime';

/** Structured attributes every MAIN meal carries for HMIE scoring. */
export const MEAL_DNA_COOKING_TIME = ['quick', 'moderate', 'slow'] as const;
export type MealDnaCookingTime = (typeof MEAL_DNA_COOKING_TIME)[number];

export const MEAL_DNA_HEALTH = ['light', 'balanced', 'hearty', 'indulgent'] as const;
export type MealDnaHealth = (typeof MEAL_DNA_HEALTH)[number];

export const MEAL_DNA_CATEGORIES = [
  'korean',
  'japanese',
  'chinese',
  'western',
  'rice',
  'noodle',
  'soup',
  'stew',
  'grill',
  'instant',
  'salad',
  'delivery',
] as const;
export type MealDnaCategory = (typeof MEAL_DNA_CATEGORIES)[number];

export type MealDNA = {
  weather: WeatherTag[];
  season: PreferenceSeason[];
  time: MealTimeSlot[];
  situation: SituationTag[];
  cookingTime: MealDnaCookingTime;
  health: MealDnaHealth;
  category: MealDnaCategory;
  /** Sprint 45.5 — IIE canonical ingredient names. */
  canonicalIngredients?: string[];
};

/** What today calls for — derived from live situation before scoring. */
export type SituationDNA = {
  weather: WeatherTag[];
  season: PreferenceSeason[];
  time: MealTimeSlot[];
  situation: SituationTag[];
  preferredCookingTime: MealDnaCookingTime[];
  preferredHealth: MealDnaHealth[];
};

export const MEAL_DNA_DIMENSION_WEIGHTS = {
  weather: 14,
  season: 8,
  time: 16,
  situation: 12,
  cookingTime: 10,
  health: 8,
  category: 6,
} as const;
