import type { MealType } from '../../../types/home';
import type { MenuItem } from '../../../types/recommendation';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import type { RecommendationContext } from '../../../types/preference';
import { buildMealHistoryReasonCopy } from './buildMealHistoryReasonCopy';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from './mealKnowledge';
import { classifyMealArchetypes } from './mealProfile';
import { buildPersonalityVoice, resolvePersonality } from './personality';

export type ReasonCopy = {
  headline: string;
  timeReason: string;
  warmMatchLabel: string;
  timeLabel: string;
};

function mealSlotLabel(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast':
      return '아침';
    case 'lunch':
      return '점심';
    case 'dinner':
      return '저녁';
    case 'late_night':
      return '야식';
  }
}

function isQuickMeal(menu: MenuItem, notes: Set<string>): boolean {
  return (
    menu.cookTime <= 20 ||
    notes.has('late_hour_quick') ||
    notes.has('lunch_hour_quick') ||
    notes.has('weekday_quick')
  );
}

/** Headline from weather, variety, meal mode, and cook-time signals only. */
export function buildSignalHeadline(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): string {
  const notes = new Set(breakdown.notes);
  const personalization = breakdown.smartReasons?.find(
    (hit) => hit.category === 'personalization' && hit.points > 0,
  );
  if (personalization) {
    return personalization.label;
  }

  const historyCopy = buildMealHistoryReasonCopy(menu, context, notes);
  if (historyCopy) {
    return historyCopy.replace(/\n/g, ' ');
  }

  const title = menu.title;
  const { weather } = situation;

  if (isRainy(weather)) return `비 오는 날, ${title} 어때요?`;
  if (isTemperatureFatigue(weather) || isVeryHot(weather)) {
    if (title.includes('비빔') || classifyMealArchetypes(menu).includes('cold_meal')) {
      return `더운 날, ${title} 어때요?`;
    }
    return `더운 날엔 ${title} 어때요?`;
  }
  if (isCold(weather)) return `쌀쌀한 날, ${title} 어때요?`;

  if (notes.has('favorite') || notes.has('dna_cuisine') || notes.has('dna_taste')) {
    return `${title}, 평소 입맛이에요.`;
  }
  if (notes.has('memory_variety') || notes.has('memory_category_repeat')) {
    return '요즘이랑 살짝 달라요.';
  }
  if (notes.has('variety_next') || notes.has('recent_same_cuisine')) {
    return '요즘이랑 살짝 달라요.';
  }
  if (situation.mealMode === 'delivery') {
    return `${title}, 외식·포장으로 편해요.`;
  }
  if (isQuickMeal(menu, notes)) {
    return `${title}, 금방 만들 수 있어요.`;
  }
  if (notes.has('weekend_family') || notes.has('weekend_bbq')) {
    return `${title}, 같이 먹기 좋아요.`;
  }

  return `오늘은 ${title} 어때요?`;
}

/** Time / cook-burden / meal-mode line — no inferred mood. */
export function buildSignalTimeReason(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
): string {
  const notes = new Set(breakdown.notes);
  const slot = mealSlotLabel(situation.mealType);

  if (isQuickMeal(menu, notes)) {
    return '오래 걸리지 않아요.';
  }
  if (situation.mealMode === 'delivery') {
    return `${slot}에 외식·포장하기 좋아요.`;
  }
  if (situation.mealType === 'late_night') {
    return '늦은 시간에도 부담 없어요.';
  }
  if (situation.mealType === 'dinner') {
    return '저녁에 딱이에요.';
  }
  if (situation.mealType === 'lunch') {
    return '점심에 잘 어울려요.';
  }
  if (situation.mealType === 'breakfast') {
    return '아침에 가볍게요.';
  }
  return '지금 시간에 잘 맞아요.';
}

/** Level-3 warm label from variety, cook burden, and meal mode. */
export function buildSignalWarmMatchLabel(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
): string {
  const notes = new Set(breakdown.notes);

  if (notes.has('memory_variety') || notes.has('memory_category_repeat')) {
    return '요즘이랑 살짝 달라요.';
  }
  if (notes.has('variety_next') || notes.has('recent_same_cuisine')) {
    return '익숙한 맛에서 살짝 바꿨어요.';
  }
  if (isQuickMeal(menu, notes)) {
    return '금방 만들 수 있어요.';
  }
  if (situation.mealMode === 'delivery') {
    return '외식·포장으로 편해요.';
  }
  if (situation.mealType === 'dinner') {
    return '저녁에 든든하게요.';
  }
  return '오늘 한 끼로 괜찮아요.';
}

/** Personality voice when mood was provided; otherwise signal-only copy. */
export function resolveReasonCopy(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): ReasonCopy {
  if (situation.mood !== null) {
    const personality = resolvePersonality(situation, context);
    const voice = buildPersonalityVoice(menu, personality, situation);
    return {
      headline: voice.headline,
      timeReason: voice.feelingHint,
      warmMatchLabel: voice.suggestion,
      timeLabel: '지금 기분',
    };
  }

  return {
    headline: buildSignalHeadline(menu, breakdown, situation, context),
    timeReason: buildSignalTimeReason(menu, breakdown, situation),
    warmMatchLabel: buildSignalWarmMatchLabel(menu, breakdown, situation),
    timeLabel: '이 시간대',
  };
}
