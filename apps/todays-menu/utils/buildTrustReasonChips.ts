import { getHankkiHomeDecisionMessages } from '../constants/HankkiMessages';
import type { MealMode } from '../types/home';
import type {
  ExplanationFactorCategory,
  MealExplanation,
  MealExplanationLevel2Reason,
} from '../types/mealExplanation';
import type { AiRecommendationReason } from './recommendationDisplayReason';

export type TrustReasonChip = {
  id: ExplanationFactorCategory | 'fallback';
  emoji: string;
  text: string;
  displayTitle: string;
  displaySubtitle: string;
};

const MAX_CHIPS = 3;
const QUICK_COOK_MINUTES = 25;

type Labels = ReturnType<typeof getHankkiHomeDecisionMessages>;

type ChipBase = Pick<TrustReasonChip, 'id' | 'emoji' | 'text'>;

function withHomeDisplay(
  chip: ChipBase,
  displayTitle: string,
  displaySubtitle: string,
): TrustReasonChip {
  return { ...chip, displayTitle, displaySubtitle };
}

function mapWeatherChip(text: string, labels: Labels): TrustReasonChip {
  if (/비/.test(text)) {
    return withHomeDisplay(
      { id: 'weather', emoji: '🌧️', text: labels.trustChipWeatherRain },
      labels.homeReasonTitleWeather,
      labels.homeReasonSubWeatherRain,
    );
  }
  if (/더운|더워|무겁지|가볍/.test(text)) {
    return withHomeDisplay(
      { id: 'weather', emoji: '☀️', text: labels.trustChipWeatherHot },
      labels.homeReasonTitleWeather,
      labels.homeReasonSubWeatherHot,
    );
  }
  if (/쌀쌀|따뜻/.test(text)) {
    return withHomeDisplay(
      { id: 'weather', emoji: '🧣', text: labels.trustChipWeatherCold },
      labels.homeReasonTitleWeather,
      labels.homeReasonSubWeatherCold,
    );
  }
  return withHomeDisplay(
    { id: 'weather', emoji: '☀️', text: labels.trustChipWeatherDefault },
    labels.homeReasonTitleWeather,
    labels.homeReasonSubWeatherDefault,
  );
}

function mapRecentMealsChip(text: string, labels: Labels): TrustReasonChip {
  if (/달라|variety/.test(text)) {
    return withHomeDisplay(
      { id: 'recentMeals', emoji: '🍚', text: labels.trustChipRecentVariety },
      labels.homeReasonTitleRecent,
      labels.homeReasonSubRecentVariety,
    );
  }
  if (/마음|찜|두/.test(text)) {
    return withHomeDisplay(
      { id: 'recentMeals', emoji: '❤️', text: labels.trustChipRecentFavorite },
      labels.homeReasonTitleRecent,
      labels.homeReasonSubRecentFavorite,
    );
  }
  if (/평소|취향|입맛|좋아/.test(text)) {
    return withHomeDisplay(
      { id: 'recentMeals', emoji: '🍚', text: labels.trustChipRecentPreference },
      labels.homeReasonTitleRecent,
      labels.homeReasonSubRecentPreference,
    );
  }
  if (/익숙/.test(text)) {
    return withHomeDisplay(
      { id: 'recentMeals', emoji: '🍚', text: labels.trustChipRecentFamiliar },
      labels.homeReasonTitleRecent,
      labels.homeReasonSubRecentFamiliar,
    );
  }
  return withHomeDisplay(
    { id: 'recentMeals', emoji: '🍚', text: labels.trustChipRecentDefault },
    labels.homeReasonTitleRecent,
    labels.homeReasonSubRecentDefault,
  );
}

function mapTimeChip(
  text: string,
  mealMode: MealMode,
  cookingTimeMinutes: number | undefined,
  labels: Labels,
): TrustReasonChip {
  if (mealMode === 'delivery') {
    return withHomeDisplay(
      { id: 'time', emoji: '🍽', text: labels.trustChipCookDelivery },
      labels.homeReasonTitleDelivery,
      labels.homeReasonSubCookDelivery,
    );
  }
  if (
    /금방|오래 걸리지|부담|quick/.test(text) ||
    (cookingTimeMinutes !== undefined && cookingTimeMinutes <= QUICK_COOK_MINUTES)
  ) {
    return withHomeDisplay(
      { id: 'time', emoji: '⏱️', text: labels.trustChipCookQuick },
      labels.homeReasonTitleCook,
      labels.homeReasonSubCookQuick,
    );
  }
  return withHomeDisplay(
    { id: 'time', emoji: '⏱️', text: labels.trustChipCookDefault },
    labels.homeReasonTitleTime,
    labels.homeReasonSubCookDefault,
  );
}

function isSmartReasonCopy(text: string): boolean {
  return /어울려요|맞아요|균형|완성돼요|메뉴예요|분이면/.test(text);
}

function applySmartSubtitle(chip: TrustReasonChip, item: MealExplanationLevel2Reason): TrustReasonChip {
  const text = item.text.trim();
  if (!isSmartReasonCopy(text)) return chip;
  return {
    ...chip,
    emoji: item.emoji,
    displaySubtitle: text,
  };
}

function mapLevel2Item(
  item: MealExplanationLevel2Reason,
  mealMode: MealMode,
  cookingTimeMinutes: number | undefined,
  labels: Labels,
): TrustReasonChip {
  let chip: TrustReasonChip;
  switch (item.category) {
    case 'weather':
      chip = mapWeatherChip(item.text, labels);
      break;
    case 'recentMeals':
      chip = mapRecentMealsChip(item.text, labels);
      break;
    case 'time':
      chip = mapTimeChip(item.text, mealMode, cookingTimeMinutes, labels);
      break;
  }
  return applySmartSubtitle(chip, item);
}

function fallbackFromReasons(
  reasons: AiRecommendationReason[],
  mealMode: MealMode,
  cookingTimeMinutes: number | undefined,
  labels: Labels,
): TrustReasonChip[] {
  const chips: TrustReasonChip[] = [];

  for (const reason of reasons) {
    if (chips.length >= MAX_CHIPS) break;

    const text = reason.text;
    if (/날씨|더운|쌀쌀|비|가볍게요/.test(text) && !chips.some((chip) => chip.id === 'weather')) {
      chips.push(mapWeatherChip(text, labels));
      continue;
    }
    if (/요즘|최근|어제|평소|입맛|달라|익숙|마음/.test(text) && !chips.some((chip) => chip.id === 'recentMeals')) {
      chips.push(mapRecentMealsChip(text, labels));
      continue;
    }
    if (chips.length < MAX_CHIPS && !chips.some((chip) => chip.id === 'time')) {
      chips.push(mapTimeChip(text, mealMode, cookingTimeMinutes, labels));
    }
  }

  while (chips.length < MAX_CHIPS) {
    if (!chips.some((chip) => chip.id === 'weather')) {
      chips.push(mapWeatherChip('', labels));
    } else if (!chips.some((chip) => chip.id === 'recentMeals')) {
      chips.push(mapRecentMealsChip(labels.reasonFallback, labels));
    } else if (!chips.some((chip) => chip.id === 'time')) {
      chips.push(mapTimeChip('', mealMode, cookingTimeMinutes, labels));
    } else {
      break;
    }
  }

  return chips.slice(0, MAX_CHIPS);
}

export function buildTrustReasonChips(input: {
  explanation?: MealExplanation;
  mealMode: MealMode;
  cookingTimeMinutes?: number;
  fallbackReasons?: AiRecommendationReason[];
}): TrustReasonChip[] {
  const labels = getHankkiHomeDecisionMessages();
  const { explanation, mealMode, cookingTimeMinutes, fallbackReasons = [] } = input;

  if (explanation?.level2?.length) {
    return explanation.level2
      .slice(0, MAX_CHIPS)
      .map((item) => mapLevel2Item(item, mealMode, cookingTimeMinutes, labels));
  }

  return fallbackFromReasons(fallbackReasons, mealMode, cookingTimeMinutes, labels);
}
