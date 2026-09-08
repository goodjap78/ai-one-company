/**
 * Weekly → recipe access copy. Shared by all four week screens + index.
 * Static strings only. Do not send these values to analytics.
 */
export const WEEKLY_RECIPE_INDEX_SOURCES = [
  'elementary-breakfast',
  'elementary-dinner',
  'toddler-breakfast',
  'toddler-dinner',
] as const;

export type WeeklyRecipeIndexSource = (typeof WEEKLY_RECIPE_INDEX_SOURCES)[number];

export const weeklyRecipeAccessCopy = {
  recipeViewCta: '레시피 보기 ›',
  weeklyRecipeIndexButton: '이번 주 7개 레시피 보기',
  weeklyRecipeIndexTitle: '이번 주 레시피',
  weeklyRecipeIndexSubtitle: '월~일 순서로 모아봤어요.',
  weeklyRecipeIndexBack: '7일 식단',
  shareCardRecipeHint: '레시피는 한끼 앱에서 확인하세요',
  emptyTitle: '이번 주 식단을 찾지 못했어요',
  emptyMessage: '7일 식단 화면에서 다시 열어 주세요.',
  cookTime: (minutes: number) => `${minutes}분`,
} as const;
