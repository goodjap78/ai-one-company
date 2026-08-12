import type { ConversationMemory } from '../../types/conversation';
import type { FoodMemoryEvent } from '../../types/foodMemory';
import type { MealHistoryEntry } from '../../types/mealHistory';
import type { UserProfile } from '../../types/userProfile';

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function isoNow(): string {
  return new Date().toISOString();
}

/** Dev seed — applied only when storage is empty. */
export const MOCK_USER_PROFILE: UserProfile = {
  nickname: '민수',
  familySize: 2,
  hasKids: false,
  cookingSkill: 'intermediate',
  preferredBudget: 'medium',
  spicyLevel: 'medium',
  allergies: [],
  favoriteCategories: ['korean'],
  dislikedIngredients: ['오이'],
  updatedAt: isoNow(),
};

export const MOCK_MEAL_HISTORY: MealHistoryEntry[] = [
  {
    id: 'meal_mock_001',
    recipeId: 'homemade_001',
    cookedDate: daysAgo(1),
    mealType: 'dinner',
    satisfaction: 'good',
    cookingTime: 20,
    createdAt: isoNow(),
  },
  {
    id: 'meal_mock_002',
    recipeId: 'homemade_003',
    cookedDate: daysAgo(2),
    mealType: 'lunch',
    satisfaction: 'loved',
    cookingTime: 15,
    createdAt: isoNow(),
  },
];

/** Dev seed for Food Memory — noodle-heavy accepted meals + one skip. */
export const MOCK_FOOD_MEMORY_EVENTS: FoodMemoryEvent[] = [
  {
    id: 'fm_mock_001',
    mealId: 'gold_kr_jjapaghetti',
    mealName: '짜파게티',
    category: 'noodle',
    cuisine: 'korean',
    outcome: 'accepted',
    timestamp: daysAgo(0) + 'T19:30:00.000Z',
  },
  {
    id: 'fm_mock_002',
    mealId: 'gold_c_jajangmyeon',
    mealName: '짜장면',
    category: 'noodle',
    cuisine: 'chinese',
    outcome: 'accepted',
    timestamp: daysAgo(1) + 'T12:15:00.000Z',
  },
  {
    id: 'fm_mock_003',
    mealId: 'gold_kr_kimchi_jjigae',
    mealName: '김치찌개',
    category: 'stew',
    cuisine: 'korean',
    outcome: 'accepted',
    timestamp: daysAgo(2) + 'T19:00:00.000Z',
  },
  {
    id: 'fm_mock_004',
    mealId: 'gold_kr_bibimbap',
    mealName: '비빔밥',
    category: 'rice',
    cuisine: 'korean',
    outcome: 'skipped',
    timestamp: daysAgo(0) + 'T11:00:00.000Z',
  },
];

export const MOCK_CONVERSATION_MEMORY: ConversationMemory = {
  mood: null,
  weather: null,
  lastGreeting: '오늘도 오셨네요 😊',
  lastRecommendation: 'homemade_001',
  conversationCount: 3,
  updatedAt: isoNow(),
};

export function createDefaultConversationMemory(): ConversationMemory {
  return {
    mood: null,
    weather: null,
    lastGreeting: null,
    lastRecommendation: null,
    conversationCount: 0,
    updatedAt: isoNow(),
  };
}

export function createDefaultUserProfile(nickname: string): UserProfile {
  return {
    nickname,
    familySize: 1,
    hasKids: false,
    cookingSkill: 'beginner',
    preferredBudget: 'medium',
    spicyLevel: 'mild',
    allergies: [],
    favoriteCategories: [],
    dislikedIngredients: [],
    updatedAt: isoNow(),
  };
}
