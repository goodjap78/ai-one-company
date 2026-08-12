import type { MealType } from '../../../types/home';
import type { FoodMemoryCategory } from '../../../types/foodMemory';
import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { MealScoreBreakdown, MealSituationSnapshot } from '../../../types/mealIntelligenceEngine';
import { resolveEntryCategory, RECENT_MEAL_WINDOW_DAYS } from '../../MealHistoryService';
import { menuToFoodMemoryCategory } from '../../memory/foodMemory';
import { isCold, isRainy, isTemperatureFatigue, isVeryHot } from './mealKnowledge';
import { classifyMealArchetypes } from './mealProfile';

const CATEGORY_LABELS: Record<FoodMemoryCategory, string> = {
  meat: '고기 메뉴',
  noodle: '면 요리',
  rice: '밥 메뉴',
  stew: '찌개·탕',
  soup: '국물 요리',
  salad: '가벼운 요리',
  delivery: '배달·외식',
  other: '한 끼',
};

const LIGHT_CATEGORIES: FoodMemoryCategory[] = ['salad', 'rice', 'soup'];

export type RecommendationFragments = {
  weatherKey: string | null;
  weatherClause: string | null;
  historyKey: string | null;
  historyClause: string | null;
  diversityKey: string | null;
  diversityClause: string | null;
  mealQuality: string;
  mealTimeLabel: string;
  isQuickCook: boolean;
  cookTimeMinutes: number;
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

function recentInWindow(context?: RecommendationContext) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_MEAL_WINDOW_DAYS);
  return (context?.recentMeals ?? []).filter(
    (entry) => new Date(entry.cookedDate) >= cutoff,
  );
}

function yesterdayMeal(context?: RecommendationContext) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = yesterday.toISOString().slice(0, 10);
  return (context?.recentMeals ?? []).find((entry) => entry.cookedDate === target) ?? null;
}

function labelFor(category: FoodMemoryCategory): string {
  return CATEGORY_LABELS[category];
}

function isQuickMeal(menu: MenuItem, notes: Set<string>): boolean {
  return (
    menu.cookTime <= 20 ||
    notes.has('late_hour_quick') ||
    notes.has('lunch_hour_quick') ||
    notes.has('weekday_quick')
  );
}

function resolveMealQuality(
  menu: MenuItem,
  situation: MealSituationSnapshot,
  notes: Set<string>,
): string {
  const archetypes = classifyMealArchetypes(menu);
  const { weather } = situation;

  if (notes.has('variety_next') || notes.has('history_category_variety')) {
    return '맛을 바꿔볼 수 있는';
  }
  if (isQuickMeal(menu, notes)) {
    return '금방 만들 수 있는';
  }
  if (
    (isVeryHot(weather) || isTemperatureFatigue(weather)) &&
    (archetypes.includes('cold_meal') || menu.title.includes('비빔'))
  ) {
    return '가볍게 즐길 수 있는';
  }
  if (isRainy(weather) || isCold(weather)) {
    if (archetypes.includes('stew') || archetypes.includes('soup')) {
      return '따뜻하게 즐길 수 있는';
    }
    return '든든하게 즐길 수 있는';
  }
  if (notes.has('favorite') || notes.has('dna_cuisine') || notes.has('dna_taste')) {
    return '평소 입맛에 맞는';
  }
  return '오늘 한 끼로 좋은';
}

function resolveWeatherFragment(situation: MealSituationSnapshot): {
  key: string | null;
  clause: string | null;
} {
  const { weather } = situation;

  if (isRainy(weather)) {
    return { key: 'weather_rainy', clause: '비가 와서' };
  }
  if (isTemperatureFatigue(weather) || isVeryHot(weather)) {
    return { key: 'weather_hot', clause: '날씨가 덥고' };
  }
  if (isCold(weather)) {
    return { key: 'weather_cold', clause: '날씨가 쌀쌀해서' };
  }
  if (weather.condition === 'cloudy') {
    return { key: 'weather_cloudy', clause: '흐린 날씨라' };
  }
  return { key: null, clause: null };
}

function resolveHistoryFragment(
  menu: MenuItem,
  context: RecommendationContext | undefined,
  notes: Set<string>,
): { key: string | null; clause: string | null } {
  const menuCategory = menuToFoodMemoryCategory(menu);
  const recent = recentInWindow(context);
  if (recent.length === 0) return { key: null, clause: null };

  const yMeal = yesterdayMeal(context);
  if (yMeal) {
    const yCategory = resolveEntryCategory(yMeal);
    if (yCategory === 'meat' && LIGHT_CATEGORIES.includes(menuCategory)) {
      return { key: 'history_yesterday_meat', clause: '최근 고기 메뉴를 드셔서' };
    }
    if (notes.has('history_yesterday_avoid')) {
      return {
        key: 'history_yesterday_avoid',
        clause: `어제 ${labelFor(yCategory)}를 드셔서`,
      };
    }
  }

  const recentMeat = recent.some((entry) => resolveEntryCategory(entry) === 'meat');
  if (recentMeat && LIGHT_CATEGORIES.includes(menuCategory)) {
    return { key: 'history_recent_meat', clause: '최근 고기 메뉴를 드셔서' };
  }

  const recentNoodle = recent.some((entry) => resolveEntryCategory(entry) === 'noodle');
  if (recentNoodle && menuCategory === 'rice') {
    return { key: 'history_recent_noodle', clause: '최근 면 요리를 드셔서' };
  }

  if (notes.has('history_category_variety') || notes.has('variety_next')) {
    const lastCategory = resolveEntryCategory(recent[0]);
    if (menuCategory !== lastCategory) {
      return {
        key: 'history_category_variety',
        clause: `최근 ${labelFor(lastCategory)}를 드셔서`,
      };
    }
  }

  if (notes.has('recent_same_cuisine')) {
    return { key: 'history_same_cuisine', clause: '요즘 비슷한 메뉴를 드셔서' };
  }

  if (recent.length >= 2) {
    return { key: 'history_recent_pattern', clause: '최근 식사 패턴을 보니' };
  }

  return { key: null, clause: null };
}

function resolveDiversityFragment(
  menu: MenuItem,
  context: RecommendationContext | undefined,
  notes: Set<string>,
): { key: string | null; clause: string | null } {
  const menuCategory = menuToFoodMemoryCategory(menu);
  const recent = recentInWindow(context);

  if (notes.has('variety_next') || notes.has('history_category_variety')) {
    const lastCategory = recent[0] ? resolveEntryCategory(recent[0]) : null;
    if (lastCategory && menuCategory !== lastCategory) {
      return {
        key: 'diversity_category',
        clause: `${labelFor(menuCategory)}로 바꿔볼 수 있어요`,
      };
    }
    return { key: 'diversity_general', clause: '다른 종류로 골라봤어요' };
  }

  if (notes.has('memory_variety') || notes.has('memory_category_repeat')) {
    return { key: 'diversity_memory', clause: '같은 종류가 이어져서 달리 골랐어요' };
  }

  if (notes.has('recent_same_meal')) {
    return { key: 'diversity_same_meal', clause: '최근 메뉴와 겹치지 않게 골랐어요' };
  }

  return { key: null, clause: null };
}

export function buildRecommendationFragments(
  menu: MenuItem,
  breakdown: MealScoreBreakdown,
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): RecommendationFragments {
  const notes = new Set(breakdown.notes);
  const weather = resolveWeatherFragment(situation);
  const history = resolveHistoryFragment(menu, context, notes);
  const diversity = resolveDiversityFragment(menu, context, notes);

  return {
    weatherKey: weather.key,
    weatherClause: weather.clause,
    historyKey: history.key,
    historyClause: history.clause,
    diversityKey: diversity.key,
    diversityClause: diversity.clause,
    mealQuality: resolveMealQuality(menu, situation, notes),
    mealTimeLabel: mealSlotLabel(situation.mealType),
    isQuickCook: isQuickMeal(menu, notes),
    cookTimeMinutes: menu.cookTime,
  };
}

export function koreanObjectParticle(word: string): '을' | '를' {
  const trimmed = word.trim();
  const last = trimmed.slice(-1);
  if (!last) return '을';

  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return '을';
  return (code - 0xac00) % 28 === 0 ? '를' : '을';
}

export { labelFor, mealSlotLabel, isQuickMeal };
