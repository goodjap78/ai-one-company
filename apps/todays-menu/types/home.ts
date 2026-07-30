import type { MealExperienceRecommendation } from './mealExperience';
import type { RecommendationAlternative } from './mealIntelligenceEngine';
import type { MealExplanation } from './mealExplanation';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export type MealMode = 'homemade' | 'delivery';

export type BadgeType =
  | 'time'
  | 'ingredient'
  | 'nutrition'
  | 'family'
  | 'season'
  | 'weather';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type HomeRecommendationDTO = {
  recommendationId: string;
  mealMode: MealMode;
  chefMessage: string;
  reason: string;
  recipe: {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string | null;
    cookingTimeMinutes: number;
    difficulty: Difficulty;
  };
  badges: {
    label: string;
    type: BadgeType;
  }[];
  fallbackUsed: boolean;
  confidence: number;
  honeyTip?: string;
  /**
   * Sprint H3-13 — dynamic Seed tip under the food image (from recipe.recommendationMessages).
   */
  seedMessage?: string;
  /** Meal Experience Engine v1.0 — complete meal recommendation (not recipe-only). */
  mealExperience?: MealExperienceRecommendation;
  /** HMIE v1.0 — rank 2–3 alternatives for the same situation. */
  alternatives?: RecommendationAlternative[];
  /** Sprint 34 — three-level explainable recommendation. */
  explanation?: MealExplanation;
  /** True when no safe candidates remain after preference relaxation. */
  noCandidatesAvailable?: boolean;
};

export type AcceptRecommendationResponse = {
  mealHistoryId: string;
  recipeId: string;
  nextRoute: string;
};

export type SaveTasteResponse = {
  recipeId: string;
  saved: boolean;
  alreadySaved?: boolean;
};
