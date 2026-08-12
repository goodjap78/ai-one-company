import type { LocalizedText, RecipeTagId } from '../types';

export type RecipeTag = {
  id: RecipeTagId;
  label: LocalizedText;
  description: LocalizedText;
};

export const RECIPE_TAGS: Record<RecipeTagId, RecipeTag> = {
  quick: {
    id: 'quick',
    label: { ko: '빠른 요리', en: 'Quick' },
    description: { ko: '30분 이내에 완성하기 좋아요.', en: 'Ready in about 30 minutes.' },
  },
  comfort: {
    id: 'comfort',
    label: { ko: '편안한 맛', en: 'Comfort' },
    description: { ko: '마음이 편해지는 익숙한 맛이에요.', en: 'Familiar and comforting.' },
  },
  spicy: {
    id: 'spicy',
    label: { ko: '매콤함', en: 'Spicy' },
    description: { ko: '얼큰하고 매콤한 맛이에요.', en: 'Bold and spicy.' },
  },
  mild: {
    id: 'mild',
    label: { ko: '담백함', en: 'Mild' },
    description: { ko: '부담 없이 먹기 좋아요.', en: 'Light and easy to enjoy.' },
  },
  healthy: {
    id: 'healthy',
    label: { ko: '건강식', en: 'Healthy' },
    description: { ko: '가볍고 균형 잡힌 한 끼예요.', en: 'Balanced and lighter.' },
  },
  budget: {
    id: 'budget',
    label: { ko: '가성비', en: 'Budget' },
    description: { ko: '재료 부담이 적어요.', en: 'Easy on the wallet.' },
  },
  family: {
    id: 'family',
    label: { ko: '가족 식사', en: 'Family' },
    description: { ko: '함께 나눠 먹기 좋아요.', en: 'Great for sharing.' },
  },
  solo: {
    id: 'solo',
    label: { ko: '혼밥', en: 'Solo' },
    description: { ko: '혼자 빠르게 해결하기 좋아요.', en: 'Perfect for eating alone.' },
  },
  late_night: {
    id: 'late_night',
    label: { ko: '야식', en: 'Late night' },
    description: { ko: '밤에 부담 없이 즐기기 좋아요.', en: 'Good for late-night cravings.' },
  },
  meal_prep: {
    id: 'meal_prep',
    label: { ko: '밀프렙', en: 'Meal prep' },
    description: { ko: '미리 준비해두기 좋아요.', en: 'Works well for prep ahead.' },
  },
  one_pot: {
    id: 'one_pot',
    label: { ko: '한 냄비', en: 'One pot' },
    description: { ko: '설거지가 적어요.', en: 'Minimal cleanup.' },
  },
  rice_based: {
    id: 'rice_based',
    label: { ko: '밥 메뉴', en: 'Rice based' },
    description: { ko: '밥과 잘 어울려요.', en: 'Built around rice.' },
  },
  high_protein: {
    id: 'high_protein',
    label: { ko: '단백질', en: 'High protein' },
    description: { ko: '든든하게 채워줘요.', en: 'Protein-forward.' },
  },
  vegetarian_option: {
    id: 'vegetarian_option',
    label: { ko: '채식 가능', en: 'Vegetarian option' },
    description: { ko: '재료를 바꾸면 채식으로도 가능해요.', en: 'Can be adapted vegetarian.' },
  },
};

export function getRecipeTag(id: RecipeTagId): RecipeTag {
  return RECIPE_TAGS[id];
}

export function getRecipeTagLabel(id: RecipeTagId, locale: 'ko' | 'en' = 'ko'): string {
  const tag = RECIPE_TAGS[id];
  return locale === 'en' && tag.label.en ? tag.label.en : tag.label.ko;
}
