/**
 * Toddler safety / content-review policy (Hankki v1.1).
 *
 * Not attached to Recipe in this sprint. Does not assign toddler audience.
 * Does not encode mg sodium/sugar cutoffs or a 1–2 vs 3–5 app filter.
 *
 * Official sources are recorded as URLs/titles. Do not treat this file as
 * medical advice — it only structures review signals for authors.
 */

import type { StandardMealType } from './recipeStandardMetadataTypes';

/** KDCA: 유아기 = 1~5세 (생후 12개월~만 5세). Single product scope. */
export const TODDLER_AGE_SCOPE = {
  labelKo: '유아기',
  minInclusiveYears: 1,
  maxInclusiveYears: 5,
  notes:
    'Do not split recipe audiences into 1–2 vs 3–5. 표준보육과정 0–1/2/3–5 and 식품안전나라 취학 전(만 3~5세) 영양교육 자료는 다른 분류다.',
} as const;

/**
 * App filter decision. 1–2 / 3–5 appear in 보육·급식 형태 지도 as serving methods,
 * not as KDCA nutrition audiences. Do not add them to RecipeAudience.
 */
export const TODDLER_APP_AGE_FILTER_DECISION = {
  splitRecipeAudiences: false,
  keepSingleToddlerAudience: true,
  formGuidanceIsAuthorChecklistOnly: true,
} as const;

export const TODDLER_POLICY_SOURCES = {
  kdcaToddlerNutrition: {
    id: 'kdca_toddler_nutrition',
    title: '식이영양(영유아) — 질병관리청 국가건강정보포털',
    url: 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212',
    usedFor: 'age_scope',
  },
  koreaPolicyHoney: {
    id: 'korea_kr_honey_infant',
    title: '1세 미만 아기에게 벌꿀 먹이면 안 되는 이유 — 대한민국 정책브리핑 (식품안전나라 안내)',
    url: 'https://www.korea.kr/news/cardnewsView.do?newsId=148863448',
    usedFor: 'honey_baby_not_toddler_cutoff',
  },
  foodSafetyKoreaChild: {
    id: 'foodsafetykorea_child_portal',
    title: '어린이 식품안전 — 식품안전나라 (어린이급식관리지원센터 등록 안내 포함)',
    url: 'https://www.foodsafetykorea.go.kr/portal/specialInfo/childFoodSafetyGuardArea.do',
    usedFor: 'institutional_child_food_safety',
  },
  childcareMealForm: {
    id: 'childcare_meal_choking_form',
    title: '어린이집 급식 식단 안내 — 질식 위험 음식 주의 (떡·포도·방울토마토·메추리알 등 작게 제공)',
    url: 'https://info.childcare.go.kr/info/pnis/search/PnisFileDownload.jsp?STCODE=11650000451&flag=DNLL&wkyymm=202407',
    usedFor: 'choking_form_cautions',
  },
  childcareMealGuideline2025: {
    id: 'childcare_child_menu_guideline_2025',
    title: '어린이 식단운영·관리지침 안내 자료 — 둥근 매끄러운 음식·견과·찰진 떡은 형태 조정/연령별 제공 방법',
    url: 'https://info.childcare.go.kr/info_html5/pnis/search/PnisFileDownload.jsp?STCODE=41410000196&flag=DNLL&wkyymm=202511',
    usedFor: 'choking_form_cautions',
  },
} as const;

/**
 * Official honey rule applies to baby (<12 months), not to KDCA toddler (1–5).
 * Catalog keeps honeyListed / honey_listed only. Do not auto-exclude toddler.
 */
export const HONEY_POLICY = {
  babyUnder12Months: 'do_not_give' as const,
  toddler1to5: 'signal_only' as const,
  autoExcludeToddler: false,
} as const;

/** No mg/g cutoffs. Nutrition.calorie must not generate 저염/저당 copy. */
export const SODIUM_SUGAR_POLICY = {
  autoLowSodiumClaim: false,
  autoLowSugarClaim: false,
  reviewFlagsOnly: true,
} as const;

export const FORBIDDEN_TODDLER_NUTRITION_CLAIMS = ['저염', '저당', 'low_sodium', 'low_sugar'] as const;

/**
 * Observed form cautions — never a hard menu ban.
 * Author must decide adaptation vs exclude.
 */
export const TODDLER_CHOKING_CAUTION_CODES = [
  'whole_nuts_or_peanuts',
  'round_slippery_food',
  'rice_cake',
  'hard_candy',
  'seeded_food',
  'large_chunk',
  'whole_sausage_or_hotdog',
] as const;
export type ToddlerChokingCautionCode = (typeof TODDLER_CHOKING_CAUTION_CODES)[number];

export const TODDLER_TEXTURE_FLAGS = [
  'small_piece_required',
  'soft_texture_preferred',
  'supervision_recommended',
] as const;
export type ToddlerTextureFlag = (typeof TODDLER_TEXTURE_FLAGS)[number];

/** Review states only — never auto-generated from nutrition.calorie. */
export const TODDLER_SEASONING_FLAGS = [
  'seasoning_reduction_required',
  'sweetness_review_required',
] as const;
export type ToddlerSeasoningFlag = (typeof TODDLER_SEASONING_FLAGS)[number];

export const TODDLER_REVIEW_STATUSES = [
  'unreviewed',
  'needs_adaptation',
  'approved',
  'excluded',
] as const;
export type ToddlerReviewStatus = (typeof TODDLER_REVIEW_STATUSES)[number];

/**
 * Authored toddler safety review. Machines must not write approved/excluded.
 * approved is the only status that may add RecipeAudience toddler.
 */
export type ToddlerSafetyReview = {
  reviewStatus: ToddlerReviewStatus;
  chokingCautions: ToddlerChokingCautionCode[];
  textureFlags: ToddlerTextureFlag[];
  seasoningFlags: ToddlerSeasoningFlag[];
  /** Pass-through of existing allergyTags. Not a toddler exclude list. */
  allergyTagsNoted: string[];
  /** Empty when excluded. Adaptation notes for the next content sprint. */
  requiredChanges: string[];
  /**
   * Intended toddler slots after approval, copied from standardMetadata.mealTypes.
   * late_night is never a toddler slot. Empty when excluded.
   */
  intendedMealTypes: StandardMealType[];
};

export function isToddlerChokingCautionCode(value: string): value is ToddlerChokingCautionCode {
  return (TODDLER_CHOKING_CAUTION_CODES as readonly string[]).includes(value);
}

export function isToddlerReviewStatus(value: string): value is ToddlerReviewStatus {
  return (TODDLER_REVIEW_STATUSES as readonly string[]).includes(value);
}
