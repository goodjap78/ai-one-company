/**
 * Toddler safety review helpers.
 * Suggests cautions; never assigns audience or writes approved/excluded.
 */
import type { ChildFeedCollisionFlag, RecipeCautionCode } from './recipeFamilyAudienceTypes';
import type { StandardAllergyTag } from './recipeStandardMetadataTypes';
import type { Recipe } from './types';
import {
  FORBIDDEN_TODDLER_NUTRITION_CLAIMS,
  HONEY_POLICY,
  TODDLER_CHOKING_CAUTION_CODES,
  TODDLER_SEASONING_FLAGS,
  TODDLER_TEXTURE_FLAGS,
  type ToddlerChokingCautionCode,
  type ToddlerReviewStatus,
  type ToddlerSeasoningFlag,
  type ToddlerTextureFlag,
} from './toddlerSafetyPolicyTypes';

export type ToddlerSafetyReviewInput = {
  recipeId: string;
  name: string;
  ingredientNames: readonly string[];
  allergyTags: readonly StandardAllergyTag[];
  honeyListed: boolean;
  cautionCodes: readonly RecipeCautionCode[];
  collisionFlags: readonly ChildFeedCollisionFlag[];
  saltListed: boolean;
  sugarListed: boolean;
};

export type ToddlerSafetyEvaluation = {
  /** Auto path is always unreviewed. Humans set the other three. */
  reviewStatus: Extract<ToddlerReviewStatus, 'unreviewed'>;
  cannotAutoApprove: boolean;
  cannotAutoApproveReasons: string[];
  suggestedChokingCautions: ToddlerChokingCautionCode[];
  suggestedTextureFlags: ToddlerTextureFlag[];
  suggestedSeasoningFlags: ToddlerSeasoningFlag[];
  allergyTagsPassThrough: StandardAllergyTag[];
  honeyListed: boolean;
};

const CHOKING_NAME_PATTERNS: Array<{ code: ToddlerChokingCautionCode; pattern: RegExp }> = [
  { code: 'whole_nuts_or_peanuts', pattern: /땅콩|호두|아몬드|견과|잣|캐슈|피넛/ },
  { code: 'round_slippery_food', pattern: /포도|방울토마토|블루베리|메추리알/ },
  { code: 'rice_cake', pattern: /떡/ },
  { code: 'hard_candy', pattern: /사탕|젤리|캐러멜/ },
  { code: 'seeded_food', pattern: /씨앗|씨 제거|수박씨/ },
  { code: 'large_chunk', pattern: /통삼겹|스테이크|구이아침|통감자|통고구마/ },
  { code: 'whole_sausage_or_hotdog', pattern: /소시지|핫도그|비엔나|프랑크/ },
];

const AUTO_BLOCK_COLLISIONS: readonly ChildFeedCollisionFlag[] = [
  'hangover',
  'drinking_snack',
  'late_night',
  'spicy',
  'side_dish',
  'unclassified_kids_meal',
];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function blobOf(input: ToddlerSafetyReviewInput): string {
  return `${input.name} ${input.ingredientNames.join(' ')}`;
}

export function toToddlerSafetyReviewInput(recipe: Recipe): ToddlerSafetyReviewInput {
  const safety = recipe.familyAudience.safetySignals;
  return {
    recipeId: recipe.id,
    name: recipe.name,
    ingredientNames: recipe.ingredients.map((item) => item.name),
    allergyTags: safety.allergyTags,
    honeyListed: safety.honeyListed,
    cautionCodes: safety.cautionCodes,
    collisionFlags: recipe.familyAudience.collisionFlags,
    saltListed: safety.saltListed,
    sugarListed: safety.sugarListed,
  };
}

export function suggestToddlerChokingCautions(
  input: ToddlerSafetyReviewInput,
): ToddlerChokingCautionCode[] {
  const blob = blobOf(input);
  const found = CHOKING_NAME_PATTERNS.filter((row) => row.pattern.test(blob)).map((row) => row.code);
  return unique(found);
}

export function suggestToddlerTextureFlags(
  input: ToddlerSafetyReviewInput,
): ToddlerTextureFlag[] {
  const flags: ToddlerTextureFlag[] = ['supervision_recommended'];
  const cautions = suggestToddlerChokingCautions(input);
  const blob = blobOf(input);

  if (
    cautions.length > 0 ||
    /말이|오믈렛|스크램블|찜|구이|밥|시리얼|오트밀|식빵|소시지|핫도그/.test(blob)
  ) {
    flags.push('small_piece_required');
  }
  if (
    cautions.includes('rice_cake') ||
    cautions.includes('whole_nuts_or_peanuts') ||
    cautions.includes('hard_candy') ||
    cautions.includes('large_chunk') ||
    /스프|수프/.test(blob)
  ) {
    flags.push('soft_texture_preferred');
  }

  return unique(flags);
}

export function suggestToddlerSeasoningFlags(
  input: ToddlerSafetyReviewInput,
): ToddlerSeasoningFlag[] {
  const flags: ToddlerSeasoningFlag[] = [];
  if (input.saltListed) flags.push('seasoning_reduction_required');
  if (input.sugarListed) flags.push('sweetness_review_required');
  return flags;
}

/**
 * Machine evaluation. Never returns approved or excluded.
 * fish_bones_possible and child-feed collisions block auto-approval only.
 * honeyListed is recorded, not used as a toddler exclude.
 * allergyTags are passed through, not used as a toddler exclude.
 */
export function evaluateToddlerSafetyDraft(input: ToddlerSafetyReviewInput): ToddlerSafetyEvaluation {
  const reasons: string[] = [];

  if (input.cautionCodes.includes('fish_bones_possible')) {
    reasons.push('fish_bones_possible');
  }
  for (const flag of AUTO_BLOCK_COLLISIONS) {
    if (input.collisionFlags.includes(flag)) reasons.push(flag);
  }

  return {
    reviewStatus: 'unreviewed',
    cannotAutoApprove: true,
    cannotAutoApproveReasons: unique(['human_review_required', ...reasons]),
    suggestedChokingCautions: suggestToddlerChokingCautions(input),
    suggestedTextureFlags: suggestToddlerTextureFlags(input),
    suggestedSeasoningFlags: suggestToddlerSeasoningFlags(input),
    allergyTagsPassThrough: [...input.allergyTags],
    honeyListed: input.honeyListed,
  };
}

export function listToddlerAuthorReviewRequirements(evaluation: ToddlerSafetyEvaluation): string[] {
  const items: string[] = [
    'human_review_required',
    'must_not_auto_approve',
    'must_not_auto_exclude',
    'do_not_claim_low_sodium_or_low_sugar',
  ];

  for (const reason of evaluation.cannotAutoApproveReasons) {
    if (reason !== 'human_review_required') items.push(`resolve:${reason}`);
  }
  for (const code of evaluation.suggestedChokingCautions) {
    items.push(`inspect_choking:${code}`);
  }
  for (const flag of evaluation.suggestedTextureFlags) {
    items.push(`inspect_texture:${flag}`);
  }
  for (const flag of evaluation.suggestedSeasoningFlags) {
    items.push(`inspect_seasoning:${flag}`);
  }
  if (evaluation.allergyTagsPassThrough.length > 0) {
    items.push('allergy_parent_filter_only');
  }
  if (evaluation.honeyListed) {
    items.push('honey_signal_only_not_toddler_ban');
  }

  return unique(items);
}

export function assertNoAutoApprove(status: ToddlerReviewStatus): boolean {
  return status !== 'approved' && status !== 'excluded';
}

export function toddlerEvaluationUsesForbiddenNutritionClaim(evaluation: ToddlerSafetyEvaluation): boolean {
  const blob = JSON.stringify(evaluation);
  return FORBIDDEN_TODDLER_NUTRITION_CLAIMS.some((claim) => blob.includes(claim));
}

export const TODDLER_POLICY_AUTO_STATUSES_FORBIDDEN: readonly ToddlerReviewStatus[] = [
  'approved',
  'excluded',
];

export { HONEY_POLICY, TODDLER_CHOKING_CAUTION_CODES, TODDLER_SEASONING_FLAGS, TODDLER_TEXTURE_FLAGS };
