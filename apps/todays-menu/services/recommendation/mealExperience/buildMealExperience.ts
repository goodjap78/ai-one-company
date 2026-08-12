import type { MenuItem, RecommendationRequest } from '../../../types/recommendation';
import type { MealExperienceRecommendation } from '../../../types/mealExperience';
import type { AiRecommendationReason } from '../../../utils/recommendationDisplayReason';
import { buildExperienceContext } from './buildExperienceContext';
import { buildSuggestedPairings } from './buildSuggestedPairings';
import { resolveMealStyle } from './resolveMealStyle';

export type BuildMealExperienceInput = {
  menu: MenuItem;
  request?: RecommendationRequest;
  reasonSignals?: AiRecommendationReason[];
};

/**
 * Meal Experience Engine v1.0
 * Structures a complete meal recommendation: Meal + Reason + Experience + Pairings.
 */
export function buildMealExperience(input: BuildMealExperienceInput): MealExperienceRecommendation {
  const { menu, reasonSignals = [] } = input;
  const mealStyle = resolveMealStyle(menu);
  const experience = buildExperienceContext(menu, mealStyle);
  const suggestedPairings = buildSuggestedPairings(menu);

  const signals =
    reasonSignals.length > 0
      ? reasonSignals
      : [{ emoji: '💡', text: menu.aiReason }];

  return {
    meal: {
      id: menu.id,
      title: menu.title,
      subtitle: menu.subtitle,
      mealStyle,
    },
    reason: {
      summary: signals[0]?.text ?? menu.aiReason,
      signals,
    },
    experience,
    suggestedPairings,
  };
}
