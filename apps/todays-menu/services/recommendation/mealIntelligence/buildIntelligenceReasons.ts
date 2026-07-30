import type { MenuItem } from '../../../types/recommendation';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import type { AiRecommendationReason } from '../../../utils/recommendationDisplayReason';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from './mealKnowledge';
import { classifyMealArchetypes } from './mealProfile';
import { resolveReasonCopy } from './buildSignalReasonCopy';

function buildWhyToday(situation: MealSituationSnapshot): AiRecommendationReason {
  const { weather } = situation;

  if (isRainy(weather)) {
    return { emoji: '🌧️', text: '비 오는 날, 따뜻한 한 끼가 생각나요.' };
  }
  if (isTemperatureFatigue(weather) || isVeryHot(weather)) {
    return { emoji: weather.emoji || '☀️', text: '더운 날, 가볍게 먹기 좋아요.' };
  }
  if (isCold(weather)) {
    return { emoji: '🥶', text: '쌀쌀한 날, 몸을 녹이는 한 끼가 좋겠어요.' };
  }
  if (situation.isWeekend) {
    return { emoji: '🎉', text: '주말, 여유롭게 즐기기 좋은 날이에요.' };
  }
  return { emoji: weather.emoji || '🌤️', text: '오늘은 가볍게 드시기 좋은 날이에요.' };
}

function buildWhyThisMeal(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
): AiRecommendationReason {
  const notes = new Set(breakdown.notes);
  const title = menu.title;
  const archetypes = classifyMealArchetypes(menu);
  const { weather } = situation;
  const copy = resolveReasonCopy(menu, breakdown, situation);

  if (notes.has('favorite') || notes.has('dna_cuisine') || notes.has('dna_taste')) {
    return { emoji: '❤️', text: `${title}, 평소 취향에 맞아요.` };
  }
  if (isVeryHot(weather) && (archetypes.includes('cold_meal') || title.includes('비빔'))) {
    return { emoji: '🥗', text: copy.headline };
  }
  if (notes.has('weekend_family') || notes.has('weekend_bbq')) {
    return { emoji: '👨‍👩‍👧', text: `${title}, 함께 나눠 먹기 좋아요.` };
  }
  return { emoji: '✨', text: copy.headline };
}

function buildWhyNow(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
): AiRecommendationReason {
  const copy = resolveReasonCopy(menu, breakdown, situation);
  return { emoji: '🕐', text: copy.timeReason };
}

export function buildIntelligenceReasons(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
): AiRecommendationReason[] {
  return [
    buildWhyToday(situation),
    buildWhyThisMeal(menu, breakdown, situation),
    buildWhyNow(menu, breakdown, situation),
  ];
}

export function scoreToConfidence(score: number): number {
  return Math.min(0.97, Math.max(0.55, score / 100));
}
