/**
 * Sprint v1.1 toddler feed UI — parent-facing copy.
 * Do not put the technical term "toddler" on screen.
 * Do not claim 저염 / 저당 / 영양 균형 / 아이에게 안전.
 */

export const TODDLER_FEED_MEAL_TYPE_LABELS = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
} as const;

export const toddlerMealFeedCopy = {
  homeCardTitle: '아이 뭐 먹이지?',
  homeCardSubtitle: '영유아 식사 메뉴 골라보기',
  screenTitle: '오늘 우리 아이 뭐 먹이지?',
  screenSubtitle: '영유아 식사 메뉴 골라보기',
  menuBrowseLabel: '메뉴 찾기',
  weeklyPlanLink: '이번 주 메뉴',
  mainEyebrow: '오늘의 추천',
  otherMenus: '다른 메뉴',
  refreshButton: '다른 메뉴 추천',
  emptyTitle: '메뉴를 찾지 못했어요',
  emptyMessage: '지금은 이 끼니 추천을 보여 줄 수 없어요.',
  cookTime: (minutes: number) => `${minutes}분`,
  recipeA11y: (name: string, minutes: number) => `${name}, ${minutes}분. 레시피 보기`,
} as const;
