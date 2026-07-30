/**
 * Sprint R8 — Decision metadata for meal-decision fatigue (not UI).
 *
 * Nested under `decisionTags` so legacy `situation: string[]` stays compatible
 * with Home / Favorites / Recommendation adapters.
 */
export type DecisionMealTime = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export type DecisionMood =
  | 'comfort'
  | 'happy'
  | 'stress'
  | 'lazy'
  | 'celebration'
  | 'healthy';

export type DecisionSituation =
  | 'alone'
  | 'family'
  | 'couple'
  | 'kids'
  | 'guest';

export type DecisionTimeRequired = 10 | 20 | 30 | 40 | 60;

export type DecisionBudget = 'low' | 'medium' | 'high';

export type DecisionDifficulty = 'easy' | 'normal' | 'hard';

export type DecisionWeather = 'hot' | 'cold' | 'rain' | 'snow' | 'any';

export type DecisionSeason =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'any';

/** Structured tags the AI uses to decide if a recipe fits the user. */
export type RecipeDecisionTags = {
  mealTime: DecisionMealTime[];
  mood: DecisionMood[];
  situation: DecisionSituation[];
  timeRequired: DecisionTimeRequired;
  budget: DecisionBudget;
  difficultyLevel: DecisionDifficulty;
  weather: DecisionWeather[];
  season: DecisionSeason[];
  /** Suitable for children. */
  kidFriendly: boolean;
  /** 0 none → 3 very spicy. */
  spicyLevel: 0 | 1 | 2 | 3;
};

/** Optional overrides when authoring / scaffolding recipes. */
export type RecipeDecisionInput = {
  decisionTags?: Partial<RecipeDecisionTags> & {
    mealTime?: DecisionMealTime[];
    mood?: DecisionMood[];
    situation?: DecisionSituation[];
    weather?: DecisionWeather[];
    season?: DecisionSeason[];
    kidFriendly?: boolean;
    spicyLevel?: 0 | 1 | 2 | 3;
  };
  recommendationReasons?: string[];
  searchTags?: string[];
  recommendationPriority?: number;
};
