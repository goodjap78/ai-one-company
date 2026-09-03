/**
 * Sprint v1.1 — Baby food infrastructure QA.
 * Run: npm run test:baby-infrastructure
 *
 * Schema, month-range honesty, and approval blockers stay in place.
 * Catalog now includes authored baby recipes from production sprint #1.
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { peanutOrTreeNutAllergyTags } from '../data/recipes/allergyTagDerivation';
import {
  BABY_FIRST_BATCH_RESERVATIONS,
  listBabyFirstBatchIds,
} from '../data/recipes/babyFirstBatchReservation';
import { BABY_PILOT_IDS } from '../data/recipes/babyPilotOverrides';
import { EXISTING_GENERAL_PORRIDGE_SEVEN_IDS } from '../data/recipes/babyFoodPolicyTypes';
import {
  isOfficialBabyMonthRangeForStage,
  officialMonthRangeForStage,
  normalizeBabyFoodMonthRange,
} from '../data/recipes/babyFoodPolicyTypes';
import {
  isEligibleForChildFeed,
  isExcludedFromGeneralHomeFeed,
} from '../data/recipes/recipeFamilyAudiencePolicy';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import { validateAllRecipeFamilyAudience } from '../data/recipes/validateRecipeFamilyAudience';
import {
  babySafetyReviewBlocksApproval,
  validateBabyApprovedRecipe,
} from '../data/recipes/validateBabyFoodProduction';
import type { BabySafetyReview, RecipeFamilyAudienceMetadata } from '../data/recipes/recipeFamilyAudienceTypes';
import type { Recipe } from '../data/recipes/types';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function officialReview(partial: Partial<BabySafetyReview> & Pick<BabySafetyReview, 'stage' | 'texture'>): BabySafetyReview {
  return {
    reviewStatus: 'approved',
    monthRange: officialMonthRangeForStage(partial.stage),
    chokingCautions: [],
    honeyListed: false,
    allergyTagsNoted: [],
    cookingSafetyFlags: ['texture_adaptation_required'],
    requiredChanges: [],
    ...partial,
  };
}

function withBabyAudience(recipe: Recipe, review: BabySafetyReview): Recipe {
  return {
    ...recipe,
    familyAudience: {
      ...recipe.familyAudience,
      audiences: ['general', 'baby'],
      reviewStatus: 'explicit',
      babyFood: {
        stage: review.stage,
        monthRange: review.monthRange,
        texture: review.texture,
        saltListed: false,
        sugarListed: false,
        honeyListed: review.honeyListed,
      },
      babySafetyReview: review,
    },
  };
}

console.log('Sprint v1.1 baby infrastructure QA — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby')).length === 70,
  'baby audience 70',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.babyFood !== null).length === 70,
  'babyFood on 70 recipes',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.babySafetyReview !== null).length === 70,
  'babySafetyReview on 70 recipes',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler')).length === 74,
  'toddler 74',
);
assert(
  HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('elementary')).length === 78,
  'elementary 78',
);
assert(validateAllRecipeFamilyAudience(HANKKI_RECIPES).length === 0, 'family audience issues 0');

const earlyRange = officialMonthRangeForStage('early');
assert(earlyRange.bound === 'unspecified' && earlyRange.minMonths === undefined, '시작기 unspecified');
assert(
  isOfficialBabyMonthRangeForStage('middle', { bound: 'around', minMonths: 7, maxMonths: 8 }),
  '적응기 around 7–8',
);
assert(
  isOfficialBabyMonthRangeForStage('late', { bound: 'range', minMonths: 9, maxMonths: 11 }),
  '확장기 range 9–11',
);
assert(
  isOfficialBabyMonthRangeForStage('completion', { bound: 'from', minMonths: 12 }),
  '전환기 from 12',
);
assert(
  normalizeBabyFoodMonthRange({ minMonths: 9, maxMonths: 11 }).bound === 'range',
  'legacy min+max normalizes to range',
);
assert(!isOfficialBabyMonthRangeForStage('early', { bound: 'range', minMonths: 4, maxMonths: 6 }), 'no invented 4–6');

const honeyBlock = babySafetyReviewBlocksApproval(
  officialReview({ stage: 'early', texture: 'thin_puree', honeyListed: true }),
);
assert(honeyBlock.includes('honey_listed_under_12_months'), 'honey blocks 시작기 approve');
const chokingBlock = babySafetyReviewBlocksApproval(
  officialReview({
    stage: 'middle',
    texture: 'mashed',
    chokingCautions: ['round_slippery_food'],
  }),
);
assert(chokingBlock.includes('unresolved_choking_cautions'), 'choking blocks approve');
assert(
  babySafetyReviewBlocksApproval(officialReview({ stage: 'early', texture: 'thin_puree' })).length === 0,
  'clean early review can be approved by an author',
);

const sample = HANKKI_RECIPES[0]!;
const honeyRecipe = withBabyAudience(
  sample,
  officialReview({ stage: 'early', texture: 'thin_puree', honeyListed: true }),
);
assert(
  validateBabyApprovedRecipe(honeyRecipe).some((issue) => issue.code === 'babySafetyReview.approved'),
  'validator rejects honey + 시작기 approved',
);
const chokingRecipe = withBabyAudience(
  sample,
  officialReview({
    stage: 'late',
    texture: 'soft_chunks',
    chokingCautions: ['hard_food'],
  }),
);
assert(
  validateBabyApprovedRecipe(chokingRecipe).some((issue) =>
    issue.message.includes('unresolved_choking_cautions'),
  ),
  'validator rejects unresolved choking approved',
);

const reservedIds = listBabyFirstBatchIds();
assert(reservedIds.length === 18, '18 reserved ids');
assert(reservedIds[0] === 'recipe_0336' && reservedIds[17] === 'recipe_0353', 'id range 0336–0353');
assert(
  reservedIds.every((id) => HANKKI_RECIPES.some((recipe) => recipe.id === id)),
  'reserved ids are filled',
);
assert(
  reservedIds.every((id) => (BABY_PILOT_IDS as readonly string[]).includes(id)),
  'first-batch reserved ids stay in the pilot list',
);
assert(BABY_PILOT_IDS.length === 70, 'pilot 70 including batch3 +10');
assert(
  BABY_FIRST_BATCH_RESERVATIONS.some((row) => row.name === '두부무른밥'),
  'uses 두부무른밥',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.every((row) => row.name !== '두부모른밥'),
  'does not use 두부모른밥',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.some((row) => row.name === '단호박쌀죽'),
  'uses 단호박쌀죽',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.every((row) => row.name !== '단호박죽'),
  'does not reuse 단호박죽',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.some((row) => row.name === '이유식계란찜'),
  'uses 이유식계란찜',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.every((row) => row.name !== '아기계란찜'),
  'does not keep 아기계란찜',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.some((row) => row.name === '고구마막대'),
  'uses 고구마막대',
);
assert(
  BABY_FIRST_BATCH_RESERVATIONS.every((row) => row.name !== '고구마스틱' && row.name !== '찐고구마막대'),
  'does not use 고구마스틱 or 찐고구마막대',
);

const otherNames = HANKKI_RECIPES.filter((recipe) => !reservedIds.includes(recipe.id)).map(
  (recipe) => recipe.name,
);
const exactNameHits = BABY_FIRST_BATCH_RESERVATIONS.filter((row) => otherNames.includes(row.name));
assert(exactNameHits.length === 0, `no exact name collisions with existing catalog (got ${exactNameHits.map((row) => row.name).join(',')})`);

assert(
  EXISTING_GENERAL_PORRIDGE_SEVEN_IDS.every((id) => {
    const recipe = HANKKI_RECIPES.find((row) => row.id === id);
    return recipe ? !recipe.familyAudience.audiences.includes('baby') : false;
  }),
  'porridge 7 remain not-baby',
);

const toddlerIds = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('toddler'),
).map((recipe) => recipe.id);
const babyIds = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('baby'),
).map((recipe) => recipe.id);
assert(listGeneralHomeExcludedRecipeIds().length === 144, 'home exclusion 144 toddler+baby');
assert(
  toddlerIds.every((id) => listGeneralHomeExcludedRecipeIds().includes(id)),
  'toddler exclusion unchanged',
);
assert(
  babyIds.every((id) => listGeneralHomeExcludedRecipeIds().includes(id)),
  'baby exclusion wired',
);

const babyApprovedMeta = {
  ...sample.familyAudience,
  audiences: ['general', 'baby'],
  babySafetyReview: officialReview({ stage: 'early', texture: 'thin_puree' }),
} as RecipeFamilyAudienceMetadata;
assert(isExcludedFromGeneralHomeFeed(babyApprovedMeta), 'baby approved is excluded from general auto-discovery');
assert(
  !isExcludedFromGeneralHomeFeed(sample.familyAudience),
  'current catalog sample stays in general pool unless toddler-approved',
);
assert(
  isEligibleForChildFeed(
    HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0336')!.familyAudience,
    { audience: 'baby' },
  ).ok,
  'authored baby recipes are baby-feed eligible',
);

assert(
  peanutOrTreeNutAllergyTags('아몬드', 'peanut').join(',') === 'nuts',
  'almond + peanut icon → nuts',
);
assert(peanutOrTreeNutAllergyTags('호두', 'peanut').join(',') === 'nuts', 'walnut → nuts');
assert(peanutOrTreeNutAllergyTags('견과류', 'peanut').join(',') === 'nuts', '견과 → nuts');
assert(peanutOrTreeNutAllergyTags('피넛버터', 'peanut').join(',') === 'peanut', 'peanut butter stays peanut');
assert(peanutOrTreeNutAllergyTags('캐슈', 'peanut').join(',') === 'nuts', 'cashew name → nuts');

const almondRow = HANKKI_RECIPES.find((recipe) => recipe.id === '030');
assert(Boolean(almondRow), '멸치볶음 exists');
if (almondRow) {
  assert(almondRow.standardMetadata.allergyTags.includes('nuts'), '030 tags nuts');
  assert(!almondRow.standardMetadata.allergyTags.includes('peanut'), '030 does not tag peanut for 아몬드');
}
const peanutButter = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0118');
assert(Boolean(peanutButter), '피넛버터토스트 exists');
if (peanutButter) {
  assert(peanutButter.standardMetadata.allergyTags.includes('peanut'), '0118 keeps peanut');
  assert(!peanutButter.standardMetadata.allergyTags.includes('nuts'), '0118 is not tree-nut');
}
const walnutRow = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0294');
if (walnutRow) {
  assert(walnutRow.standardMetadata.allergyTags.includes('nuts'), '호두볼 tags nuts');
  assert(!walnutRow.standardMetadata.allergyTags.includes('peanut'), '호두볼 does not tag peanut');
}

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED baby infrastructure QA');
