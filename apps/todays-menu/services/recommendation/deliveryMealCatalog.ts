import type { AiRecommendationReason } from '../../utils/recommendationDisplayReason';
import type { GoldMealRecord } from '../../types/goldMeal';
import type { MenuItem } from '../../types/recommendation';
import { DELIVERY_MEALS_FLAGSHIP } from '../../library/delivery-meals';
import { goldMealToMenuItem } from './goldMealCatalog';

const DELIVERY_CONFIDENCE_REASONS: Record<string, AiRecommendationReason[]> = {
  gold_c_jajangmyeon: [
    { emoji: '👨‍👩‍👧', text: '누구나 좋아하는 편안한 맛, 오늘은 이게 딱이에요.' },
    { emoji: '🕖', text: '저녁에 가장 많이 찾는 중식 메뉴예요.' },
    { emoji: '⏱️', text: '포장·외식으로 빠르게 즐기기 좋아요.' },
  ],
  gold_c_jjamppong: [
    { emoji: '🌧️', text: '비 오는 날엔 얼큰한 국물이 특히 그리워져요.' },
    { emoji: '🌶️', text: '얼큰한 맛이 당길 때, 마음까지 풀려요.' },
    { emoji: '🌙', text: '늦은 저녁·야식에도 든든하게 좋아요.' },
  ],
  gold_c_malatang: [
    { emoji: '👫', text: '친구나 연인과 나눠 먹기 좋은 메뉴예요.' },
    { emoji: '🌶️', text: '매콤얼얼한 맛이 당길 때 잘 맞아요.' },
    { emoji: '🌙', text: '주말 야식, 함께 즐기기 좋은 선택이에요.' },
  ],
};

function withDeliveryConfidence(meal: GoldMealRecord): MenuItem {
  const item = goldMealToMenuItem(meal);
  const reasons = DELIVERY_CONFIDENCE_REASONS[meal.id];
  return reasons ? { ...item, confidenceReasons: reasons } : item;
}

/** Sprint 29 — recommendation pool for 외식·포장 모드. */
export function getDeliveryMenuCatalog(): MenuItem[] {
  return DELIVERY_MEALS_FLAGSHIP.map(withDeliveryConfidence);
}

export function getDeliveryMenuById(id: string): MenuItem | null {
  const meal = DELIVERY_MEALS_FLAGSHIP.find((entry) => entry.id === id);
  return meal ? withDeliveryConfidence(meal) : null;
}

export function isDeliveryMenuId(id: string): boolean {
  return DELIVERY_MEALS_FLAGSHIP.some((entry) => entry.id === id);
}
