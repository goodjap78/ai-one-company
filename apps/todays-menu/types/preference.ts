import type { AiRecommendationSettings } from './aiRecommendationSettings';
import type { RecipeEmotionId, RecipeTagId } from '../recipes/types';
import type { ContextMemorySnapshot } from './contextMemory';
import type { ConversationMemory } from './conversation';
import type { FoodMemorySnapshot } from './foodMemory';
import type { MealPlanningSnapshot } from './mealPlanning';
import type { PantryMatchIndex, PantrySnapshot } from './pantry';
import type { MealHistoryEntry } from './mealHistory';
import type { HealthMemorySnapshot } from '../services/healthMemory/healthMemoryTypes';
import type { Difficulty, MealType } from './home';
import type { MealSituationBase } from './mealIntelligenceEngine';
import type { MealTimeSlotKey } from './mealTimeRecommendation';
import type { ViewedRecipeEntry } from './viewedRecipeHistory';
import type { LightPersonalizationProfile } from './lightPersonalization';

/** Category from master DB, or `catalog` for menu-catalog items. */
export type PreferenceCategory =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'western'
  | 'dessert'
  | 'healthy'
  | 'baby'
  | 'snacks'
  | 'drinks'
  | 'catalog';

export type PreferenceSeason = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Long-term taste memory extracted from recipe metadata.
 * All fields except mealType are resolved automatically from recipe data.
 */
export type UserPreference = {
  recipeId: string;
  category: PreferenceCategory;
  mealType: MealType;
  difficulty: Difficulty;
  cookingTime: number;
  tags: RecipeTagId[];
  emotionTags: RecipeEmotionId[];
  season: PreferenceSeason;
  createdAt: string;
};

export type AddFavoriteInput = {
  recipeId: string;
  mealType: MealType;
};

export type AddFavoriteResult = {
  added: boolean;
  preference: UserPreference | null;
};

/** Aggregated taste signals for AI recommendation (structure only). */
export type PreferenceSummary = {
  favoriteCategories: PreferenceCategory[];
  favoriteMealTypes: MealType[];
  favoriteTags: RecipeTagId[];
  favoriteEmotionTags: RecipeEmotionId[];
  favoriteCookingTimes: number[];
  favoriteDifficulty: Difficulty[];
  favoriteSeasons: PreferenceSeason[];
  totalFavorites: number;
};

/**
 * Full context snapshot for the recommendation engine (HANKKI Brain).
 * Structure only — mock engine applies diversity rules; AI scoring comes later.
 */
export type RecommendationContext = {
  recentMeals: MealHistoryEntry[];
  /** Sprint 39 — denormalized meal history + analysis tags for HMIE. */
  foodMemory?: FoodMemorySnapshot;
  /** Sprint 40 — gentle meal-balance patterns from Food Memory + Meal DNA. */
  healthMemory?: HealthMemorySnapshot;
  /** Sprint 41 — explicit dining / goal / mood chips (never inferred). */
  contextMemory?: ContextMemorySnapshot;
  /** Sprint 42 — internal meal planning (Eat Now / Save). */
  mealPlanning?: MealPlanningSnapshot;
  /** Sprint 45 — pantry intelligence (simple ingredient records). */
  pantry?: PantrySnapshot;
  /** Sprint 45 — precomputed pantry overlap per menu id for HMIE. */
  pantryMatchByMenuId?: PantryMatchIndex;
  favorites: UserPreference[];
  favoriteRecipeIds: string[];
  preferenceDNA: PreferenceSummary;
  conversationMemory: ConversationMemory;
  /** Weather, weekday, mood — merged with mealType at recommend time. */
  situation?: MealSituationBase;
  /** Optional taste settings from My Page — never required for recommendations. */
  aiRecommendationSettings?: AiRecommendationSettings;
  /** Sprint 62-B — recently viewed recipe ids (detail screen visits). */
  viewedRecipeHistory?: ViewedRecipeEntry[];
  /** Sprint 62-C — derived taste profile for light personalization bonus. */
  lightPersonalizationProfile?: LightPersonalizationProfile;
  /** Sprint 59 — meal-time slot ranking layer (metadata fit × slot weights). */
  mealTimeRanking?: {
    targetSlot: MealTimeSlotKey;
    useClockWeights?: boolean;
    repeatPenaltyIds?: string[];
    /** Sprint 61-B — heroes shown in other slots this app session. */
    sessionShownIds?: string[];
    refreshGeneration?: number;
  };
};

/**
 * @deprecated Use `RecommendationContext`. Kept for backward compatibility.
 */
export type RecommendationPreferenceContext = RecommendationContext;

/** Metadata resolved from master recipe JSON or catalog fallback. */
export type ResolvedRecipeMetadata = {
  category: PreferenceCategory;
  difficulty: Difficulty;
  cookingTime: number;
  tags: RecipeTagId[];
  emotionTags: RecipeEmotionId[];
  season: PreferenceSeason;
};
