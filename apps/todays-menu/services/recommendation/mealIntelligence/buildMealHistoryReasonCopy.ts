import type { FoodMemoryCategory } from '../../../types/foodMemory';
import type { RecommendationContext } from '../../../types/preference';
import type { MenuItem } from '../../../types/recommendation';
import { resolveEntryCategory } from '../../MealHistoryService';
import { menuToFoodMemoryCategory } from '../../memory/foodMemory';
import { RECENT_MEAL_WINDOW_DAYS } from '../../MealHistoryService';

const CATEGORY_LABELS: Record<FoodMemoryCategory, string> = {
  meat: '고기 요리',
  noodle: '면 요리',
  rice: '밥 메뉴',
  stew: '찌개·탕',
  soup: '국물 요리',
  salad: '가벼운 요리',
  delivery: '배달·외식',
  other: '한 끼',
};

const LIGHT_CATEGORIES: FoodMemoryCategory[] = ['salad', 'rice', 'soup'];

const PREFERRED_AFTER: Partial<Record<FoodMemoryCategory, FoodMemoryCategory>> = {
  noodle: 'rice',
  meat: 'salad',
  stew: 'salad',
  delivery: 'rice',
};

function labelFor(category: FoodMemoryCategory): string {
  return CATEGORY_LABELS[category];
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

/**
 * Sprint 48 — dynamic recommendation copy from meal history.
 */
export function buildMealHistoryReasonCopy(
  menu: MenuItem,
  context?: RecommendationContext,
  notes?: Set<string>,
): string | null {
  const menuCategory = menuToFoodMemoryCategory(menu);
  const recent = recentInWindow(context);
  if (recent.length === 0) return null;

  const yMeal = yesterdayMeal(context);
  if (yMeal) {
    const yCategory = resolveEntryCategory(yMeal);
    if (yCategory === 'meat' && LIGHT_CATEGORIES.includes(menuCategory)) {
      return '어제 고기 요리를 드셔서\n오늘은 가볍게 드실 수 있는 메뉴를 추천해요.';
    }
    if (notes?.has('history_yesterday_avoid')) {
      return `어제 ${labelFor(yCategory)}를 드셔서\n오늘은 다른 메뉴를 추천해요.`;
    }
  }

  const recentNoodle = recent.some((entry) => resolveEntryCategory(entry) === 'noodle');
  if (recentNoodle && menuCategory === 'rice') {
    return '최근 면 요리를 드셔서\n오늘은 밥 메뉴를 추천해요.';
  }

  for (const entry of recent) {
    const recentCategory = resolveEntryCategory(entry);
    const preferred = PREFERRED_AFTER[recentCategory];
    if (preferred && menuCategory === preferred) {
      return `최근 ${labelFor(recentCategory)}를 드셔서\n오늘은 ${labelFor(preferred)}를 추천해요.`;
    }
  }

  if (notes?.has('history_category_variety')) {
    const lastCategory = resolveEntryCategory(recent[0]);
    if (menuCategory !== lastCategory) {
      return `최근 ${labelFor(lastCategory)}를 드셔서\n오늘은 ${labelFor(menuCategory)}를 추천해요.`;
    }
  }

  return null;
}
