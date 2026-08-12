import type { MealType } from '../../../types/home';
import type { MealArchetype } from './mealProfile';

/** Sprint 32.2 — archetype-based situation scoring (points). */
export const HOT_WEATHER_ARCHETYPE: Partial<Record<MealArchetype, number>> = {
  cold_meal: 20,
  salad: 20,
  rice: 8,
  soup: -10,
  stew: -10,
  grill: -15,
  bbq: -15,
  hotpot: -15,
};

export const COLD_WEATHER_ARCHETYPE: Partial<Record<MealArchetype, number>> = {
  stew: 20,
  soup: 18,
  hotpot: 15,
  cold_meal: -12,
};

export const RAIN_ARCHETYPE: Partial<Record<MealArchetype, number>> = {
  soup: 15,
  stew: 15,
  jeon: 12,
  noodle: 10,
};

/** >32°C — heavy grill/hotpot fatigue */
export const TEMPERATURE_FATIGUE_KEYWORDS = {
  reduce: ['삼겹살', '곱창', '전골'],
  boost: ['냉면', '비빔국수', '샐러드', '메밀', '막국수'],
};

export const TEMPERATURE_FATIGUE_REDUCE = -15;
export const TEMPERATURE_FATIGUE_BOOST = 15;

export const MEAL_TIME_KEYWORDS: Record<
  MealType,
  { keywords: string[]; archetypes: MealArchetype[]; points: number }
> = {
  breakfast: {
    keywords: ['죽', '토스트', '샌드위치'],
    archetypes: ['breakfast', 'simple'],
    points: 15,
  },
  lunch: {
    keywords: ['비빔밥', '덮밥', '국수'],
    archetypes: ['rice', 'noodle'],
    points: 12,
  },
  dinner: {
    keywords: ['찌개', '고기', '파스타'],
    archetypes: ['stew', 'grill', 'pasta', 'bbq'],
    points: 12,
  },
  late_night: {
    keywords: ['컵라면', '죽', '라면', '짜파'],
    archetypes: ['simple', 'breakfast'],
    points: 12,
  },
};

export const WEEKDAY_QUICK_POINTS = 10;
export const WEEKDAY_QUICK_MAX_COOK_MIN = 25;

export const WEEKEND_FAMILY_POINTS = 15;
export const WEEKEND_BBQ_POINTS = 12;
export const WEEKEND_SPECIAL_POINTS = 10;

export const VARIETY_MATCH_POINTS = 14;
export const VARIETY_REPEAT_PENALTY = -12;

export const RECENT_SAME_MEAL_PENALTY = -35;
export const RECENT_SAME_CUISINE_PENALTY = -18;
export const FOOD_MEMORY_SAME_CATEGORY_PENALTY = -16;
export const FOOD_MEMORY_VARIETY_BONUS = 14;
export const FOOD_MEMORY_SKIPPED_PENALTY = -18;

/** Hour-of-day boosts (Factor 4). */
export const LATE_NIGHT_BOOST: { keyword: string; points: number }[] = [
  { keyword: '컵라면', points: 14 },
  { keyword: '라면', points: 12 },
  { keyword: '죽', points: 10 },
  { keyword: '짜파', points: 10 },
];

export const WORKDAY_LUNCH_BOOST: { keyword: string; points: number }[] = [
  { keyword: '비빔밥', points: 12 },
  { keyword: '덮밥', points: 10 },
  { keyword: '국수', points: 10 },
  { keyword: '볶음밥', points: 8 },
];

export function keywordMatch(title: string, keywords: string[]): boolean {
  return keywords.some((keyword) => title.includes(keyword));
}

export function sumArchetypePoints(
  archetypes: MealArchetype[],
  table: Partial<Record<MealArchetype, number>>,
): number {
  let total = 0;
  for (const archetype of archetypes) {
    const points = table[archetype];
    if (points !== undefined) total += points;
  }
  return total;
}
