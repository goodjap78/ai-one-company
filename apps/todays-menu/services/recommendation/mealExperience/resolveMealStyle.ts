import type { MenuItem } from '../../../types/recommendation';
import type { MealStyle } from '../../../types/mealStyle';

/** Explicit mealStyle overrides until full catalog migration. */
const MEAL_STYLE_OVERRIDES: Partial<Record<string, MealStyle>> = {
  homemade_011: 'recipe',
  homemade_012: 'instant',
  delivery_001: 'delivery',
  delivery_002: 'delivery',
  delivery_003: 'delivery',
  delivery_004: 'delivery',
  delivery_005: 'delivery',
  delivery_006: 'delivery',
  delivery_007: 'delivery',
  delivery_008: 'delivery',
  delivery_009: 'delivery',
  delivery_010: 'delivery',
  delivery_011: 'delivery',
  delivery_012: 'delivery',
  delivery_013: 'delivery',
  delivery_014: 'delivery',
  delivery_015: 'delivery',
  delivery_016: 'delivery',
  delivery_017: 'delivery',
  delivery_018: 'delivery',
  delivery_019: 'delivery',
  delivery_020: 'delivery',
};

const GRILL_TITLE_KEYWORDS = ['삼겹살', '갈비', '구이', '바베큐', 'BBQ'];

export function resolveMealStyle(menu: MenuItem): MealStyle {
  if (menu.mealStyle) return menu.mealStyle;
  if (MEAL_STYLE_OVERRIDES[menu.id]) return MEAL_STYLE_OVERRIDES[menu.id]!;

  if (menu.mode === 'delivery') return 'delivery';
  if (menu.title.includes('라면') || menu.title.includes('토스트')) return 'instant';
  if (GRILL_TITLE_KEYWORDS.some((keyword) => menu.title.includes(keyword))) return 'grill';
  if (menu.title.includes('샐러드') && menu.cookTime <= 15) return 'assembly';

  return 'recipe';
}
