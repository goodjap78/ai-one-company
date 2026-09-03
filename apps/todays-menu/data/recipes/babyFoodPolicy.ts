/**
 * Baby complementary-food review helpers.
 * Suggests cautions; never assigns audience or writes approved/excluded.
 */
import type { ChildFeedCollisionFlag, RecipeCautionCode } from './recipeFamilyAudienceTypes';
import type { BabyFoodStage, BabyFoodTexture } from './recipeFamilyAudienceTypes';
import type { StandardAllergyTag } from './recipeStandardMetadataTypes';
import type { Recipe } from './types';
import {
  BABY_CHOKING_CAUTION_CODES,
  BABY_COOKING_SAFETY_FLAGS,
  BABY_HONEY_POLICY,
  BABY_PROMOTION_POLICY,
  BABY_STAGE_TEXTURE_MAPPING,
  EXISTING_GENERAL_PORRIDGE_SEVEN_IDS,
  type BabyChokingCautionCode,
  type BabyCookingSafetyFlag,
  type BabyReviewStatus,
  type BabyTextureCode,
} from './babyFoodPolicyTypes';

export type BabyFoodReviewInput = {
  recipeId: string;
  name: string;
  ingredientNames: readonly string[];
  allergyTags: readonly StandardAllergyTag[];
  honeyListed: boolean;
  cautionCodes: readonly RecipeCautionCode[];
  collisionFlags: readonly ChildFeedCollisionFlag[];
  audiences: readonly string[];
  texture: BabyFoodTexture | null;
  intendedStage: BabyFoodStage | null;
};

export type BabyFoodEvaluation = {
  reviewStatus: Extract<BabyReviewStatus, 'unreviewed'>;
  cannotAutoApprove: boolean;
  cannotAutoApproveReasons: string[];
  cannotAutoPromoteToBaby: true;
  suggestedChokingCautions: BabyChokingCautionCode[];
  suggestedCookingSafetyFlags: BabyCookingSafetyFlag[];
  allergyTagsPassThrough: StandardAllergyTag[];
  honeyListed: boolean;
  honeyOfficialBanApplies: boolean;
  textureBlockedAsSole: boolean;
};

const CHOKING_NAME_PATTERNS: Array<{ code: BabyChokingCautionCode; pattern: RegExp }> = [
  { code: 'whole_nuts_or_peanuts', pattern: /땅콩|호두|아몬드|견과|잣|캐슈|피넛/ },
  { code: 'round_slippery_food', pattern: /포도|방울토마토|블루베리|메추리알/ },
  { code: 'rice_cake', pattern: /떡/ },
  { code: 'hard_candy', pattern: /사탕|젤리|캐러멜/ },
  { code: 'seeded_food', pattern: /씨앗|씨 제거|수박씨/ },
  { code: 'large_chunk', pattern: /통삼겹|스테이크|구이아침|통감자|통고구마/ },
  { code: 'whole_sausage_or_hotdog', pattern: /소시지|핫도그|비엔나|프랑크/ },
  { code: 'raw_hard_carrot', pattern: /생당근|당근채|당근 스틱/ },
  { code: 'hard_food', pattern: /딱딱|생채소|생과일 통/ },
];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function blobOf(input: BabyFoodReviewInput): string {
  return `${input.name} ${input.ingredientNames.join(' ')}`;
}

export function toBabyFoodReviewInput(recipe: Recipe): BabyFoodReviewInput {
  const safety = recipe.familyAudience.safetySignals;
  return {
    recipeId: recipe.id,
    name: recipe.name,
    ingredientNames: recipe.ingredients.map((item) => item.name),
    allergyTags: safety.allergyTags,
    honeyListed: safety.honeyListed,
    cautionCodes: safety.cautionCodes,
    collisionFlags: recipe.familyAudience.collisionFlags,
    audiences: recipe.familyAudience.audiences,
    texture: recipe.familyAudience.babyFood?.texture ?? null,
    intendedStage: recipe.familyAudience.babyFood?.stage ?? null,
  };
}

export function suggestBabyChokingCautions(input: BabyFoodReviewInput): BabyChokingCautionCode[] {
  const blob = blobOf(input);
  const found = CHOKING_NAME_PATTERNS.filter((row) => row.pattern.test(blob)).map((row) => row.code);
  return unique(found);
}

export function suggestBabyCookingSafetyFlags(input: BabyFoodReviewInput): BabyCookingSafetyFlag[] {
  const blob = blobOf(input);
  const flags: BabyCookingSafetyFlag[] = ['texture_adaptation_required'];
  if (/닭|돼지|소고기|고기|생선|참치|연어|계란|달걀|메추리/.test(blob)) {
    flags.push('fully_cooked_required');
  }
  if (/사과|배|포도|복숭아|과일/.test(blob)) {
    flags.push('seed_peel_removal_required');
  }
  return unique(flags);
}

export function isTextureBlockedAsSoleForStage(
  stage: BabyFoodStage,
  texture: BabyTextureCode | null,
): boolean {
  if (!texture) return false;
  return BABY_STAGE_TEXTURE_MAPPING[stage].blockedAsSoleTexture.includes(texture);
}

export function isExistingGeneralPorridge(recipeId: string): boolean {
  return (EXISTING_GENERAL_PORRIDGE_SEVEN_IDS as readonly string[]).includes(recipeId);
}

/**
 * Machine evaluation. Never returns approved or excluded.
 * Never assigns baby audience. Honey and choking forms block auto-approval.
 * Allergy tags pass through and never exclude.
 */
export function evaluateBabyFoodDraft(input: BabyFoodReviewInput): BabyFoodEvaluation {
  const reasons: string[] = ['human_review_required'];
  const choking = suggestBabyChokingCautions(input);
  const cooking = suggestBabyCookingSafetyFlags(input);
  const honeyOfficialBanApplies = input.honeyListed && input.intendedStage !== 'completion';

  if (!BABY_PROMOTION_POLICY.autoPromoteGeneralRecipe) {
    reasons.push('must_not_auto_promote_general_recipe');
  }
  if (isExistingGeneralPorridge(input.recipeId)) {
    reasons.push('must_not_auto_promote_existing_porridge');
  }
  if (input.audiences.includes('baby')) {
    reasons.push('unexpected_baby_audience');
  }
  if (input.honeyListed && !BABY_HONEY_POLICY.autoApproveIfHoneyListed) {
    reasons.push('honey_listed');
  }
  if (choking.length > 0) {
    reasons.push('choking_form_present');
  }
  if (input.cautionCodes.includes('fish_bones_possible')) {
    reasons.push('fish_bones_possible');
  }
  if (
    input.intendedStage &&
    isTextureBlockedAsSoleForStage(input.intendedStage, input.texture)
  ) {
    reasons.push('texture_too_thin_for_stage');
  }

  return {
    reviewStatus: 'unreviewed',
    cannotAutoApprove: true,
    cannotAutoApproveReasons: unique(reasons),
    cannotAutoPromoteToBaby: true,
    suggestedChokingCautions: choking,
    suggestedCookingSafetyFlags: cooking,
    allergyTagsPassThrough: [...input.allergyTags],
    honeyListed: input.honeyListed,
    honeyOfficialBanApplies: input.honeyListed ? honeyOfficialBanApplies : false,
    textureBlockedAsSole: Boolean(
      input.intendedStage && isTextureBlockedAsSoleForStage(input.intendedStage, input.texture),
    ),
  };
}

export function listBabyAuthorReviewRequirements(evaluation: BabyFoodEvaluation): string[] {
  const items: string[] = [
    'human_review_required',
    'must_not_auto_approve',
    'must_not_auto_exclude',
    'must_not_auto_promote_to_baby',
  ];

  for (const reason of evaluation.cannotAutoApproveReasons) {
    if (reason !== 'human_review_required') items.push(`resolve:${reason}`);
  }
  for (const code of evaluation.suggestedChokingCautions) {
    items.push(`inspect_choking:${code}`);
  }
  for (const flag of evaluation.suggestedCookingSafetyFlags) {
    items.push(`inspect_cooking:${flag}`);
  }
  if (evaluation.allergyTagsPassThrough.length > 0) {
    items.push('allergy_parent_filter_only');
  }
  if (evaluation.honeyListed) {
    items.push('honey_do_not_auto_approve');
  }

  return unique(items);
}

export function assertNoBabyAutoApprove(status: BabyReviewStatus): boolean {
  return status !== 'approved' && status !== 'excluded';
}

export { BABY_CHOKING_CAUTION_CODES, BABY_COOKING_SAFETY_FLAGS };
