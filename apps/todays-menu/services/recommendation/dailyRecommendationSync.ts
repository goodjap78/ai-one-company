/**
 * Sprint 57 — pure daily recommendation restore vs generate decisions.
 */
import type { HomeRecommendationDTO, MealMode, MealType } from '../../types/home';
import type { RecommendationSession } from '../recommendationSession';
import {
  type DailyRecommendationState,
  isValidHomeRecommendationDto,
} from './dailyRecommendationStorage';

export type DailyRecommendationSyncResult =
  | {
      action: 'restore';
      mealMode: MealMode;
      recommendation: HomeRecommendationDTO;
      source: 'persisted' | 'session';
    }
  | {
      action: 'generate';
      mealMode: MealMode;
      excludeRecipeId?: string;
    };

export function resolveDailyRecommendationSync(input: {
  dateKey: string;
  mealType: MealType;
  defaultMealMode: MealMode;
  persisted: DailyRecommendationState | null;
  session: RecommendationSession | null;
}): DailyRecommendationSyncResult {
  const { dateKey, mealType, defaultMealMode, persisted, session } = input;

  if (
    persisted &&
    persisted.dateKey === dateKey &&
    persisted.mealType === mealType &&
    isValidHomeRecommendationDto(persisted.recommendation)
  ) {
    return {
      action: 'restore',
      mealMode: persisted.mealMode,
      recommendation: persisted.recommendation,
      source: 'persisted',
    };
  }

  if (
    session?.recommendation &&
    session.dateKey === dateKey &&
    session.mealType === mealType &&
    session.mealMode !== 'delivery' &&
    isValidHomeRecommendationDto(session.recommendation)
  ) {
    return {
      action: 'restore',
      mealMode: session.mealMode,
      recommendation: session.recommendation,
      source: 'session',
    };
  }

  const excludeRecipeId =
    persisted && persisted.dateKey !== dateKey ? persisted.recipeId : undefined;

  return {
    action: 'generate',
    mealMode: defaultMealMode,
    excludeRecipeId,
  };
}
