/**
 * Sprint v1.1 #5 — elementary breakfast weekly plan UI copy.
 * Static strings only. Do not send these values to analytics.
 */

export const ELEMENTARY_BREAKFAST_WEEKDAY_KO = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
} as const;

export const elementaryBreakfastWeeklyPlanCopy = {
  screenEyebrow: '초등학생 아침',
  screenTitle: '7일 식단',
  screenSubtitle: '이번 주 아침 고민,\n한 번에 해결해보세요.',
  mealSwitchBreakfast: '아침 7일',
  mealSwitchDinner: '저녁 7일',
  refreshButton: '다른 일주일 추천',
  saveImageButton: '이미지 저장',
  shareButton: '공유하기',
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
  shareText: '이번 주 우리 아이 아침 식단 🍚\n한끼에서 골라봤어요.',
  shareCardAudience: '초등학생',
  shareCardMealLine: '일주일 아침 식단',
  shareCardTipTitle: '이번 주 팁',
  shareCardTipBody: '매일 다른 메뉴로\n아침 고민 끝!',
  shareCardShoppingHintLabel: '이번 주 장보기 힌트',
  shareCardTitle: '초등학생 아침 7일 식단',
  shareCardTitleLine2: '',
  shareCardSubtitle: '이번 주 아침 고민,\n한 번에 해결해보세요.',
  shareCardBrandName: '한끼',
  shareCardBrandTagline: '우리 아이 밥 고민을 덜어드려요',
  loadingMessage: '이번 주 아침을 고르고 있어요',
  errorTitle: '식단을 만들지 못했어요',
  errorMessage: '지금은 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
  retryButton: '다시 추천받기',
  cookTime: (minutes: number) => `${minutes}분`,
  recipeA11y: (dayLabel: string, name: string, minutes: number) =>
    `${dayLabel}요일, ${name}, ${minutes}분. 레시피 보기`,
} as const;
