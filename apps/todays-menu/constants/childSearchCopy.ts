/**
 * Child search / filter UI copy — parent-facing only.
 */

export const childSearchCopy = {
  searchPlaceholder: '메뉴나 재료를 검색해보세요',
  resultCount: (count: number) => `${count}개 메뉴`,
  emptyTitle: '조건에 맞는 메뉴가 없어요.',
  emptyHint: '필터를 하나 줄여보세요.',
  filterSections: {
    mainIngredient: '주재료',
    texture: '형태',
    batch: '대량조리',
    allergy: '알레르기',
    meal: '끼니',
    time: '시간',
    form: '형태',
    more: '더보기',
    mealSlot: '끼니/상황',
  },
  batchFriendly: '한 번에 만들기 좋은 메뉴',
  scalableOnly: '1/3/6회분 가능',
  timeUnder: (minutes: number) => `${minutes}분 이하`,
  elementaryBrowseTitle: '초등 메뉴 골라보기',
  elementaryBrowseSubtitle: '끼니와 재료로 초등 메뉴를 찾아보세요',
  elementaryBreakfastWeeklyLink: '초등 아침 7일',
  elementaryDinnerWeeklyLink: '초등 저녁 7일',
} as const;

export const BABY_MAIN_INGREDIENT_OPTIONS = [
  { id: 'beef', label: '소고기' },
  { id: 'chicken', label: '닭고기' },
  { id: 'tofu', label: '두부' },
  { id: 'egg', label: '계란' },
  { id: 'fish', label: '생선' },
  { id: 'vegetable', label: '채소' },
  { id: 'fruit', label: '과일' },
] as const;

export const BABY_TEXTURE_OPTIONS = [
  { id: 'thin_puree', label: '미음' },
  { id: 'thick_puree', label: '퓌레' },
  { id: 'porridge', label: '죽' },
  { id: 'mashed_rice', label: '무른밥' },
  { id: 'family_transition', label: '진밥' },
  { id: 'finger_food', label: '핑거푸드' },
] as const;

export const TODDLER_TIME_OPTIONS = [
  { id: '10', label: '10분 이하' },
  { id: '15', label: '15분 이하' },
  { id: '20', label: '20분 이하' },
] as const;

export const TODDLER_MAIN_INGREDIENT_OPTIONS = [
  { id: 'beef', label: '소고기' },
  { id: 'chicken', label: '닭고기' },
  { id: 'tofu', label: '두부' },
  { id: 'egg', label: '계란' },
  { id: 'fish', label: '생선' },
] as const;

export const TODDLER_FORM_OPTIONS = [
  { id: 'soup', label: '국' },
  { id: 'fried_rice', label: '볶음밥' },
  { id: 'rice_bowl', label: '덮밥' },
] as const;

export const ELEMENTARY_MEAL_SLOT_OPTIONS = [
  { id: 'breakfast', label: '아침' },
  { id: 'lunch_box', label: '점심/도시락' },
  { id: 'dinner', label: '저녁' },
  { id: 'after_school_snack', label: '방과후 간식' },
] as const;

export const ELEMENTARY_TIME_OPTIONS = [
  { id: '10', label: '10분' },
  { id: '15', label: '15분' },
  { id: '20', label: '20분 이하' },
] as const;

export const ELEMENTARY_MAIN_INGREDIENT_OPTIONS = [
  { id: 'beef', label: '소고기' },
  { id: 'chicken', label: '닭고기' },
  { id: 'egg', label: '계란' },
  { id: 'tuna', label: '참치' },
  { id: 'tofu', label: '두부' },
] as const;

export const ELEMENTARY_FORM_OPTIONS = [
  { id: 'rice_ball', label: '주먹밥' },
  { id: 'kimbap', label: '김밥' },
  { id: 'toast', label: '토스트' },
  { id: 'rice_bowl', label: '덮밥' },
  { id: 'fried_rice', label: '볶음밥' },
  { id: 'tortilla', label: '또띠아' },
  { id: 'snack', label: '간식' },
] as const;

export const CHILD_ALLERGY_OPTIONS = [
  { id: 'egg', label: '계란' },
  { id: 'milk', label: '우유' },
  { id: 'peanut', label: '땅콩' },
  { id: 'nuts', label: '견과' },
  { id: 'wheat', label: '밀' },
  { id: 'soy', label: '콩' },
  { id: 'fish', label: '생선' },
  { id: 'shellfish', label: '갑각류' },
  { id: 'pork', label: '돼지고기' },
  { id: 'beef', label: '소고기' },
  { id: 'chicken', label: '닭고기' },
] as const;
