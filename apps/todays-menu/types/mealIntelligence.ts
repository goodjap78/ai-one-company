/** Why someone chooses this meal — Meal Intelligence Database v1.0 */
export const MEAL_PURPOSES = [
  'comfort',
  'diet',
  'muscle',
  'healthy',
  'quick',
  'family',
  'kids',
  'baby',
  'recovery',
  'guest',
  'party',
  'camping',
  'lateNight',
] as const;

export type MealPurpose = (typeof MEAL_PURPOSES)[number];

export const SITUATION_TAGS = [
  'home',
  'delivery',
  'alone',
  'couple',
  'family',
  'friends',
  'office',
  'weekend',
  'holiday',
] as const;

export type SituationTag = (typeof SITUATION_TAGS)[number];

export const WEATHER_TAGS = ['hot', 'cold', 'rain', 'snow', 'humid'] as const;

export type WeatherTag = (typeof WEATHER_TAGS)[number];
