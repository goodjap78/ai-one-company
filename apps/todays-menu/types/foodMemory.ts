/**
 * Sprint 39 — Food Memory foundation.
 *
 * Long-term path:
 * 1. Recommend a meal
 * 2. Remember what the user accepted or ate
 * 3. Avoid repeating similar meals
 * 4. Recommend different and more balanced meals
 * 5. Later — health balance patterns (not medical diagnosis)
 * 6. Later — mood only when user explicitly provides mood input
 *
 * Sprint 39 scope: meal history, accepted/skipped history, repetition penalty,
 * variety bonus, simple memory-based explanation copy.
 *
 * Meal history is stored separately from conversation `lastRecommendation`.
 */

export type FoodMemoryCategory =
  | 'noodle'
  | 'soup'
  | 'stew'
  | 'rice'
  | 'meat'
  | 'salad'
  | 'delivery'
  | 'other';

export type FoodMemoryCuisine =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'western'
  | 'catalog';

/** Sprint 39 — active interaction outcomes. */
export type FoodMemoryOutcome = 'accepted' | 'skipped';

/** Reserved for future taste feedback — not used in Sprint 39 HMIE. */
export type FoodMemoryFutureOutcome = 'liked' | 'disliked';

/** One food-memory interaction — separate from recommendation session history. */
export type FoodMemoryEvent = {
  id: string;
  mealId: string;
  mealName: string;
  category: FoodMemoryCategory;
  cuisine: FoodMemoryCuisine;
  outcome: FoodMemoryOutcome;
  timestamp: string;
};

/** Accepted meal — denormalized slice for HMIE fast reads. */
export type FoodMemoryRecord = {
  mealId: string;
  mealName: string;
  category: FoodMemoryCategory;
  cuisine: FoodMemoryCuisine;
  timestamp: string;
};

/** Reserved — rolling preference scores (future sprint). */
export type FoodPreferenceScore = {
  mealId: string;
  mealName: string;
  score: number;
  accepted: number;
  skipped: number;
  liked: number;
  disliked: number;
  updatedAt: string;
};

/**
 * Future module slots — attach data here without changing RecommendationContext API.
 * Sprint 39: all slots empty.
 */
export type FoodMemoryExtensions = {
  /** Later: noodle-heavy, low-vegetable, protein gaps — not medical diagnosis. */
  healthBalance?: Record<string, unknown>;
  /** Later: macro/micro tracking. */
  nutrition?: Record<string, unknown>;
  /** Later: explicit user mood input only. */
  mood?: Record<string, unknown>;
  /** Later: meal calendar. */
  calendar?: Record<string, unknown>;
  /** Later: grocery lists. */
  grocery?: Record<string, unknown>;
  /** Later: meal kit pairing. */
  mealKit?: Record<string, unknown>;
};

/** Persisted store (AsyncStorage). */
export type FoodMemoryStore = {
  version: 2;
  events: FoodMemoryEvent[];
  /** Reserved for future preference scoring. */
  preferenceScores: Record<string, FoodPreferenceScore>;
  extensions: FoodMemoryExtensions;
};

/** Sprint 39 — repetition tags derived from accepted meal history. */
export type FoodMemoryTag =
  | 'recent_same_meal'
  | 'recent_same_cuisine'
  | 'recent_same_category';

export type FoodMemoryAnalysis = {
  tags: FoodMemoryTag[];
  categoryCounts: Partial<Record<FoodMemoryCategory, number>>;
  cuisineCounts: Partial<Record<FoodMemoryCuisine, number>>;
};

/**
 * Unified read model for HMIE — attached to RecommendationContext.
 * Recommendation API unchanged; snapshot contents may grow via extensions.
 */
export type FoodMemorySnapshot = {
  version: 2;
  /** Latest accepted meals (max 20). */
  meals: FoodMemoryRecord[];
  /** Recent accepted/skipped events. */
  recentEvents: FoodMemoryEvent[];
  analysis: FoodMemoryAnalysis;
  skippedMealIds: string[];
  analysisWindow: number;
  extensions: FoodMemoryExtensions;
  /** Reserved — stored preference scores (not required for Sprint 39 HMIE). */
  preferenceScores?: Record<string, FoodPreferenceScore>;
};

export type RecordFoodMemoryInput = {
  mealId: string;
  outcome: FoodMemoryOutcome;
};
