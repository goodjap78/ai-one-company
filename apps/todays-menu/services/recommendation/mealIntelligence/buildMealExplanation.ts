import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type {
  ExplanationFactorCategory,
  MealExplanation,
  MealExplanationLevel2Reason,
} from '../../../types/mealExplanation';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import { buildHealthReasonCopy } from '../../healthMemory';
import { buildContextReasonCopy } from './buildContextReasonCopy';
import { buildMemoryReasonCopy } from './buildMemoryReasonCopy';
import { buildNaturalRecommendationSentence } from './buildNaturalRecommendationSentence';
import {
  buildRecommendationFragments,
  isQuickMeal,
  labelFor,
  mealSlotLabel,
} from './buildRecommendationFragments';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from './mealKnowledge';
import { classifyMealArchetypes } from './mealProfile';
import { scoreToConfidence } from './buildIntelligenceReasons';
import { resolveReasonCopy } from './buildSignalReasonCopy';
import { buildReasonSeed, pickReasonVariant } from './recommendationReasonRotation';
import { menuToFoodMemoryCategory } from '../../memory/foodMemory';
import { resolveEntryCategory } from '../../MealHistoryService';

const WARM_CLOSINGS = [
  '맛있게 드세요',
  '오늘도 든든한 하루 보내세요',
  '오늘도 편하게 한 끼 드세요',
  '배고플 때 또 불러주세요',
] as const;

const LEVEL2_TITLES: Record<ExplanationFactorCategory, string> = {
  weather: '오늘 날씨',
  recentMeals: '요즘 식사',
  time: '이 시간대',
};

const LEVEL2_EMOJI: Record<ExplanationFactorCategory, string> = {
  weather: '☀️',
  recentMeals: '🍚',
  time: '⚡',
};

function pickWarmClosing(menu: MenuItem, situation: MealSituationSnapshot): string {
  const seed =
    menu.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) +
    situation.hourOfDay +
    situation.mealType.length;
  return WARM_CLOSINGS[seed % WARM_CLOSINGS.length];
}

function buildSmartLevel2(breakdown: MealScoreBreakdown): MealExplanationLevel2Reason[] | null {
  const hits = breakdown.smartReasons;
  if (!hits?.length) return null;

  const bestByCategory = new Map<ExplanationFactorCategory, (typeof hits)[number]>();
  for (const hit of hits) {
    if (hit.category === 'personalization') continue;
    const existing = bestByCategory.get(hit.category);
    if (!existing || hit.points > existing.points) {
      bestByCategory.set(hit.category, hit);
    }
  }

  const order: ExplanationFactorCategory[] = ['weather', 'recentMeals', 'time'];
  const level2 = order
    .map((category) => bestByCategory.get(category))
    .filter((hit): hit is NonNullable<typeof hit> => Boolean(hit))
    .map((hit) => {
      const category = hit.category as ExplanationFactorCategory;
      return {
        category,
        emoji: LEVEL2_EMOJI[category],
        label: LEVEL2_TITLES[category],
        text: hit.label,
      };
    });

  return level2.length > 0 ? level2 : null;
}

function buildWeatherReason(
  menu: MenuItem,
  situation: MealSituationSnapshot,
  seed: number,
): string {
  const title = menu.title;
  const { weather } = situation;
  const archetypes = classifyMealArchetypes(menu);

  if (isRainy(weather)) {
    return pickReasonVariant(
      [
        { key: 'weather_rain_1', text: `비가 와서 ${title} 같은 따뜻한 한 끼가 생각나요.` },
        { key: 'weather_rain_2', text: `비 오는 날엔 ${title}이 잘 어울려요.` },
        { key: 'weather_rain_3', text: `촉촉한 날씨에 ${title}이 딱이에요.` },
      ],
      seed,
    ).text;
  }

  if (isTemperatureFatigue(weather) || isVeryHot(weather)) {
    if (title.includes('비빔') || archetypes.includes('cold_meal')) {
      return pickReasonVariant(
        [
          { key: 'weather_hot_light_1', text: `더운 날엔 ${title}처럼 가볍게 즐기기 좋아요.` },
          { key: 'weather_hot_light_2', text: `날씨가 더워서 ${title}이 상큼하게 느껴져요.` },
          { key: 'weather_hot_light_3', text: `오늘은 덥기 때문에 ${title}이 잘 맞아요.` },
        ],
        seed + 1,
      ).text;
    }
    return pickReasonVariant(
      [
        { key: 'weather_hot_1', text: `오늘은 무겁지 않게, ${title}이 잘 맞아요.` },
        { key: 'weather_hot_2', text: `더운 날씨라 ${title}이 부담 없어요.` },
        { key: 'weather_hot_3', text: `날씨가 덥고, ${title}이 가볍게 느껴져요.` },
      ],
      seed + 1,
    ).text;
  }

  if (isCold(weather)) {
    return pickReasonVariant(
      [
        { key: 'weather_cold_1', text: `쌀쌀해서 ${title}처럼 따뜻한 한 끼가 좋겠어요.` },
        { key: 'weather_cold_2', text: `추운 날엔 ${title}이 든든하게 느껴져요.` },
        { key: 'weather_cold_3', text: `날씨가 쌀쌀해 ${title}이 잘 맞아요.` },
      ],
      seed + 2,
    ).text;
  }

  return pickReasonVariant(
    [
      { key: 'weather_mild_1', text: '오늘은 가볍게 드시기 좋은 날이에요.' },
      { key: 'weather_mild_2', text: '날씨가 편해서 어떤 한 끼든 잘 어울려요.' },
      { key: 'weather_mild_3', text: '오늘 날씨엔 부담 없는 한 끼가 좋아요.' },
    ],
    seed + 3,
  ).text;
}

function buildRecentMealsReason(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context: RecommendationContext | undefined,
  seed: number,
): string {
  const contextCopy = buildContextReasonCopy(breakdown);
  if (contextCopy) return contextCopy;

  const healthCopy = buildHealthReasonCopy(breakdown);
  if (healthCopy) return healthCopy;

  const memoryCopy = buildMemoryReasonCopy(breakdown, context, menu);
  if (memoryCopy) return memoryCopy.replace(/\n/g, ' ');

  const notes = new Set(breakdown.notes);
  const fragments = buildRecommendationFragments(menu, breakdown, situation, context);

  if (fragments.historyClause) {
    const menuCategory = menuToFoodMemoryCategory(menu);
    const recentCategory = context?.recentMeals?.[0]
      ? resolveEntryCategory(context.recentMeals[0])
      : null;

    if (notes.has('history_category_variety') && recentCategory && recentCategory !== menuCategory) {
      return pickReasonVariant(
        [
          {
            key: 'recent_diversity_1',
            text: `최근 ${labelFor(recentCategory)} 대신 ${labelFor(menuCategory)}로 바꿔봤어요.`,
          },
          {
            key: 'recent_diversity_2',
            text: `요즘 ${labelFor(recentCategory)}가 이어져서 ${labelFor(menuCategory)}를 골랐어요.`,
          },
          {
            key: 'recent_diversity_3',
            text: `같은 종류를 쉬어가며 ${labelFor(menuCategory)}를 추천해요.`,
          },
        ],
        seed + 4,
      ).text;
    }

    return pickReasonVariant(
      [
        { key: 'recent_history_1', text: `${fragments.historyClause.replace(/,$/, '')} 오늘은 이 메뉴가 좋아요.` },
        { key: 'recent_history_2', text: `${fragments.historyClause.replace(/,$/, '')} 다른 한 끼로 준비했어요.` },
        { key: 'recent_history_3', text: `최근 식사 흐름을 보고 ${menu.title}을 골랐어요.` },
      ],
      seed + 5,
    ).text;
  }

  if (notes.has('favorite')) {
    return pickReasonVariant(
      [
        { key: 'recent_favorite_1', text: '마음에 두셨던 메뉴예요.' },
        { key: 'recent_favorite_2', text: '찜해두신 메뉴라 다시 꺼내봤어요.' },
      ],
      seed + 6,
    ).text;
  }

  if (notes.has('dna_cuisine') || notes.has('dna_taste')) {
    return pickReasonVariant(
      [
        { key: 'recent_dna_1', text: '평소 좋아하시는 맛이에요.' },
        { key: 'recent_dna_2', text: '입맛에 맞는 쪽으로 골랐어요.' },
      ],
      seed + 7,
    ).text;
  }

  if (notes.has('variety_next')) {
    return pickReasonVariant(
      [
        { key: 'recent_variety_1', text: '요즘 드신 것과 달라요.' },
        { key: 'recent_variety_2', text: '최근 메뉴와 겹치지 않게 골랐어요.' },
      ],
      seed + 8,
    ).text;
  }

  if (notes.has('variety_repeat')) {
    return pickReasonVariant(
      [
        { key: 'recent_repeat_1', text: '익숙한 맛이라 편하게 드실 수 있어요.' },
        { key: 'recent_repeat_2', text: '자주 드시는 쪽이라 편할 거예요.' },
      ],
      seed + 9,
    ).text;
  }

  return pickReasonVariant(
    [
      { key: 'recent_default_1', text: '요즘 식사를 보고 준비했어요.' },
      { key: 'recent_default_2', text: '오늘은 이게 좋겠어요.' },
    ],
    seed + 10,
  ).text;
}

function buildTimeReason(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  seed: number,
): string {
  const notes = new Set(breakdown.notes);
  const slot = mealSlotLabel(situation.mealType);
  const quick = isQuickMeal(menu, notes);

  if (situation.mealMode === 'delivery') {
    return pickReasonVariant(
      [
        { key: 'time_delivery_1', text: `${slot}에 외식·포장하기 좋아요.` },
        { key: 'time_delivery_2', text: `${slot} 시간에 배달·포장이 편해요.` },
      ],
      seed + 11,
    ).text;
  }

  if (quick) {
    return pickReasonVariant(
      [
        {
          key: 'time_quick_1',
          text: `${slot}에 ${menu.cookTime}분이면 준비할 수 있어요.`,
        },
        { key: 'time_quick_2', text: `${slot} 시간에 금방 만들 수 있어요.` },
        { key: 'time_quick_3', text: `이 시간대에 부담 없이 ${menu.cookTime}분이면 돼요.` },
      ],
      seed + 12,
    ).text;
  }

  if (situation.mealType === 'late_night') {
    return pickReasonVariant(
      [
        { key: 'time_late_1', text: '늦은 시간에도 부담 없어요.' },
        { key: 'time_late_2', text: `야식으로 ${menu.cookTime}분이면 준비돼요.` },
      ],
      seed + 13,
    ).text;
  }

  if (situation.mealType === 'dinner') {
    return pickReasonVariant(
      [
        { key: 'time_dinner_1', text: '저녁에 든든하게 즐기기 좋아요.' },
        { key: 'time_dinner_2', text: `저녁 시간에 ${menu.cookTime}분이면 충분해요.` },
      ],
      seed + 14,
    ).text;
  }

  if (situation.mealType === 'lunch') {
    return pickReasonVariant(
      [
        { key: 'time_lunch_1', text: '점심에 잘 어울려요.' },
        { key: 'time_lunch_2', text: `점심 시간에 ${menu.cookTime}분이면 준비돼요.` },
      ],
      seed + 15,
    ).text;
  }

  if (situation.mealType === 'breakfast') {
    return pickReasonVariant(
      [
        { key: 'time_breakfast_1', text: '아침에 가볍게요.' },
        { key: 'time_breakfast_2', text: `아침에 ${menu.cookTime}분이면 충분해요.` },
      ],
      seed + 16,
    ).text;
  }

  return pickReasonVariant(
    [
      { key: 'time_default_1', text: '지금 시간에 잘 맞아요.' },
      { key: 'time_default_2', text: `이 시간대에 ${menu.cookTime}분이면 준비할 수 있어요.` },
    ],
    seed + 17,
  ).text;
}

function buildLevel2(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context: RecommendationContext | undefined,
  rank: number,
): MealExplanationLevel2Reason[] {
  const copy = resolveReasonCopy(menu, breakdown, situation, context);
  const seed = buildReasonSeed(menu.id, situation.hourOfDay, rank, breakdown.notes.length);

  return [
    {
      category: 'weather',
      emoji: '🌤',
      label: '오늘 날씨',
      text: buildWeatherReason(menu, situation, seed),
    },
    {
      category: 'recentMeals',
      emoji: '🍚',
      label: '요즘 식사',
      text: buildRecentMealsReason(menu, breakdown, situation, context, seed),
    },
    {
      category: 'time',
      emoji: '🕐',
      label: copy.timeLabel,
      text: buildTimeReason(menu, breakdown, situation, seed),
    },
  ];
}

export type BuildMealExplanationInput = {
  menu: MenuItem;
  breakdown: MealScoreBreakdown;
  situation: MealSituationSnapshot;
  context?: RecommendationContext;
  rank: number;
  totalCandidates: number;
};

/** Sprint 21 — smart score reasons drive trust cards when available. */
export function buildMealExplanation(input: BuildMealExplanationInput): MealExplanation {
  const { menu, breakdown, situation, context, rank, totalCandidates } = input;
  const copy = resolveReasonCopy(menu, breakdown, situation, context);
  const confidence = scoreToConfidence(breakdown.total);
  const todayMatchPercent = Math.round(confidence * 100);
  const smartLevel2 = buildSmartLevel2(breakdown);

  const level1 =
    situation.mood !== null
      ? copy.headline
      : buildNaturalRecommendationSentence(menu, breakdown, situation, context, rank);

  return {
    level1,
    level2: smartLevel2 ?? buildLevel2(menu, breakdown, situation, context, rank),
    level3: {
      todayMatchPercent,
      rank,
      totalCandidates,
      warmMatchLabel: copy.warmMatchLabel,
    },
    closing: pickWarmClosing(menu, situation),
  };
}
