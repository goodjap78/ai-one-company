/**
 * Sprint v1.1 — Toddler candidate review QA.
 * Run: npm run test:toddler-candidate-review
 *
 * Authored reviews only. Does not rewrite recipe bodies or add toddler audience
 * unless status is approved (this sprint: 0 approved).
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { isEligibleForChildFeed } from '../data/recipes/recipeFamilyAudiencePolicy';
import { RECIPE_FAMILY_AUDIENCE_OVERRIDES } from '../data/recipes/recipeFamilyAudienceOverrides';
import {
  TODDLER_CANDIDATE_REVIEW_IDS,
  TODDLER_CANDIDATE_REVIEWS,
} from '../data/recipes/toddlerCandidateReviews';
import { validateAllRecipeFamilyAudience } from '../data/recipes/validateRecipeFamilyAudience';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('Sprint v1.1 toddler candidate review QA — start\n');

assert(TODDLER_CANDIDATE_REVIEW_IDS.length === 16, '16 candidate ids');
assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);

const toddlerAudience = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('toddler'),
);
assert(toddlerAudience.length === 74, 'toddler audience 74 on new pilot only');
assert(
  toddlerAudience.every((recipe) => !TODDLER_CANDIDATE_REVIEW_IDS.includes(recipe.id as (typeof TODDLER_CANDIDATE_REVIEW_IDS)[number])),
  'original STRONG 16 were not promoted',
);

const babyAudience = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('baby'),
);
assert(babyAudience.length === 70, 'baby audience 70 on dedicated recipes');

const elementary = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('elementary'),
);
assert(elementary.length === 78, `elementary explicit 78 (got ${elementary.length})`);
assert(
  Object.keys(RECIPE_FAMILY_AUDIENCE_OVERRIDES).length === 222,
  'family-audience override map 222',
);

const candidateSet = new Set<string>(TODDLER_CANDIDATE_REVIEW_IDS);
const candidateRows = HANKKI_RECIPES.filter((recipe) => candidateSet.has(recipe.id));
assert(candidateRows.length === 16, 'original 16 review rows still present');

const candidateApproved = candidateRows.filter(
  (recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'approved',
);
const needsAdaptation = candidateRows.filter(
  (recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'needs_adaptation',
);
const excluded = candidateRows.filter(
  (recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'excluded',
);

assert(candidateApproved.length === 0, 'original STRONG 16 still not approved');
assert(needsAdaptation.length === 14, `needs_adaptation 14 (got ${needsAdaptation.length})`);
assert(excluded.length === 2, `excluded 2 (got ${excluded.length})`);

assert(
  excluded.every((recipe) => recipe.id === 'recipe_0110' || recipe.id === 'recipe_0112'),
  'excluded ids are 청양고추 본문 2건',
);

for (const id of TODDLER_CANDIDATE_REVIEW_IDS) {
  const recipe = HANKKI_RECIPES.find((row) => row.id === id);
  const review = TODDLER_CANDIDATE_REVIEWS[id];
  assert(Boolean(recipe), `${id} exists in catalog`);
  if (!recipe) continue;
  assert(recipe.familyAudience.toddlerSafetyReview?.reviewStatus === review.reviewStatus, `${id} review attached`);
  assert(!recipe.familyAudience.audiences.includes('toddler'), `${id} has no toddler audience`);
  const feed = isEligibleForChildFeed(recipe.familyAudience, { audience: 'toddler' });
  assert(!feed.ok, `${id} toddler feed ineligible`);
  assert(feed.reasons.includes('missing_audience:toddler'), `${id} missing toddler audience`);
  assert(feed.reasons.includes('toddler_not_approved'), `${id} not approved`);
  assert(review.requiredChanges.length >= 1, `${id} records required changes`);
  if (review.reviewStatus === 'excluded') {
    assert(review.intendedMealTypes.length === 0, `${id} excluded has no toddler slots`);
  } else {
    assert(review.intendedMealTypes.length >= 1, `${id} keeps intended slots from existing mealTypes`);
    assert(!review.intendedMealTypes.includes('late_night'), `${id} does not use late_night as toddler slot`);
    assert(
      review.intendedMealTypes.every((slot) => recipe.standardMetadata.mealTypes.includes(slot)),
      `${id} intended slots reused from standardMetadata`,
    );
  }
}

const elementaryFeed = HANKKI_RECIPES.filter(
  (recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'elementary' }).ok,
);
assert(elementaryFeed.length === 78, `elementary feed still 78 (got ${elementaryFeed.length})`);

const issues = validateAllRecipeFamilyAudience(HANKKI_RECIPES);
assert(issues.length === 0, `family-audience validation 0 (got ${issues.length})`);

assert(
  toddlerAudience.every((recipe) => recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'approved'),
  'new toddler recipes are approved',
);
assert(
  toddlerAudience.every((recipe) => recipe.nutrition.source === 'unverified'),
  'toddler nutrition.source is unverified',
);
assert(
  toddlerAudience.every((recipe) => !recipe.familyAudience.safetySignals.honeyListed),
  'toddler recipes do not list honey',
);
assert(
  toddlerAudience.every(
    (recipe) => !recipe.familyAudience.safetySignals.cautionCodes.includes('fish_bones_possible'),
  ),
  'toddler recipes have no fish_bones_possible',
);
assert(
  toddlerAudience.every((recipe) => !recipe.ingredients.some((item) => /청양|고추장|고춧가루|꿀/.test(item.name))),
  'toddler recipes omit chili paste and honey',
);

const breakfast = toddlerAudience.filter((recipe) => recipe.standardMetadata.mealTypes.includes('breakfast'));
const lunch = toddlerAudience.filter((recipe) => recipe.standardMetadata.mealTypes.includes('lunch'));
const dinner = toddlerAudience.filter((recipe) => recipe.standardMetadata.mealTypes.includes('dinner'));
const snack = toddlerAudience.filter((recipe) => recipe.standardMetadata.mealTypes.includes('snack'));
assert(breakfast.length === 7, `toddler breakfast 7 (got ${breakfast.length})`);
assert(lunch.length === 13, `toddler lunch 13 (got ${lunch.length})`);
assert(dinner.length === 17, `toddler dinner 17 (got ${dinner.length})`);
assert(snack.length === 5, `toddler snack 5 (got ${snack.length})`);
assert(
  snack.every((recipe) => !recipe.standardMetadata.mealTypes.includes('late_night')),
  'snack is not late_night',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED toddler candidate review QA');
