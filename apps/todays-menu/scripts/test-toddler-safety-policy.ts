/**
 * Sprint v1.1 — Toddler safety policy QA.
 * Run: npm run test:toddler-safety-policy
 *
 * Does not assign toddler audience, write recipes, or change UI.
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { isEligibleForChildFeed } from '../data/recipes/recipeFamilyAudiencePolicy';
import {
  evaluateToddlerSafetyDraft,
  listToddlerAuthorReviewRequirements,
  toddlerEvaluationUsesForbiddenNutritionClaim,
  toToddlerSafetyReviewInput,
} from '../data/recipes/toddlerSafetyPolicy';
import {
  HONEY_POLICY,
  SODIUM_SUGAR_POLICY,
  TODDLER_AGE_SCOPE,
  TODDLER_APP_AGE_FILTER_DECISION,
  TODDLER_CHOKING_CAUTION_CODES,
  TODDLER_REVIEW_STATUSES,
  TODDLER_SEASONING_FLAGS,
  TODDLER_TEXTURE_FLAGS,
} from '../data/recipes/toddlerSafetyPolicyTypes';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

/** Content-audit STRONG 16 — review checklist only. Not promoted. */
const AUDIT_16_IDS = [
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

console.log('Sprint v1.1 toddler safety policy QA — start\n');

assert(TODDLER_AGE_SCOPE.minInclusiveYears === 1, 'KDCA toddler min 1');
assert(TODDLER_AGE_SCOPE.maxInclusiveYears === 5, 'KDCA toddler max 5');
assert(
  TODDLER_APP_AGE_FILTER_DECISION.splitRecipeAudiences === false,
  'no 1–2 / 3–5 recipe audience split',
);
assert(HONEY_POLICY.babyUnder12Months === 'do_not_give', 'honey ban is baby <12 months');
assert(HONEY_POLICY.toddler1to5 === 'signal_only', 'toddler honey stays signal-only');
assert(HONEY_POLICY.autoExcludeToddler === false, 'honey does not auto-exclude toddler');
assert(SODIUM_SUGAR_POLICY.autoLowSodiumClaim === false, 'no auto 저염');
assert(SODIUM_SUGAR_POLICY.autoLowSugarClaim === false, 'no auto 저당');
assert(TODDLER_CHOKING_CAUTION_CODES.length === 7, 'seven choking caution codes');
assert(TODDLER_TEXTURE_FLAGS.length === 3, 'three texture flags');
assert(TODDLER_SEASONING_FLAGS.length === 2, 'two seasoning review flags');
assert(
  TODDLER_REVIEW_STATUSES.join(',') === 'unreviewed,needs_adaptation,approved,excluded',
  'four review statuses',
);

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler')).length === 74,
  'toddler audience 74',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby')).length === 70,
  'baby audience 70 on dedicated recipes',
);

const fishBones = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.safetySignals.cautionCodes.includes('fish_bones_possible'),
);
assert(fishBones.length >= 1, `fish_bones_possible exists in catalog (got ${fishBones.length})`);
assert(
  fishBones.every((recipe) => {
    const evaluation = evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(recipe));
    return (
      evaluation.reviewStatus === 'unreviewed' &&
      evaluation.cannotAutoApproveReasons.includes('fish_bones_possible')
    );
  }),
  'fish_bones_possible never auto-approves toddler',
);

const honeyRows = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.safetySignals.honeyListed);
assert(honeyRows.length >= 1, `honeyListed exists (got ${honeyRows.length})`);
assert(
  honeyRows.every((recipe) => {
    const evaluation = evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(recipe));
    return (
      evaluation.honeyListed &&
      !evaluation.cannotAutoApproveReasons.includes('honey_listed') &&
      listToddlerAuthorReviewRequirements(evaluation).includes('honey_signal_only_not_toddler_ban')
    );
  }),
  'honeyListed is a signal, not a toddler exclude',
);

const eggAllergy = HANKKI_RECIPES.find((recipe) =>
  recipe.familyAudience.safetySignals.allergyTags.includes('egg'),
);
assert(Boolean(eggAllergy), 'egg allergy tag exists');
if (eggAllergy) {
  const evaluation = evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(eggAllergy));
  assert(
    evaluation.allergyTagsPassThrough.includes('egg') &&
      !evaluation.cannotAutoApproveReasons.includes('egg') &&
      listToddlerAuthorReviewRequirements(evaluation).includes('allergy_parent_filter_only'),
    'allergyTags pass through; not auto-exclude',
  );
}

const sausage = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0310');
assert(Boolean(sausage), '소시지스크램블 exists');
if (sausage) {
  const evaluation = evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(sausage));
  assert(
    evaluation.suggestedChokingCautions.includes('whole_sausage_or_hotdog'),
    'sausage is a choking-form caution, not a ban',
  );
  assert(evaluation.reviewStatus === 'unreviewed', 'sausage stays unreviewed');
}

const syntheticApprovedBlocked = evaluateToddlerSafetyDraft({
  recipeId: 'synthetic_mild_egg',
  name: '계란찜',
  ingredientNames: ['계란'],
  allergyTags: ['egg'],
  honeyListed: false,
  cautionCodes: [],
  collisionFlags: [],
  saltListed: false,
  sugarListed: false,
});
assert(syntheticApprovedBlocked.reviewStatus === 'unreviewed', 'mild recipe is still unreviewed');
assert(syntheticApprovedBlocked.cannotAutoApprove, 'STRONG-like input is not auto-approved');
assert(
  !toddlerEvaluationUsesForbiddenNutritionClaim(syntheticApprovedBlocked),
  'evaluation JSON has no 저염/저당 claims',
);

console.log('\nEXISTING_16_REVIEW_REQUIREMENTS\n');
for (const id of AUDIT_16_IDS) {
  const recipe = HANKKI_RECIPES.find((row) => row.id === id);
  assert(Boolean(recipe), `audit id present: ${id}`);
  if (!recipe) continue;
  const evaluation = evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(recipe));
  assert(evaluation.reviewStatus === 'unreviewed', `${id} stays unreviewed`);
  assert(
    !recipe.familyAudience.audiences.includes('toddler'),
    `${id} is not toddler audience`,
  );
  const toddlerFeed = isEligibleForChildFeed(recipe.familyAudience, { audience: 'toddler' });
  assert(!toddlerFeed.ok, `${id} toddler feed remains ineligible`);
  assert(
    recipe.familyAudience.toddlerSafetyReview?.reviewStatus !== 'approved',
    `${id} authored status is not approved`,
  );
  const requirements = listToddlerAuthorReviewRequirements(evaluation);
  console.log(
    [
      id,
      recipe.name,
      `choking=${evaluation.suggestedChokingCautions.join('|') || '-'}`,
      `texture=${evaluation.suggestedTextureFlags.join('|')}`,
      `seasoning=${evaluation.suggestedSeasoningFlags.join('|') || '-'}`,
      `allergy=${evaluation.allergyTagsPassThrough.join('|') || '-'}`,
      `block=${evaluation.cannotAutoApproveReasons.filter((row) => row !== 'human_review_required').join('|') || '-'}`,
      `items=${requirements.length}`,
    ].join(' · '),
  );
}

const catalogEvaluations = HANKKI_RECIPES.map((recipe) =>
  evaluateToddlerSafetyDraft(toToddlerSafetyReviewInput(recipe)),
);
assert(
  catalogEvaluations.every((row) => row.reviewStatus === 'unreviewed'),
  'catalog evaluations never approved/excluded',
);
assert(
  catalogEvaluations.every((row) => !toddlerEvaluationUsesForbiddenNutritionClaim(row)),
  'no evaluation emits 저염/저당',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED toddler safety policy QA');
