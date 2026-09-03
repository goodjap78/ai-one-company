/**
 * Baby complementary-food (이유식) policy (Hankki v1.1).
 *
 * Not attached to Recipe. Does not assign `baby` audience. Does not create
 * recipes, UI, or Home/Fridge exclusion. Do not invent medical cutoffs.
 *
 * Authoritative source for this file: 질병관리청 국가건강정보포털
 * 「식이영양(영유아)」 / 「이유기보충식(이유식)」 (cntnts_sn=5212).
 */

import type {
  BabyFoodMonthRange,
  BabyFoodStage,
  BabyFoodTexture,
} from './recipeFamilyAudienceTypes';
import { TODDLER_CHOKING_CAUTION_CODES, TODDLER_REVIEW_STATUSES } from './toddlerSafetyPolicyTypes';
import type { ToddlerChokingCautionCode, ToddlerReviewStatus } from './toddlerSafetyPolicyTypes';

export const BABY_POLICY_SOURCES = {
  kdcaInfantNutrition: {
    id: 'kdca_infant_nutrition',
    title: '식이영양(영유아) / 이유기보충식(이유식) — 질병관리청 국가건강정보포털',
    url: 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212',
    usedFor:
      'stages, typical start ~6 months, honey <12 months, cooking safety, allergy introduce-one-at-a-time',
  },
} as const;

/**
 * Childcare/급식 “초기·중기·후기” month bands (e.g. 4–5 / 6–8 / 9–11) are a
 * different taxonomy. Do not mix them into Hankki stage keys or UI names.
 */
export const BABY_NON_AUTHORITATIVE_STAGE_SYSTEMS = {
  childcareThreeBand: {
    labelsKo: ['초기', '중기', '후기'] as const,
    note: 'Month bands vary by 급식 자료. Not the KDCA 시작/적응/확장/전환 model.',
  },
} as const;

export const BABY_OFFICIAL_STAGE_LABELS = {
  early: { officialKo: '시작기', familiarKo: '초기' },
  middle: { officialKo: '적응기', familiarKo: '중기' },
  late: { officialKo: '확장기', familiarKo: '후기' },
  completion: { officialKo: '전환기', familiarKo: '완료기' },
} as const satisfies Record<BabyFoodStage, { officialKo: string; familiarKo: string }>;

/**
 * Preferred user-facing names = KDCA terms.
 * 초기/중기/후기/완료기 collide with 급식 3-band systems and are not default UI copy.
 */
export const BABY_USER_FACING_STAGE_NAMES = {
  preferred: ['시작기', '적응기', '확장기', '전환기'] as const,
  avoidAsDefault: ['초기', '중기', '후기', '완료기'] as const,
  neverShowInternalEnums: true,
} as const;

/**
 * Month ranges stored only when the KDCA page states them.
 *
 * 시작기 page text is garbled (“생후 약 개월 전후”). Typical start is “보통
 * 생후 약 6개월” plus developmental readiness — that is not a closed interval.
 * Do not invent early = 4–6 or 5–6.
 */
export const BABY_OFFICIAL_MONTH_RANGE_POLICY = {
  early: {
    stage: 'early' as const,
    bound: 'unspecified' as const,
    minMonths: null,
    maxMonths: null,
    qualifierKo: '보통 생후 약 6개월 전후 시작 (닫힌 개월 구간 없음)',
  },
  middle: {
    stage: 'middle' as const,
    bound: 'around' as const,
    minMonths: 7,
    maxMonths: 8,
    qualifierKo: '7~8개월 무렵',
  },
  late: {
    stage: 'late' as const,
    bound: 'range' as const,
    minMonths: 9,
    maxMonths: 11,
    qualifierKo: '9~11개월',
  },
  completion: {
    stage: 'completion' as const,
    bound: 'from' as const,
    minMonths: 12,
    maxMonths: null,
    qualifierKo: '12개월 이후 (상한 없음 — 18/24개월을 만들지 않음)',
  },
} as const;

export type BabyMonthRangeBound = 'unspecified' | 'around' | 'from' | 'range';

export function officialMonthRangeForStage(stage: BabyFoodStage): BabyFoodMonthRange {
  const row = BABY_OFFICIAL_MONTH_RANGE_POLICY[stage];
  if (row.bound === 'unspecified') return { bound: 'unspecified' };
  if (row.bound === 'from') return { bound: 'from', minMonths: row.minMonths ?? undefined };
  if (row.bound === 'around') {
    return { bound: 'around', minMonths: row.minMonths ?? undefined, maxMonths: row.maxMonths ?? undefined };
  }
  return { bound: 'range', minMonths: row.minMonths ?? undefined, maxMonths: row.maxMonths ?? undefined };
}

/** Legacy `{ minMonths, maxMonths }` without bound becomes `range`. */
export function normalizeBabyFoodMonthRange(
  input: Partial<BabyFoodMonthRange> | { minMonths?: number; maxMonths?: number },
): BabyFoodMonthRange {
  const bound = 'bound' in input ? input.bound : undefined;
  const minMonths = input.minMonths;
  const maxMonths = input.maxMonths;
  if (bound === 'unspecified') return { bound: 'unspecified' };
  if (bound === 'from') return { bound: 'from', minMonths };
  if (bound === 'around') return { bound: 'around', minMonths, maxMonths };
  if (bound === 'range') return { bound: 'range', minMonths, maxMonths };
  if (typeof minMonths === 'number' && typeof maxMonths === 'number') {
    return { bound: 'range', minMonths, maxMonths };
  }
  if (typeof minMonths === 'number') return { bound: 'from', minMonths };
  return { bound: 'unspecified' };
}

export function isOfficialBabyMonthRangeForStage(
  stage: BabyFoodStage,
  range: BabyFoodMonthRange,
): boolean {
  const official = officialMonthRangeForStage(stage);
  if (range.bound !== official.bound) return false;
  if (official.bound === 'unspecified') {
    return range.minMonths === undefined && range.maxMonths === undefined;
  }
  if (official.bound === 'from') {
    return range.minMonths === official.minMonths && range.maxMonths === undefined;
  }
  return range.minMonths === official.minMonths && range.maxMonths === official.maxMonths;
}

/**
 * Complementary-food start. The app is not a medical decision.
 *
 * Current KDCA page does not split “모유 6개월 / 분유 4~6개월” as a start rule.
 * 4~6개월 appears as pancreatic-amylase timing, not a formula-fed mandate.
 */
export const BABY_STARTING_POLICY = {
  medicalDecisionByApp: false,
  noMandatoryStartMonthCopy: true,
  kdcaTypicalStartKo: '보통 생후 약 6개월, 발달 준비(삼킴·지지앉아·머리 가누기) 기준',
  encodeBreastVsFormulaSplit: false,
  feedingModeIsNotRecipeAudience: true,
  pancreaticAmylaseNoteKo:
    '4~6개월 전후 전분 소화효소 언급은 곡류 이유 보충식 시점 참고이지, 분유 수유 시작 강제 월령이 아니다.',
} as const;

export const BABY_FOOD_TEXTURES_NOTE =
  'family_transition lives on BABY_FOOD_TEXTURES (babyFood only). thick_puree covers 진죽/진밥.';

export type BabyTextureCode = BabyFoodTexture;

export const BABY_TEXTURE_ALIASES = {
  mashed: 'mashed',
  pureed: 'thin_puree',
  thick_porridge: 'thick_puree',
  soft_lumpy: 'soft_chunks',
  finger_food: 'finger_food',
  family_transition: 'family_transition',
} as const;

/**
 * Stage ↔ texture. 확장기(9~11개월)에서 묽은 형태만 유지하는 승인을 막는다.
 * 8개월 무렵 finger food는 KDCA 4단계 본문에 없고, 급식 자료의 이차 단서다.
 */
export const BABY_STAGE_TEXTURE_MAPPING: Record<
  BabyFoodStage,
  {
    preferred: readonly BabyTextureCode[];
    allowed: readonly BabyTextureCode[];
    blockedAsSoleTexture: readonly BabyTextureCode[];
    fingerFoodNote: string | null;
  }
> = {
  early: {
    preferred: ['thin_puree', 'mashed'],
    allowed: ['thick_puree'],
    blockedAsSoleTexture: [],
    fingerFoodNote: null,
  },
  middle: {
    preferred: ['mashed', 'thick_puree'],
    allowed: ['finger_food'],
    blockedAsSoleTexture: ['liquid'],
    fingerFoodNote:
      '손으로 집어 먹기 가능 시점은 KDCA 4단계 본문에 고정되어 있지 않다. 적응기 저자로만 표시.',
  },
  late: {
    preferred: ['soft_chunks', 'finger_food', 'mashed'],
    allowed: ['thick_puree'],
    blockedAsSoleTexture: ['liquid', 'thin_puree'],
    fingerFoodNote: null,
  },
  completion: {
    preferred: ['family_transition', 'soft_chunks', 'finger_food'],
    allowed: ['mashed', 'thick_puree'],
    blockedAsSoleTexture: ['liquid', 'thin_puree'],
    fingerFoodNote: null,
  },
};

export const BABY_CHOKING_REUSED_CODES = TODDLER_CHOKING_CAUTION_CODES;
export type BabyReusedChokingCode = ToddlerChokingCautionCode;

/** User-requested names that already exist as toddler codes. */
export const BABY_CHOKING_ALIASES = {
  whole_grape: 'round_slippery_food',
  seeded_fruit: 'seeded_food',
} as const;

export const BABY_CHOKING_EXTRA_CODES = ['raw_hard_carrot', 'hard_food'] as const;
export type BabyExtraChokingCode = (typeof BABY_CHOKING_EXTRA_CODES)[number];

export const BABY_CHOKING_CAUTION_CODES = [
  ...TODDLER_CHOKING_CAUTION_CODES,
  ...BABY_CHOKING_EXTRA_CODES,
] as const;
export type BabyChokingCautionCode = (typeof BABY_CHOKING_CAUTION_CODES)[number];

/**
 * Honey: KDCA 1세 미만 금지 (Clostridium botulinum, 가열로 제거되지 않음).
 * Baby review path never auto-approves honeyListed. Official ban is <12 months
 * (시작기·적응기·확장기). 전환기(12개월 이후)는 공식 금지가 아니나 자동 승인은 없다.
 */
export const BABY_HONEY_POLICY = {
  officialBan: 'under_12_months' as const,
  autoApproveIfHoneyListed: false,
  keepHoneyListedSignal: true,
} as const;

export const BABY_COOKING_SAFETY_FLAGS = [
  'fully_cooked_required',
  'seed_peel_removal_required',
  'texture_adaptation_required',
] as const;
export type BabyCookingSafetyFlag = (typeof BABY_COOKING_SAFETY_FLAGS)[number];

export const BABY_COOKING_SAFETY_POLICY = {
  meatFullyCooked: true,
  fishFullyCooked: true,
  eggFullyCooked: true,
  fruitSeedAndPeelRemoved: true,
  textureAndSizeMatchStage: true,
  cowsMilkNotMainDrinkBefore12Months: true,
  noAddedSaltWithoutReason: true,
  autoApprove: false,
} as const;

export const BABY_ALLERGY_POLICY = {
  reuseAllergyTags: true,
  autoExcludeBecauseAllergenic: false,
  parentFilterAndDisplayOnly: true,
  kdcaCommonAllergens: [
    'milk',
    'egg',
    'peanut',
    'nuts',
    'wheat',
    'soy',
    'fish',
    'shellfish',
  ] as const,
} as const;

export const BABY_REVIEW_STATUSES = TODDLER_REVIEW_STATUSES;
export type BabyReviewStatus = ToddlerReviewStatus;

/**
 * Home / Fridge Raid exclusion is wired: baby-approved rows use the same
 * helper as toddler-approved.
 */
export const BABY_GENERAL_FEED_POLICY = {
  implemented: true,
  excludeFromHomeAutoRecommend: true,
  excludeFromFridgeRaidAutoRecommend: true,
  allowBabyFeed: true,
  allowDirectRoute: true,
  allowRecent: true,
  allowFavorite: true,
} as const;

export const BABY_PROMOTION_POLICY = {
  autoPromoteGeneralRecipe: false,
  autoPromoteExistingPorridge: false,
  approvedRequiredToAddBabyAudience: true,
  machineWritesApprovedOrExcluded: false,
} as const;

/** Batch 14 죽 6종 + 야채계란죽. General catalog — not baby food. */
export const EXISTING_GENERAL_PORRIDGE_SEVEN_IDS = [
  'recipe_0161',
  'recipe_0162',
  'recipe_0163',
  'recipe_0164',
  'recipe_0165',
  'recipe_0166',
  'recipe_0213',
] as const;

export function isBabyChokingCautionCode(value: string): value is BabyChokingCautionCode {
  return (BABY_CHOKING_CAUTION_CODES as readonly string[]).includes(value);
}

export function isBabyReviewStatus(value: string): value is BabyReviewStatus {
  return (BABY_REVIEW_STATUSES as readonly string[]).includes(value);
}
