import type { MealScoreBreakdown } from '../../../types/mealIntelligenceEngine';
import type { RecommendationContext } from '../../../types/preference';
import type { MenuItem } from '../../../types/recommendation';
import { buildMealHistoryReasonCopy } from './buildMealHistoryReasonCopy';

/**
 * Sprint 39 — simple memory-based explanation lines.
 * No health diagnosis, no mood inference, no algorithm language.
 */
export function buildMemoryReasonCopy(
  breakdown: MealScoreBreakdown,
  context?: RecommendationContext,
  menu?: MenuItem,
): string | null {
  const notes = new Set(breakdown.notes);

  if (menu) {
    const historyCopy = buildMealHistoryReasonCopy(menu, context, notes);
    if (historyCopy) return historyCopy;
  }

  const recentCount =
    context?.foodMemory?.meals.length ?? context?.recentMeals?.length ?? 0;

  if (notes.has('memory_variety') || notes.has('memory_category_repeat')) {
    return '같은 종류가 이어져서 조금 다르게 골라봤어요.';
  }
  if (notes.has('recent_same_cuisine')) {
    return '같은 종류는 잠깐 쉬어가고, 다른 한 끼로 준비했어요.';
  }
  if (notes.has('recent_same_meal')) {
    return '최근 드신 메뉴와 겹치지 않게 골라봤어요.';
  }
  if (notes.has('memory_skipped')) {
    return '아까 넘기셨던 메뉴 대신 다른 선택을 준비했어요.';
  }
  if (recentCount === 0) {
    return '처음이니, 편한 메뉴부터 챙겨드릴게요.';
  }
  if (recentCount > 0) {
    return '요즘 식사를 보고 준비했어요.';
  }

  return null;
}
