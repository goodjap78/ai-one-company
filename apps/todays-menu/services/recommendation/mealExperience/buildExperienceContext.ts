import type { MenuItem } from '../../../types/recommendation';
import type { MealStyle } from '../../../types/mealStyle';

const EXPERIENCE_BY_STYLE: Record<MealStyle, { label: string; labelKo: string }> = {
  recipe: {
    label: 'Warm home dinner',
    labelKo: '따뜻한 집밥 한 끼',
  },
  grill: {
    label: 'Relaxing grill dinner',
    labelKo: '여유로운 구이 저녁',
  },
  delivery: {
    label: 'Relax with family',
    labelKo: '가족과 편안하게 즐기는 시간',
  },
  assembly: {
    label: 'Simple put-together meal',
    labelKo: '간단하게 차려 먹는 한 끼',
  },
  instant: {
    label: 'Simple weekend lunch',
    labelKo: '부담 없는 간편 식사',
  },
};

const EXPERIENCE_OVERRIDES: Partial<Record<string, { label: string; labelKo: string }>> = {
  homemade_002: { label: 'Warm family dinner', labelKo: '따뜻한 가족 저녁' },
  homemade_012: { label: 'Quick comfort meal', labelKo: '빠른 위로 한 끼' },
  delivery_001: { label: 'Relax with family', labelKo: '가족과 편안하게 즐기는 금요일 밤' },
};

export function buildExperienceContext(menu: MenuItem, mealStyle: MealStyle) {
  if (menu.experienceLabel) {
    return {
      label: menu.experienceLabel,
      labelKo: menu.experienceLabel,
    };
  }

  return EXPERIENCE_OVERRIDES[menu.id] ?? EXPERIENCE_BY_STYLE[mealStyle];
}
