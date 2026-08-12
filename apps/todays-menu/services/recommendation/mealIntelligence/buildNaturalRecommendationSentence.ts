import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import {
  buildRecommendationFragments,
  koreanObjectParticle,
} from './buildRecommendationFragments';
import { buildReasonSeed, pickReasonVariant } from './recommendationReasonRotation';

type SentenceVariant = {
  key: string;
  text: string;
};

function buildSentenceVariants(
  menu: MenuItem,
  fragments: ReturnType<typeof buildRecommendationFragments>,
): SentenceVariant[] {
  const title = menu.title;
  const particle = koreanObjectParticle(title);
  const variants: SentenceVariant[] = [];

  const { weatherClause, historyClause, mealQuality } = fragments;

  if (weatherClause && historyClause) {
    variants.push({
      key: 'natural_weather_history',
      text: `오늘은 ${weatherClause}, ${historyClause} ${mealQuality} ${title}${particle} 추천합니다.`,
    });
    variants.push({
      key: 'natural_weather_history_alt',
      text: `${weatherClause}, ${historyClause} ${mealQuality} ${title}${particle} 골랐어요.`,
    });
  }

  if (weatherClause) {
    variants.push({
      key: 'natural_weather_only',
      text: `오늘은 ${weatherClause}, ${mealQuality} ${title}${particle} 추천합니다.`,
    });
    variants.push({
      key: 'natural_weather_only_alt',
      text: `${weatherClause}, ${mealQuality} ${title}${particle} 어떠세요?`,
    });
  }

  if (historyClause) {
    variants.push({
      key: 'natural_history_only',
      text: `${historyClause} ${mealQuality} ${title}${particle} 추천합니다.`,
    });
    variants.push({
      key: 'natural_history_only_alt',
      text: `${historyClause} 오늘은 ${title}${particle} 드시면 좋겠어요.`,
    });
  }

  if (fragments.isQuickCook) {
    variants.push({
      key: 'natural_quick_cook',
      text: `${fragments.mealTimeLabel}에 ${fragments.cookTimeMinutes}분이면 만들 수 있는 ${title}${particle} 추천합니다.`,
    });
  }

  if (fragments.diversityClause) {
    variants.push({
      key: 'natural_diversity',
      text: `요즘 식사를 보니 ${fragments.diversityClause}. ${title}${particle} 어떠세요?`,
    });
  }

  variants.push({
    key: 'natural_default',
    text: `오늘은 ${mealQuality} ${title}${particle} 추천합니다.`,
  });
  variants.push({
    key: 'natural_default_alt',
    text: `${fragments.mealTimeLabel}에 어울리는 ${title}${particle} 골랐어요.`,
  });

  return variants;
}

/** RC2 — one natural recommendation sentence from weather, history, time, and meal signals. */
export function buildNaturalRecommendationSentence(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context: RecommendationContext | undefined,
  rank: number,
): string {
  const fragments = buildRecommendationFragments(menu, breakdown, situation, context);
  const seed = buildReasonSeed(menu.id, situation.hourOfDay, rank, breakdown.notes.length);
  const variants = buildSentenceVariants(menu, fragments);

  const preferredKeys = [
    fragments.weatherKey && fragments.historyKey ? 'natural_weather_history' : null,
    fragments.weatherKey ? 'natural_weather_only' : null,
    fragments.historyKey ? 'natural_history_only' : null,
    fragments.isQuickCook ? 'natural_quick_cook' : null,
    fragments.diversityKey ? 'natural_diversity' : null,
  ].filter(Boolean) as string[];

  const prioritized = [
    ...variants.filter((variant) => preferredKeys.includes(variant.key)),
    ...variants.filter((variant) => !preferredKeys.includes(variant.key)),
  ];

  const unique = prioritized.filter(
    (variant, index, list) => list.findIndex((item) => item.key === variant.key) === index,
  );

  return pickReasonVariant(unique, seed).text;
}
