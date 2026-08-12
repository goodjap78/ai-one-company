import type { ConversationMood } from './conversation';
import type { MealType } from './home';
import type { MealHistoryEntry } from './mealHistory';
import type { PreferenceCategory, PreferenceSummary } from './preference';
import type { CookingSkill } from './userProfile';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type MockWeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot';

export type MockWeather = {
  condition: MockWeatherCondition;
  temperatureC: number;
  emoji: string;
};

export type DailyChallengeId = 'eat_vegetables' | 'eat_soup' | 'try_new_menu';

export type DailyChallenge = {
  id: DailyChallengeId;
  title: string;
  description: string;
  emoji: string;
};

/**
 * Single daily snapshot for HANKKI Brain / future AI.
 * All briefing inputs are assembled here once per home load.
 */
export type TodayContext = {
  date: string;
  weekday: Weekday;
  weekdayLabel: string;
  mealTime: MealType;
  recentMeals: MealHistoryEntry[];
  streak: number;
  mood: ConversationMood | null;
  favoriteCategory: PreferenceCategory | null;
  nickname: string;
  weather: MockWeather;
  dailyChallenge: DailyChallenge;
  cookingSkill: CookingSkill;
  preferenceDNA: PreferenceSummary;
  favoriteRecipeIds: string[];
};

export type TodayBrief = {
  greeting: string;
  todaySummary: string;
  weatherSummary: string;
  recentMealSummary: string;
  recommendationHint: string;
  dailyChallenge: DailyChallenge;
  context: TodayContext;
};
