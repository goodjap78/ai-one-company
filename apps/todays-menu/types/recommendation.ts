import type { RecipeTagId } from '../recipes/types';
import type { HomeRecommendationDTO, MealMode, MealType } from './home';
import type { MealCourseType } from './mealCourse';
import type { MealPurpose, SituationTag, WeatherTag } from './mealIntelligence';
import type { MealTimeSlot } from './mealTime';
import type { MealStyle } from './mealStyle';
import type { RecommendationContext } from './preference';
import type { AiRecommendationReason } from '../utils/recommendationDisplayReason';
import type { MealDNA } from './mealDna';

export type MenuBadge = HomeRecommendationDTO['badges'][number];

/** Catalog entry backing today's recommendation and recipe detail. */
export type MenuItem = {
  id: string;
  mode: MealMode;
  type: MealCourseType;
  mealStyle?: MealStyle;
  title: string;
  subtitle: string;
  mealTime: MealTimeSlot[];
  cookTime: number;
  difficulty: 'easy' | 'normal' | 'hard';
  aiReason: string;
  tags: RecipeTagId[];
  badges: MenuBadge[];
  honeyTip?: string;
  mealPurpose?: MealPurpose[];
  weatherTags?: WeatherTag[];
  situationTags?: SituationTag[];
  experienceLabel?: string;
  /** Future: paired 반찬 IDs shown after a MAIN meal is accepted. */
  recommendedSides?: string[];
  /** Non-catalog pairing names (e.g. beverage add-ons for delivery). */
  suggestedPairingNames?: string[];
  /** Sprint 26 — explainability signals from Gold Meal content. */
  confidenceReasons?: AiRecommendationReason[];
  /** Meal DNA — structured attributes for HMIE scoring. */
  mealDna?: MealDNA;
};

export type RecommendationRequest = {
  mealType: MealType;
  mealMode: MealMode;
  excludeMenuId?: string;
  /** HANKKI Brain context — favorites, meal history, conversation memory. */
  context?: RecommendationContext;
};

export type RecommendationEngine = {
  recommend: (request: RecommendationRequest) => HomeRecommendationDTO;
};
