import type {
  AvoidedFoodPreset,
  HouseholdSize,
  MaxCookTimePreference,
  PreferredCuisine,
  SpicyTolerance,
} from '../types/aiRecommendationSettings';

export const AI_RECOMMENDATION_SETTINGS_COPY = {
  backLabel: '← 내 한끼',
  screenTitle: 'AI 추천 설정',
  screenSubtitle: '입력할수록 더 잘 맞는 메뉴를 추천해드려요.',
  optionalHint: '모든 항목은 선택 사항이에요.',
  saveHint: '변경 사항은 자동으로 저장돼요.',
  sections: {
    spicy: '매운 음식',
    cuisine: '선호 음식',
    avoided: '먹지 않는 음식',
    household: '평소 식사 인원',
    cookTime: '원하는 조리시간',
    customAvoided: '직접 입력',
  },
  customAvoidedPlaceholder: '예: 파인애플, 당근',
} as const;

export const SPICY_OPTIONS: { value: SpicyTolerance; label: string }[] = [
  { value: 'like', label: '좋아해요' },
  { value: 'normal', label: '보통이에요' },
  { value: 'dislike', label: '잘 못 먹어요' },
];

export const CUISINE_OPTIONS: { value: PreferredCuisine; label: string }[] = [
  { value: 'korean', label: '한식' },
  { value: 'western', label: '양식' },
  { value: 'chinese', label: '중식' },
  { value: 'japanese', label: '일식' },
  { value: 'snack', label: '분식' },
  { value: 'healthy', label: '건강식' },
];

export const AVOIDED_FOOD_OPTIONS: { value: AvoidedFoodPreset; label: string }[] = [
  { value: 'cucumber', label: '오이' },
  { value: 'eggplant', label: '가지' },
  { value: 'cilantro', label: '고수' },
  { value: 'seafood', label: '해산물' },
  { value: 'mushroom', label: '버섯' },
];

export const HOUSEHOLD_OPTIONS: { value: HouseholdSize; label: string }[] = [
  { value: 'solo', label: '혼밥' },
  { value: 'two', label: '2인' },
  { value: 'three_four', label: '3~4인' },
  { value: 'family', label: '가족' },
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
