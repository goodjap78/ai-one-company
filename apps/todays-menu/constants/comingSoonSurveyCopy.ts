import type {
  ComingSoonFeatureId,
  FeatureSurveyDefinition,
} from '../types/featureSurvey';

/**
 * Sprint H3-12 — Coming Soon survey copy (static).
 */

export const COMING_SOON_SURVEY_COPY = {
  voteButton: '투표하기',
  closeButton: '닫기',
  doneTitle: '의견을 보내주셔서 감사해요!',
  doneBody: '출시 우선순위에 반영할게요.',
  confirmButton: '확인',
} as const;

export const COMING_SOON_SURVEYS: Record<ComingSoonFeatureId, FeatureSurveyDefinition> = {
  kids_meal: {
    featureId: 'kids_meal',
    title: '우리 아이 식단',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'kids_breakfast', label: '초등학생 아침 메뉴' },
      { id: 'kids_picky', label: '편식 아이 메뉴' },
      { id: 'kids_nutrition_by_age', label: '연령별 영양 식단' },
      { id: 'kids_allergy', label: '알레르기 제외 추천' },
    ],
  },
  dine_out: {
    featureId: 'dine_out',
    title: '외식·포장',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'nearby_restaurants', label: '주변 맛집 추천' },
      { id: 'delivery_menus', label: '배달 메뉴 추천' },
      { id: 'takeout_deals', label: '포장 할인 정보' },
      { id: 'family_dine_out', label: '가족 외식 메뉴 추천' },
    ],
  },
  fridge: {
    featureId: 'fridge',
    title: '냉장고 털기',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'manual_ingredients', label: '보유 재료 직접 입력' },
      { id: 'photo_ingredients', label: '사진으로 재료 등록' },
      { id: 'expiry_management', label: '유통기한 관리' },
      { id: 'leftover_priority', label: '남은 재료 우선 추천' },
    ],
  },
  receipt: {
    featureId: 'receipt',
    title: '영수증 스캔',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'auto_register', label: '구매 재료 자동 등록' },
      { id: 'auto_expense', label: '식비 자동 기록' },
      { id: 'points', label: '포인트 적립' },
      { id: 'auto_expiry', label: '유통기한 자동 계산' },
    ],
  },
  pet: {
    featureId: 'pet',
    title: '반려생활',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'pet_treats', label: '반려동물 간식 추천' },
      { id: 'homemade_treats', label: '수제 간식 레시피' },
      { id: 'unsafe_foods', label: '먹으면 안 되는 음식 안내' },
      { id: 'pet_health_log', label: '건강 기록' },
    ],
  },
  health: {
    featureId: 'health',
    title: '건강 식단',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'diet', label: '다이어트 식단' },
      { id: 'low_sugar', label: '저당 식단' },
      { id: 'low_sodium', label: '저염 식단' },
      { id: 'condition_based', label: '질환별 식단' },
    ],
  },
  reward: {
    featureId: 'reward',
    title: '한끼 리워드 프로그램',
    description: '가장 먼저 만나고 싶은 기능을 골라주세요.',
    options: [
      { id: 'attendance_points', label: '출석 포인트' },
      { id: 'cooking_points', label: '요리 인증 포인트' },
      { id: 'receipt_points', label: '영수증 등록 포인트' },
      { id: 'invite_points', label: '친구 초대 포인트' },
    ],
  },
};

export function getComingSoonSurvey(
  featureId: ComingSoonFeatureId,
): FeatureSurveyDefinition {
  return COMING_SOON_SURVEYS[featureId];
}
