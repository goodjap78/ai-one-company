import type { MealScoreBreakdown } from '../../types/mealIntelligenceEngine';

/**
 * Sprint 40 — warm health-balance copy (not medical).
 * Returns at most one sentence when a health scoring note is present.
 */
export function buildHealthReasonCopy(breakdown: MealScoreBreakdown): string | null {
  const notes = new Set(breakdown.notes);

  if (notes.has('health_meat_balance')) {
    return '최근 고기 메뉴가 많아서 오늘은 조금 가볍게 준비했어요.';
  }
  if (notes.has('health_noodle_balance')) {
    return '최근 면 요리가 이어져서 오늘은 밥 메뉴가 잘 어울려요.';
  }
  if (notes.has('health_soup_balance')) {
    return '최근 국물 요리가 이어져서 오늘은 담백하게 골라봤어요.';
  }
  if (notes.has('health_fried_balance')) {
    return '최근 무거운 메뉴가 많아서 오늘은 부담 없이 준비했어요.';
  }
  if (notes.has('health_spicy_balance')) {
    return '최근 매운 맛이 이어져서 오늘은 순하게 골라봤어요.';
  }
  if (notes.has('health_vegetable_balance')) {
    return '오늘은 채소를 함께 챙기기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('health_protein_balance')) {
    return '오늘은 든든하게 챙기기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('health_general_balance') || notes.has('health_heavy_repeat')) {
    return '부담 없이 균형 맞추기 좋은 한 끼예요.';
  }

  return null;
}
