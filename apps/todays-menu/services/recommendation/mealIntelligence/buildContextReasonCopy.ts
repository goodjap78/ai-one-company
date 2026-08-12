import type { MealScoreBreakdown } from '../../../types/mealIntelligenceEngine';

/**
 * Sprint 41 — one warm sentence when context scoring matched.
 * Only shown when explicit context influenced the score.
 */
export function buildContextReasonCopy(breakdown: MealScoreBreakdown): string | null {
  const notes = new Set(breakdown.notes);

  if (notes.has('context_combo_alone_quick') || notes.has('context_goal_quick')) {
    return '오늘은 빠르게 해결하기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('context_combo_family_filling') || notes.has('context_family_meal')) {
    return '함께 나누기 좋은 든든한 한 끼예요.';
  }
  if (notes.has('context_combo_partner_date') || notes.has('context_partner_meal')) {
    return '둘이 함께하기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('context_goal_warm') || notes.has('context_mood_sick_gentle')) {
    return '따뜻하게 몸을 챙기기 좋은 메뉴예요.';
  }
  if (notes.has('context_goal_refreshing')) {
    return '산뜻하게 즐기기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('context_mood_tired_easy')) {
    return '오늘은 부담 없이 준비하기 좋은 메뉴예요.';
  }
  if (notes.has('context_goal_light')) {
    return '가볍게 드시기 좋은 메뉴로 골라봤어요.';
  }
  if (notes.has('context_work_quick')) {
    return '바쁜 하루에도 빠르게 챙기기 좋아요.';
  }
  if (notes.has('context_friends_share')) {
    return '함께 나누기 좋은 메뉴로 골라봤어요.';
  }

  return null;
}
