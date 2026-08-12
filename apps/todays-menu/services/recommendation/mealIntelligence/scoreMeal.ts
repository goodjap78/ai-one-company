import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import { scoreSmartRecommendation } from './smartRecommendationScore';

/** Sprint 21 — score-based recommendation (Sprint 21.5 weighted engine). */
export function scoreMeal(
  menu: MenuItem,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): MealScoreBreakdown {
  return scoreSmartRecommendation(menu, situation, context);
}
