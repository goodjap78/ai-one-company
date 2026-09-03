/**
 * Authored toddler candidate reviews (Hankki v1.1).
 *
 * Does not rewrite recipe bodies. Does not add toddler audience unless
 * reviewStatus is approved. This sprint: 0 approved.
 */
import type { StandardMealType } from './recipeStandardMetadataTypes';
import type { ToddlerSafetyReview } from './toddlerSafetyPolicyTypes';

export const TODDLER_CANDIDATE_REVIEW_IDS = [
  '019',
  '059',
  '074',
  '078',
  'recipe_0110',
  'recipe_0112',
  'recipe_0167',
  'recipe_0169',
  'recipe_0292',
  'recipe_0309',
  'recipe_0310',
  'recipe_0312',
  'recipe_0313',
  'recipe_0315',
  'recipe_0316',
  'recipe_0319',
] as const;

export type ToddlerCandidateReviewId = (typeof TODDLER_CANDIDATE_REVIEW_IDS)[number];

const BREAKFAST: StandardMealType[] = ['breakfast'];
const BREAKFAST_LUNCH: StandardMealType[] = ['breakfast', 'lunch'];
const BREAKFAST_LUNCH_DINNER: StandardMealType[] = ['breakfast', 'lunch', 'dinner'];
const LUNCH_DINNER: StandardMealType[] = ['lunch', 'dinner'];
const DINNER: StandardMealType[] = ['dinner'];

export const TODDLER_CANDIDATE_REVIEWS: Record<ToddlerCandidateReviewId, ToddlerSafetyReview> = {
  '019': {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required', 'sweetness_review_required'],
    allergyTagsNoted: ['egg'],
    intendedMealTypes: BREAKFAST_LUNCH,
    requiredChanges: [
      '썰기 단계가 “먹기 좋은 크기”만 있어 toddler 한입 크기 안내가 필요함',
      '설탕 1/2작은술 단맛 검수 필요',
      '소금 간 조정 검토 필요',
      '당근·대파 조각이 실제로 작은지 단계에 명시 필요',
    ],
  },
  '059': {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg', 'milk'],
    intendedMealTypes: BREAKFAST_LUNCH_DINNER,
    requiredChanges: [
      '스캐폴드 단계라 실제 크기·익힘 근거가 부족함. 본문을 채운 뒤 재검수',
      '토마토 형태(둥글고 미끄러울 수 있음) 작게 자르는 안내 필요',
      '후추·소금 간 조정 검토 필요',
      '오믈렛을 toddler 한입 크기로 자르는 단계 필요',
    ],
  },
  '074': {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'soft_texture_preferred'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: [],
    intendedMealTypes: DINNER,
    requiredChanges: [
      'unclassified_kids_meal 충돌을 해소해야 함 (연령 명시 또는 kids_meal 재검토)',
      '스캐폴드 단계라 감자·당근·브로콜리 크기/무르게 익히기 근거가 없음',
      '소금 간 조정 검토 필요',
      '일반 수프를 toddler용 별도 레시피로 만드는 편이 나음',
    ],
  },
  '078': {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'soft_texture_preferred', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['chicken'],
    intendedMealTypes: DINNER,
    requiredChanges: [
      'unclassified_kids_meal 충돌을 해소해야 함',
      '스캐폴드 단계라 닭가슴살 건더기 크기 근거가 없음. 작은 조각 안내 필요',
      '단단한 채소 무르게 익히기 단계 필요',
      '소금 간 조정 검토 필요',
      '일반 수프를 toddler용 별도 레시피로 만드는 편이 나음',
    ],
  },
  recipe_0110: {
    reviewStatus: 'excluded',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg'],
    intendedMealTypes: [],
    requiredChanges: [
      '청양고추가 재료·단계에 포함되어 현재 본문을 toddler feed에 넣을 수 없음',
      'late_night / 야식 슬롯 충돌. toddler 끼니로 쓰지 않음',
      '일반 레시피를 순한 계란찜으로 바꾸지 않음. 별도 순한 메뉴가 필요함',
    ],
  },
  recipe_0112: {
    reviewStatus: 'excluded',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: [],
    allergyTagsNoted: ['soy', 'egg'],
    intendedMealTypes: [],
    requiredChanges: [
      '청양고추가 재료·단계에 포함되어 현재 본문을 toddler feed에 넣을 수 없음',
      '간장 양념 본문을 영유아식으로 바꾸지 않음. 별도 순한 두부찜이 필요함',
    ],
  },
  recipe_0167: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg', 'milk'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '후추가 단계에 들어가 있어 toddler용 조미 검토 필요',
      '소금 1/4작은술 간 조정 검토 필요',
      '식감은 부드러우나 일반 조미 본문을 그대로 승인하지 않음',
    ],
  },
  recipe_0169: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg', 'milk'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '피망·당근이 잘게 다져지나 익힘 정도(단단한 채소) 재확인 필요',
      '오믈렛 완성 후 toddler 한입 크기 안내 필요',
      '소금 간 조정 검토 필요',
    ],
  },
  recipe_0292: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'soft_texture_preferred'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '시금치 3cm 길이는 toddler에게 길 수 있어 더 짧게/부드럽게 안내 필요',
      '소금 1/2작은술 간 조정 검토 필요',
      '수프 한 그릇을 toddler 끼니로 쓸지, 밥과 함께 쓸지 구성 검토 필요',
    ],
  },
  recipe_0309: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '밥 덩어리 크기 안내 필요',
      '소금 1/4작은술 간 조정 검토 필요',
      '대파 고명 크기 안내 필요',
    ],
  },
  recipe_0310: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: ['whole_sausage_or_hotdog'],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['egg', 'pork', 'wheat', 'milk'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '소시지를 0.5cm 원형으로 써는 단계는 질식 형태 위험이 남음. 세로로 가늘게 자르는 단계 필요',
      '식빵을 toddler 한입 크기로 자르는 안내 필요',
      '소금 간 조정 검토 필요',
      '이번 Sprint에서 일반 레시피 본문은 수정하지 않음',
    ],
  },
  recipe_0312: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: [],
    allergyTagsNoted: ['milk', 'wheat'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '시리얼 종류·경도가 없어 단단한 조각 여부를 판단할 수 없음. 연한 종류 지정 또는 제외 필요',
      '바나나 1cm 두께를 더 작게 자르는 안내 필요',
    ],
  },
  recipe_0313: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: ['large_chunk'],
    textureFlags: ['supervision_recommended', 'small_piece_required', 'soft_texture_preferred'],
    seasoningFlags: [],
    allergyTagsNoted: ['milk'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '통고구마를 갈라 내는 형태라 큰 덩어리 질식 주의. 작게 자르는 단계 필요',
      '뜨거우니 식힘·보호자 감독 안내 필요',
      '바나나 크기 안내 필요',
    ],
  },
  recipe_0315: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required', 'soft_texture_preferred'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['milk', 'wheat'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '식빵을 반으로만 자르면 toddler에게 큼. 한입 크기 안내 필요',
      '감자 1cm 큐브를 더 으깨/무르게 하는 안내 필요',
      '소금 1/4작은술 간 조정 검토 필요',
    ],
  },
  recipe_0316: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['milk', 'wheat'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '생사과 1cm 조각은 단단할 수 있어 더 작게 썰거나 익히는 안내 필요',
      '소금 1꼬집 간 조정 검토 필요',
      '바나나 슬라이스는 0.5cm로 비교적 작으나 toddler 감독 안내 필요',
    ],
  },
  recipe_0319: {
    reviewStatus: 'needs_adaptation',
    chokingCautions: [],
    textureFlags: ['supervision_recommended', 'small_piece_required'],
    seasoningFlags: ['seasoning_reduction_required'],
    allergyTagsNoted: ['soy', 'egg', 'wheat'],
    intendedMealTypes: BREAKFAST,
    requiredChanges: [
      '두부는 콩알 크기로 으깨지나 식빵 한입 크기 안내 필요',
      '소금 1/8작은술 간 조정 검토 필요',
      '대파 고명 크기 안내 필요',
    ],
  },
};

export function isToddlerCandidateReviewId(id: string): id is ToddlerCandidateReviewId {
  return (TODDLER_CANDIDATE_REVIEW_IDS as readonly string[]).includes(id);
}
