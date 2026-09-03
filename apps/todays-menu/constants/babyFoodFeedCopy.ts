/**
 * Sprint v1.1 baby food feed UI — parent-facing copy.
 * Do not show internal enums on screen.
 * Do not invent start-month mandates.
 */

export const BABY_FOOD_FEED_STAGE_LABELS = {
  early: '시작기',
  middle: '적응기',
  late: '확장기',
  completion: '전환기',
} as const;

export const BABY_FOOD_FEED_ALLERGY_LABELS = {
  egg: '계란',
  milk: '우유',
  peanut: '땅콩',
  nuts: '견과',
  wheat: '밀',
  soy: '콩',
  fish: '생선',
  shellfish: '갑각류',
  pork: '돼지고기',
  beef: '소고기',
  chicken: '닭고기',
} as const;

export const babyFoodFeedCopy = {
  homeCardTitle: '이유식 골라보기',
  homeCardSubtitle: '단계에 맞는 이유식 메뉴를 찾아보세요',
  screenTitle: '이유식 골라보기',
  screenSubtitle: '우리 아이 단계에 맞는 메뉴를 골라보세요',
  weeklyPlanLink: '이번 주 메뉴',
  guidanceTitle: '이유식 안내',
  guidanceLines: [
    '새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.',
    '1세 미만에는 꿀을 주지 마세요.',
  ] as const,
  guidanceSource: '질병관리청 이유식 안내를 참고했어요.',
  emptyTitle: '메뉴를 찾지 못했어요',
  emptyMessage: '지금은 이 단계 메뉴를 보여 줄 수 없어요.',
  menuBrowseLabel: '메뉴 찾기',
  cookTime: (minutes: number) => `${minutes}분`,
  allergyLine: (labels: readonly string[]) =>
    labels.length === 0 ? '' : `알레르기 · ${labels.join(', ')}`,
  recipeA11y: (name: string, minutes: number) => `${name}, ${minutes}분. 레시피 보기`,
} as const;
