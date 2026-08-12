import type { MealDNA } from '../../types/mealDna';

/**
 * Canonical Meal DNA for flagship MAIN meals.
 * HMIE scores recommendations from these structured attributes.
 */
export const MEAL_DNA_REGISTRY: Record<string, MealDNA> = {
  gold_kr_kimchi_jjigae: {
    weather: ['rain', 'cold'],
    season: ['autumn', 'winter', 'spring'],
    time: ['LUNCH', 'DINNER', 'LATE_NIGHT'],
    situation: ['home', 'family', 'alone'],
    cookingTime: 'moderate',
    health: 'hearty',
    category: 'stew',
    canonicalIngredients: ['김치', '돼지고기', '두부', '대파', '고춧가루'],
  },
  gold_kr_samgyeopsal: {
    weather: ['rain', 'cold'],
    season: ['autumn', 'winter', 'spring'],
    time: ['DINNER', 'LATE_NIGHT'],
    situation: ['home', 'family', 'friends', 'weekend'],
    cookingTime: 'slow',
    health: 'hearty',
    category: 'grill',
  },
  gold_kr_jeyuk_bokkeum: {
    weather: ['humid'],
    season: ['spring', 'summer', 'autumn', 'winter'],
    time: ['LUNCH', 'DINNER'],
    situation: ['home', 'family', 'alone'],
    cookingTime: 'quick',
    health: 'hearty',
    category: 'rice',
    canonicalIngredients: ['돼지고기', '양파', '대파', '고추장', '고춧가루', '간장', '마늘'],
  },
  gold_kr_bibimbap: {
    weather: ['hot'],
    season: ['spring', 'summer', 'autumn'],
    time: ['LUNCH', 'DINNER'],
    situation: ['home', 'family', 'alone'],
    cookingTime: 'moderate',
    health: 'light',
    category: 'rice',
  },
  gold_kr_jjapaghetti: {
    weather: ['rain'],
    season: ['spring', 'summer', 'autumn', 'winter'],
    time: ['LUNCH', 'DINNER', 'LATE_NIGHT'],
    situation: ['home', 'alone', 'weekend'],
    cookingTime: 'quick',
    health: 'indulgent',
    category: 'instant',
  },
  gold_c_jajangmyeon: {
    weather: [],
    season: ['spring', 'summer', 'autumn', 'winter'],
    time: ['LUNCH', 'DINNER'],
    situation: ['delivery', 'family', 'alone'],
    cookingTime: 'moderate',
    health: 'balanced',
    category: 'noodle',
  },
  gold_c_jjamppong: {
    weather: ['rain', 'cold'],
    season: ['autumn', 'winter', 'spring'],
    time: ['LUNCH', 'DINNER', 'LATE_NIGHT'],
    situation: ['delivery', 'alone'],
    cookingTime: 'moderate',
    health: 'hearty',
    category: 'soup',
  },
  gold_c_malatang: {
    weather: ['cold'],
    season: ['autumn', 'winter'],
    time: ['DINNER', 'LATE_NIGHT'],
    situation: ['delivery', 'friends', 'couple'],
    cookingTime: 'moderate',
    health: 'indulgent',
    category: 'delivery',
  },
};

export function getRegisteredMealDna(mealId: string): MealDNA | null {
  return MEAL_DNA_REGISTRY[mealId] ?? null;
}

export function listRegisteredMealDnaIds(): string[] {
  return Object.keys(MEAL_DNA_REGISTRY);
}
