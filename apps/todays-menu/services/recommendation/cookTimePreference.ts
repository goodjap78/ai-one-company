import type { MaxCookTimePreference } from '../../types/aiRecommendationSettings';
import type { MenuItem } from '../../types/recommendation';
import type { RecommendationContext } from '../../types/preference';
import type { MealSituationSnapshot } from '../../types/mealIntelligenceEngine';
import { classifyMealArchetypes } from './mealIntelligence/mealProfile';

const COOK_TIME_FIT_MAX = {
  breakfast: 15,
  lunch: 25,
  dinner: 45,
  late_night: 20,
} as const;

function resolveMaxCookTimeMinutes(
  pref: MaxCookTimePreference | null | undefined,
): number | null {
  if (pref === '10') return 10;
  if (pref === '20') return 20;
  if (pref === '30') return 30;
  return null;
}

/** User explicitly chose a max cook time (not unset / any). */
export function hasExplicitCookTimePreference(context?: RecommendationContext): boolean {
  return resolveMaxCookTimeMinutes(context?.aiRecommendationSettings?.maxCookTime) !== null;
}

/** Minutes cap for hard filtering when the user set maxCookTime; otherwise null. */
export function explicitCookTimeLimitMinutes(context?: RecommendationContext): number | null {
  return resolveMaxCookTimeMinutes(context?.aiRecommendationSettings?.maxCookTime);
}

/** Soft-scoring limit: explicit pref, or meal-type default when unset. */
export function cookTimeLimit(
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): number {
  const pref = context?.aiRecommendationSettings?.maxCookTime;
  if (pref === '10') return 10;
  if (pref === '20') return 20;
  if (pref === '30') return 30;
  if (pref === 'any') return Number.POSITIVE_INFINITY;
  return COOK_TIME_FIT_MAX[situation.mealType];
}

/** Soft score bonus — breakfast archetype may exceed the limit. */
export function cookTimeFits(
  menu: MenuItem,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): boolean {
  const limit = cookTimeLimit(situation, context);
  if (menu.cookTime <= limit) return true;
  if (situation.mealType === 'breakfast' && classifyMealArchetypes(menu).includes('breakfast')) {
    return true;
  }
  return false;
}

/** Hard pool filter — strict when user set maxCookTime; no breakfast override. */
export function menuPassesCookTimeHardFilter(
  menu: MenuItem,
  context?: RecommendationContext,
): boolean {
  const limit = explicitCookTimeLimitMinutes(context);
  if (limit === null) return true;
  return menu.cookTime <= limit;
}
