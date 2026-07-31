import type {
  AvoidedFoodPreset,
  HouseholdSize,
  MaxCookTimePreference,
  PreferredCuisine,
  PreferredDishType,
  PreferredSituation,
  SpicyTolerance,
} from '../types/aiRecommendationSettings';

export const AI_RECOMMENDATION_SETTINGS_COPY = {
  backLabel: '← 내 한끼',
  screenTitle: 'AI 추천 메뉴 설정',
  screenSubtitle: '취향을 알려주시면 한끼가 더 잘 맞는 메뉴를 추천해드려요.',
  optionalHint: '모든 항목은 선택사항이며 언제든 변경할 수 있어요.',
  saveButton: '설정 저장',
  saveSuccess: '추천 설정을 저장했어요.',
  saveNoChanges: '변경된 내용이 없어요.',
  saving: '저장 중…',
  resetButton: '추천 설정 초기화',
  resetHint: '입력한 음식 취향과 추천 조건을 처음 상태로 되돌립니다.',
  resetConfirmTitle: '추천 설정을 초기화할까요?',
  resetConfirmBody:
    '좋아하는 음식, 먹지 않는 재료, 조리시간 등\n저장한 추천 설정이 모두 삭제됩니다.\n즐겨찾기와 최근 먹은 메뉴는 삭제되지 않아요.',
  resetCancel: '취소',
  resetConfirm: '초기화',
  resetSuccess: '추천 설정을 초기화했어요.',
  resetFailure: '초기화에 실패했어요. 다시 시도해 주세요.',
  resetting: '초기화 중…',
  sections: {
    cuisine: '선호 음식 종류',
    dishType: '좋아하는 메뉴 형태',
    favoriteIngredients: '좋아하는 재료',
    avoided: '먹지 않는 음식·재료',
    spicy: '매운맛 선호',
    cookTime: '최대 조리시간',
    household: '식사 인원',
    situation: '주로 먹는 상황',
    avoidedPresets: '자주 제외하는 재료',
    customAvoided: '직접 제외할 재료',
  },
  favoritePlaceholder: '계란, 닭고기, 두부처럼 입력해 주세요.',
  avoidedPlaceholder: '예: 파, 당근, 새우',
  addTag: '추가',
  maxTagsReached: '최대 10개까지 추가할 수 있어요.',
  duplicateTag: '이미 추가된 재료예요.',
  emptyTag: '재료를 입력해 주세요.',
  conflictTitle: '재료 설정이 겹쳐요',
  conflictFavoriteToAvoided:
    '먹지 않는 재료로 등록된 항목이에요. 좋아하는 재료에서는 제외할게요.',
  conflictAvoidedToFavorite:
    '좋아하는 재료로 등록된 항목은 먹지 않는 재료에 넣을 수 없어요. 좋아하는 재료에서 먼저 제거해 주세요.',
} as const;

export const SPICY_OPTIONS: { value: SpicyTolerance; label: string }[] = [
  { value: 'mild', label: '순한맛 선호' },
  { value: 'normal', label: '보통' },
  { value: 'like', label: '매운맛 선호' },
  { value: 'dislike', label: '매운 음식 제외' },
];

export const CUISINE_OPTIONS: { value: PreferredCuisine; label: string }[] = [
  { value: 'korean', label: '한식' },
  { value: 'chinese', label: '중식' },
  { value: 'japanese', label: '일식' },
  { value: 'western', label: '양식' },
  { value: 'snack', label: '분식' },
  { value: 'asian', label: '아시아 음식' },
  { value: 'fusion', label: '퓨전' },
];

export const DISH_TYPE_OPTIONS: { value: PreferredDishType; label: string }[] = [
  { value: 'rice', label: '밥' },
  { value: 'rice_bowl', label: '덮밥' },
  { value: 'noodle', label: '면' },
  { value: 'soup', label: '국' },
  { value: 'stew', label: '찌개' },
  { value: 'stir_fry', label: '볶음' },
  { value: 'grilled', label: '구이' },
  { value: 'fried', label: '튀김' },
  { value: 'salad', label: '샐러드' },
  { value: 'sandwich', label: '샌드위치' },
];

export const SITUATION_OPTIONS: { value: PreferredSituation; label: string }[] = [
  { value: 'solo_meal', label: '혼밥' },
  { value: 'family_meal', label: '가족 식사' },
  { value: 'kids_meal', label: '아이와 함께' },
  { value: 'quick_meal', label: '간단한 한 끼' },
  { value: 'comfort_food', label: '든든한 한 끼' },
  { value: 'light_meal', label: '가벼운 한 끼' },
];

export const AVOIDED_FOOD_OPTIONS: { value: AvoidedFoodPreset; label: string }[] = [
  { value: 'cucumber', label: '오이' },
  { value: 'eggplant', label: '가지' },
  { value: 'cilantro', label: '고수' },
  { value: 'seafood', label: '해산물' },
  { value: 'mushroom', label: '버섯' },
];

export const HOUSEHOLD_OPTIONS: { value: HouseholdSize; label: string }[] = [
  { value: 'solo', label: '1명' },
  { value: 'two', label: '2명' },
  { value: 'three_four', label: '3~4명' },
  { value: 'family', label: '5명 이상' },
];

export const COOK_TIME_OPTIONS: { value: MaxCookTimePreference; label: string }[] = [
  { value: '10', label: '10분 이하' },
  { value: '20', label: '20분 이하' },
  { value: '30', label: '30분 이하' },
  { value: 'any', label: '상관없음' },
];

export const AVOIDED_FOOD_LABELS: Record<AvoidedFoodPreset, string> = {
  cucumber: '오이',
  eggplant: '가지',
  cilantro: '고수',
  seafood: '해산물',
  mushroom: '버섯',
};
