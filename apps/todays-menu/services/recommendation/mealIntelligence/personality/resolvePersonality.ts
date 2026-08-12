import type { RecommendationContext } from '../../../../types/preference';
import type {
  HankkiPersonalitySnapshot,
  TodayMoment,
  UserFeeling,
} from '../../../../types/hankkiPersonality';
import type { MealSituationSnapshot } from '../../../../types/mealIntelligenceEngine';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from '../mealKnowledge';

const MOMENT_PRIORITY: TodayMoment[] = [
  'late_night',
  'rainy',
  'hot',
  'cold',
  'weekend',
  'pleasant',
  'weekday',
];

const FEELING_PRIORITY: UserFeeling[] = [
  'comfort',
  'family',
  'tired',
  'busy',
  'lazy',
  'alone',
  'happy',
];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function resolveTodayMoments(situation: MealSituationSnapshot): TodayMoment[] {
  const moments: TodayMoment[] = [];
  const { weather } = situation;

  if (situation.mealType === 'late_night' || situation.hourOfDay >= 22) {
    moments.push('late_night');
  }
  if (isRainy(weather)) moments.push('rainy');
  if (isVeryHot(weather) || isTemperatureFatigue(weather)) moments.push('hot');
  if (isCold(weather)) moments.push('cold');
  if (situation.isWeekend) moments.push('weekend');
  else moments.push('weekday');

  if (moments.length === 0 || (!moments.includes('rainy') && !moments.includes('hot') && !moments.includes('cold'))) {
    moments.push('pleasant');
  }

  return unique(moments);
}

function resolvePrimaryMoment(moments: TodayMoment[]): TodayMoment {
  for (const moment of MOMENT_PRIORITY) {
    if (moments.includes(moment)) return moment;
  }
  return moments[0] ?? 'pleasant';
}

function inferFeelings(
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): UserFeeling[] {
  const feelings: UserFeeling[] = [];
  const { weather } = situation;
  const explicitContext = context?.contextMemory?.hasExplicitInput ?? false;

  if (situation.mood === 'tired') feelings.push('tired');
  if (situation.mood === 'happy') feelings.push('happy');

  if (isRainy(weather) || isCold(weather)) feelings.push('comfort');

  if (!explicitContext) {
    if (situation.mealType === 'late_night' || situation.hourOfDay >= 22) {
      feelings.push('tired', 'lazy', 'alone');
    }
    if (situation.mealType === 'lunch' && !situation.isWeekend) {
      feelings.push('busy', 'alone');
    }
    if (situation.mealMode === 'delivery') {
      feelings.push('lazy', 'busy');
    }
    if (situation.isWeekend && situation.mealType === 'dinner') {
      feelings.push('family', 'happy');
    }
    if (situation.isWeekend && situation.mealType === 'lunch') {
      feelings.push('family');
    }
    if (!situation.isWeekend && situation.mealType === 'dinner' && situation.hourOfDay >= 19) {
      feelings.push('alone', 'tired');
    }

    const recentCount = context?.recentMeals?.length ?? 0;
    if (recentCount === 0 && feelings.length === 0) {
      feelings.push('happy');
    }

    if (feelings.length === 0) feelings.push('happy');
  } else if (feelings.length === 0) {
    feelings.push('happy');
  }

  return unique(feelings);
}

function resolvePrimaryFeeling(feelings: UserFeeling[]): UserFeeling {
  for (const feeling of FEELING_PRIORITY) {
    if (feelings.includes(feeling)) return feeling;
  }
  return feelings[0] ?? 'happy';
}

/** Step 1–2: read today + infer how the user might feel. */
export function resolvePersonality(
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): HankkiPersonalitySnapshot {
  const todayMoments = resolveTodayMoments(situation);
  const feelings = inferFeelings(situation, context);

  return {
    todayMoments,
    feelings,
    primaryMoment: resolvePrimaryMoment(todayMoments),
    primaryFeeling: resolvePrimaryFeeling(feelings),
  };
}
