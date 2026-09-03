/**
 * Toddler weekly plan UI copy — parent-facing only.
 */

export const TODDLER_WEEKLY_PLAN_WEEKDAY_KO = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
} as const;

export const toddlerWeeklyPlanCopy = {
  screenTitle: '이번 주 유아식 메뉴',
  screenSubtitle: '한 주 메뉴를 미리 골라보세요.',
  menuBrowseLink: '메뉴 찾기',
  refreshButton: '다른 일주일 골라보기',
  saveImageButton: '식단 이미지 저장',
  shareButton: '식단 공유하기',
  sharingBusy: '식단 이미지를 만들고 있어요',
  saveSuccess: '식단 이미지를 저장했어요',
  savePermissionTitle: '사진 저장 권한이 필요해요',
  savePermissionMessage: '앨범에 식단 이미지를 저장하려면 사진 저장을 허용해 주세요.',
  saveFailedTitle: '이미지를 저장하지 못했어요',
  saveFailedMessage: '잠시 후 다시 시도해 주세요.',
  captureFailedTitle: '식단 이미지를 만들지 못했어요',
  captureFailedMessage: '식단은 그대로 볼 수 있어요. 잠시 후 다시 시도해 주세요.',
  shareUnavailableTitle: '공유할 수 없어요',
  shareUnavailableMessage: '이 기기에서 공유할 수 있는 앱을 찾지 못했어요.',
  shareFailedTitle: '공유하지 못했어요',
  shareFailedMessage: '잠시 후 다시 시도해 주세요.',
  shareText: '이번 주 우리 아이 유아식 메뉴 🍽\n한끼에서 골라봤어요.',
  shareCardTitle: '이번 주 유아식 메뉴',
  shareCardTitleLine2: '',
  shareCardBrandName: '한끼',
  shareCardBrandTagline: '우리 가족 오늘 뭐 먹지?',
  loadingMessage: '이번 주 메뉴를 고르고 있어요',
  errorTitle: '메뉴를 만들지 못했어요',
  errorMessage: '지금은 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
  retryButton: '다시 골라보기',
  cookTime: (minutes: number) => `${minutes}분`,
  recipeA11y: (dayLabel: string, name: string, minutes: number) =>
    `${dayLabel}요일, ${name}, ${minutes}분. 레시피 보기`,
  guidanceTitle: '유아식 안내',
  guidanceLine:
    '아이의 식사 경험과 알레르기를 확인하며 활용해보세요.',
  mealShareLine: (mealLabel: string) => `끼니 · ${mealLabel}`,
} as const;
