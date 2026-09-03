/**
 * Sprint v1.1 — Baby food policy QA.
 * Run: npm run test:baby-food-policy
 *
 * Policy helpers still never auto-approve or auto-promote.
 * Catalog may contain authored baby recipes; machines still return unreviewed.
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { isEligibleForChildFeed } from '../data/recipes/recipeFamilyAudiencePolicy';
import { isExcludedFromGeneralHomeByRecipeId } from '../data/recipes/generalHomeFeedExclusion';
import {
  evaluateBabyFoodDraft,
  isExistingGeneralPorridge,
  isTextureBlockedAsSoleForStage,
  listBabyAuthorReviewRequirements,
  toBabyFoodReviewInput,
} from '../data/recipes/babyFoodPolicy';
import {
  BABY_ALLERGY_POLICY,
  BABY_CHOKING_ALIASES,
  BABY_CHOKING_CAUTION_CODES,
  BABY_CHOKING_EXTRA_CODES,
  BABY_COOKING_SAFETY_FLAGS,
  BABY_GENERAL_FEED_POLICY,
  BABY_HONEY_POLICY,
  BABY_OFFICIAL_MONTH_RANGE_POLICY,
  BABY_OFFICIAL_STAGE_LABELS,
  BABY_PROMOTION_POLICY,
  BABY_REVIEW_STATUSES,
  BABY_STAGE_TEXTURE_MAPPING,
  BABY_STARTING_POLICY,
  BABY_USER_FACING_STAGE_NAMES,
  EXISTING_GENERAL_PORRIDGE_SEVEN_IDS,
} from '../data/recipes/babyFoodPolicyTypes';
import { BABY_FOOD_STAGES, BABY_FOOD_TEXTURES } from '../data/recipes/recipeFamilyAudienceTypes';
import { HONEY_POLICY, TODDLER_REVIEW_STATUSES } from '../data/recipes/toddlerSafetyPolicyTypes';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Sprint v1.1 baby food policy QA — start\n');

assert(BABY_FOOD_STAGES.join(',') === 'early,middle,late,completion', 'internal stages unchanged');
assert(
  BABY_OFFICIAL_STAGE_LABELS.early.officialKo === '시작기' &&
    BABY_OFFICIAL_STAGE_LABELS.middle.officialKo === '적응기' &&
    BABY_OFFICIAL_STAGE_LABELS.late.officialKo === '확장기' &&
    BABY_OFFICIAL_STAGE_LABELS.completion.officialKo === '전환기',
  'KDCA stage labels mapped',
);
assert(BABY_USER_FACING_STAGE_NAMES.neverShowInternalEnums, 'UI must not show early/middle/late/completion');
assert(
  BABY_OFFICIAL_MONTH_RANGE_POLICY.early.bound === 'unspecified' &&
    BABY_OFFICIAL_MONTH_RANGE_POLICY.early.minMonths === null,
  '시작기 has no invented closed month range',
);
assert(
  BABY_OFFICIAL_MONTH_RANGE_POLICY.middle.minMonths === 7 &&
    BABY_OFFICIAL_MONTH_RANGE_POLICY.middle.maxMonths === 8,
  '적응기 7~8 around',
);
assert(
  BABY_OFFICIAL_MONTH_RANGE_POLICY.late.minMonths === 9 &&
    BABY_OFFICIAL_MONTH_RANGE_POLICY.late.maxMonths === 11 &&
    BABY_OFFICIAL_MONTH_RANGE_POLICY.late.bound === 'range',
  '확장기 range 9–11',
);
assert(
  BABY_OFFICIAL_MONTH_RANGE_POLICY.completion.minMonths === 12 &&
    BABY_OFFICIAL_MONTH_RANGE_POLICY.completion.maxMonths === null,
  '전환기 from 12, open max',
);

assert(BABY_STARTING_POLICY.medicalDecisionByApp === false, 'app is not medical judgment');
assert(BABY_STARTING_POLICY.noMandatoryStartMonthCopy === true, 'no must-start-at-N-months copy');
assert(BABY_STARTING_POLICY.encodeBreastVsFormulaSplit === false, 'no breast vs formula schema cutoff');
assert(BABY_STARTING_POLICY.feedingModeIsNotRecipeAudience === true, 'feeding mode is not an audience');

assert(
  BABY_STAGE_TEXTURE_MAPPING.late.blockedAsSoleTexture.includes('liquid') &&
    BABY_STAGE_TEXTURE_MAPPING.late.blockedAsSoleTexture.includes('thin_puree'),
  '확장기 cannot stay on thin liquid only',
);
assert(isTextureBlockedAsSoleForStage('late', 'thin_puree'), 'late + thin_puree blocked as sole');
assert(!isTextureBlockedAsSoleForStage('early', 'thin_puree'), 'early thin_puree is allowed');
assert(
  BABY_STAGE_TEXTURE_MAPPING.completion.preferred.includes('family_transition'),
  '전환기 prefers family_transition',
);
assert(
  (BABY_FOOD_TEXTURES as readonly string[]).includes('family_transition'),
  'family_transition is a babyFood texture',
);

assert(BABY_CHOKING_ALIASES.whole_grape === 'round_slippery_food', 'whole_grape reuses round_slippery_food');
assert(BABY_CHOKING_ALIASES.seeded_fruit === 'seeded_food', 'seeded_fruit reuses seeded_food');
assert(BABY_CHOKING_EXTRA_CODES.includes('raw_hard_carrot'), 'raw_hard_carrot is baby extra');
assert(BABY_CHOKING_CAUTION_CODES.includes('hard_food'), 'hard_food is baby extra');
assert(BABY_COOKING_SAFETY_FLAGS.join(',') === 'fully_cooked_required,seed_peel_removal_required,texture_adaptation_required', 'three cooking flags');

assert(BABY_HONEY_POLICY.officialBan === 'under_12_months', 'honey ban is <12 months');
assert(BABY_HONEY_POLICY.autoApproveIfHoneyListed === false, 'honey never auto-approves baby');
assert(HONEY_POLICY.babyUnder12Months === 'do_not_give', 'shared toddler honey constant still baby <12');

assert(BABY_ALLERGY_POLICY.autoExcludeBecauseAllergenic === false, 'allergy does not auto-exclude');
assert(
  BABY_REVIEW_STATUSES.join(',') === TODDLER_REVIEW_STATUSES.join(','),
  'baby review statuses reuse toddler',
);
assert(BABY_PROMOTION_POLICY.autoPromoteGeneralRecipe === false, 'no auto-promote general');
assert(BABY_PROMOTION_POLICY.autoPromoteExistingPorridge === false, 'no auto-promote porridge');
assert(BABY_GENERAL_FEED_POLICY.implemented === true, 'general feed exclusion helper is wired');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler')).length === 74,
  'toddler audience unchanged at 28',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('elementary')).length === 78,
  'elementary audience 78',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby')).length === 70,
  'baby audience 70 on dedicated recipes',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby')).every(
    (recipe) => recipe.familyAudience.babyFood !== null,
  ),
  'baby recipes have babyFood metadata',
);

assert(EXISTING_GENERAL_PORRIDGE_SEVEN_IDS.length === 7, 'seven existing porridge ids');
for (const id of EXISTING_GENERAL_PORRIDGE_SEVEN_IDS) {
  const recipe = HANKKI_RECIPES.find((row) => row.id === id);
  assert(Boolean(recipe), `porridge present: ${id}`);
  if (!recipe) continue;
  assert(isExistingGeneralPorridge(id), `${id} flagged as existing porridge`);
  assert(!recipe.familyAudience.audiences.includes('baby'), `${id} is not baby`);
  const evaluation = evaluateBabyFoodDraft(toBabyFoodReviewInput(recipe));
  assert(evaluation.reviewStatus === 'unreviewed', `${id} stays unreviewed`);
  assert(evaluation.cannotAutoPromoteToBaby, `${id} cannot auto-promote`);
  assert(
    evaluation.cannotAutoApproveReasons.includes('must_not_auto_promote_existing_porridge'),
    `${id} porridge promotion blocked`,
  );
  assert(!isEligibleForChildFeed(recipe.familyAudience, { audience: 'baby' }).ok, `${id} baby feed ineligible`);
}

const honeyRows = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.safetySignals.honeyListed);
assert(honeyRows.length >= 1, `honeyListed exists (got ${honeyRows.length})`);
assert(
  honeyRows.every((recipe) => {
    const evaluation = evaluateBabyFoodDraft(toBabyFoodReviewInput(recipe));
    return (
      evaluation.honeyListed &&
      evaluation.cannotAutoApproveReasons.includes('honey_listed') &&
      listBabyAuthorReviewRequirements(evaluation).includes('honey_do_not_auto_approve')
    );
  }),
  'honeyListed blocks baby auto-approve',
);

const eggAllergy = HANKKI_RECIPES.find((recipe) =>
  recipe.familyAudience.safetySignals.allergyTags.includes('egg'),
);
assert(Boolean(eggAllergy), 'egg allergy tag exists');
if (eggAllergy) {
  const evaluation = evaluateBabyFoodDraft(toBabyFoodReviewInput(eggAllergy));
  assert(
    evaluation.allergyTagsPassThrough.includes('egg') &&
      !evaluation.cannotAutoApproveReasons.includes('egg') &&
      listBabyAuthorReviewRequirements(evaluation).includes('allergy_parent_filter_only'),
    'allergyTags pass through; not auto-exclude',
  );
}

const grapeSynthetic = evaluateBabyFoodDraft({
  recipeId: 'synthetic_grape',
  name: '포도퓨레',
  ingredientNames: ['포도'],
  allergyTags: [],
  honeyListed: false,
  cautionCodes: [],
  collisionFlags: [],
  audiences: ['general'],
  texture: 'thin_puree',
  intendedStage: 'late',
});
assert(grapeSynthetic.suggestedChokingCautions.includes('round_slippery_food'), 'grape maps to reused choking code');
assert(grapeSynthetic.cannotAutoApproveReasons.includes('choking_form_present'), 'choking form blocks auto-approve');
assert(grapeSynthetic.textureBlockedAsSole, 'late thin_puree is blocked as sole texture');
assert(grapeSynthetic.reviewStatus === 'unreviewed', 'synthetic stays unreviewed');

const completionHoney = evaluateBabyFoodDraft({
  recipeId: 'synthetic_completion_honey',
  name: '꿀요거트',
  ingredientNames: ['꿀', '요거트'],
  allergyTags: ['milk'],
  honeyListed: true,
  cautionCodes: [],
  collisionFlags: [],
  audiences: ['general'],
  texture: 'mashed',
  intendedStage: 'completion',
});
assert(completionHoney.cannotAutoApproveReasons.includes('honey_listed'), '전환기 honey still no auto-approve');
assert(completionHoney.honeyOfficialBanApplies === false, 'official honey ban is <12 months, not 전환기');

const catalogEvaluations = HANKKI_RECIPES.map((recipe) =>
  evaluateBabyFoodDraft(toBabyFoodReviewInput(recipe)),
);
assert(
  catalogEvaluations.every((row) => row.reviewStatus === 'unreviewed' && row.cannotAutoApprove),
  'catalog baby evaluations never approved/excluded',
);
assert(
  catalogEvaluations.every((row) => row.cannotAutoPromoteToBaby),
  'catalog never auto-promotes to baby',
);

const toddlerIds = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('toddler'),
).map((recipe) => recipe.id);
assert(
  toddlerIds.every((id) => isExcludedFromGeneralHomeByRecipeId(id)),
  'toddler general-home exclusion unchanged',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED baby food policy QA');
console.log('READY_FOR_BABY_CONTENT_AUDIT: YES');
