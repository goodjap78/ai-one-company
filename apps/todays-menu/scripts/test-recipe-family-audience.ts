/**
 * Sprint v1.1 #1–#2 — Family audience schema QA.
 * Run: npm run test:family-audience
 *
 * Home still ignores familyAudience for feed switching, except toddler-approved
 * rows are excluded from the adult Home pool. Catalog rows keep `general`.
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { RECIPE_FAMILY_AUDIENCE_OVERRIDES } from '../data/recipes/recipeFamilyAudienceOverrides';
import {
  isEligibleForChildFeed,
  isExcludedFromGeneralHomeFeed,
  shouldIgnoreFamilyAudienceForHomeFeed,
} from '../data/recipes/recipeFamilyAudiencePolicy';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import { validateAllRecipeFamilyAudience } from '../data/recipes/validateRecipeFamilyAudience';
import { createHankkiRecipe } from '../data/recipes/recipeMasterTemplate';
import { hasChildAudience } from '../data/recipes/recipeFamilyAudienceTypes';
import { TODDLER_PILOT_IDS } from '../data/recipes/toddlerPilotOverrides';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { buildRecommendationCandidatePool } from '../services/recommendation/buildCandidatePool';
import type { MenuItem } from '../types/recommendation';

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

const EXPLICIT_IDS = Object.keys(RECIPE_FAMILY_AUDIENCE_OVERRIDES);
const EXPLICIT_SET = new Set(EXPLICIT_IDS);

console.log('Sprint v1.1 family audience schema QA — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
const elementaryExplicit = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('elementary'),
);
const toddlerExplicit = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('toddler'),
);
const babyExplicit = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('baby'),
);
assert(elementaryExplicit.length === 78, `elementary explicit 78 (got ${elementaryExplicit.length})`);
assert(toddlerExplicit.length === 74, `toddler explicit 74 (got ${toddlerExplicit.length})`);
assert(babyExplicit.length === 70, `baby explicit 70 (got ${babyExplicit.length})`);
assert(EXPLICIT_IDS.length === 222, `explicit override map 222 (got ${EXPLICIT_IDS.length})`);

const missing = HANKKI_RECIPES.filter((recipe) => !recipe.familyAudience);
assert(missing.length === 0, 'every recipe has familyAudience');

const withoutGeneral = HANKKI_RECIPES.filter(
  (recipe) => !recipe.familyAudience.audiences.includes('general'),
);
assert(withoutGeneral.length === 70, `baby-only rows 70 (got ${withoutGeneral.length})`);
assert(
  withoutGeneral.every(
    (recipe) =>
      recipe.familyAudience.audiences.length === 1 && recipe.familyAudience.audiences[0] === 'baby',
  ),
  'rows without general are baby-only',
);
assert(
  HANKKI_RECIPES.filter(
    (recipe) =>
      !recipe.familyAudience.audiences.includes('baby') &&
      !recipe.familyAudience.audiences.includes('general'),
  ).length === 0,
  'non-baby catalog stays general',
);

const childAudience = HANKKI_RECIPES.filter((recipe) =>
  hasChildAudience(recipe.familyAudience.audiences),
);
assert(
  childAudience.length === EXPLICIT_IDS.length,
  `child audiences only from overrides (got ${childAudience.length})`,
);
assert(
  childAudience.every((recipe) => EXPLICIT_SET.has(recipe.id) && recipe.familyAudience.reviewStatus === 'explicit'),
  'every child audience row is an explicit override',
);
assert(
  elementaryExplicit.every((recipe) => recipe.familyAudience.audiences.includes('general')),
  'elementary rows keep general',
);
assert(
  toddlerExplicit.every(
    (recipe) =>
      recipe.familyAudience.audiences.includes('general') &&
      recipe.familyAudience.audiences.includes('toddler') &&
      !recipe.familyAudience.audiences.includes('elementary') &&
      recipe.familyAudience.toddlerSafetyReview?.reviewStatus === 'approved',
  ),
  'toddler pilot is general+toddler, approved, not elementary',
);
assert(
  babyExplicit.every(
    (recipe) =>
      recipe.familyAudience.audiences.includes('baby') &&
      !recipe.familyAudience.audiences.includes('general') &&
      !recipe.familyAudience.audiences.includes('toddler') &&
      recipe.familyAudience.babySafetyReview?.reviewStatus === 'approved',
  ),
  'baby pilot is baby-only, approved, not toddler',
);

const kidsMeal = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.kidsMealTag);
assert(kidsMeal.length === 61, `kids_meal tag preserved (got ${kidsMeal.length})`);

const unclassified = HANKKI_RECIPES.filter(
  (recipe) => recipe.familyAudience.reviewStatus === 'unclassified',
);
const promotedKidsMeal = kidsMeal.filter((recipe) => EXPLICIT_SET.has(recipe.id));
assert(
  unclassified.length === 61 - promotedKidsMeal.length,
  `unclassified kids_meal remaining ${61 - promotedKidsMeal.length} (got ${unclassified.length})`,
);
assert(
  unclassified.every((recipe) => recipe.familyAudience.kidsMealTag && !EXPLICIT_SET.has(recipe.id)),
  'unclassified rows are kids_meal without override',
);

const issues = validateAllRecipeFamilyAudience(HANKKI_RECIPES);
assert(issues.length === 0, `structural validation 0 issues (got ${issues.length})`);

const eggRoll = HANKKI_RECIPES.find((recipe) => recipe.id === '019');
assert(Boolean(eggRoll), '계란말이 exists');
if (eggRoll) {
  assert(eggRoll.familyAudience.kidsMealTag, '계란말이 keeps kids_meal');
  assert(eggRoll.familyAudience.reviewStatus === 'explicit', '계란말이 is explicit elementary');
  const childFeed = isEligibleForChildFeed(eggRoll.familyAudience, { audience: 'elementary' });
  assert(childFeed.ok, 'explicit 계란말이 qualifies for elementary feed');
}

const hangoverKids = kidsMeal.filter((recipe) =>
  recipe.familyAudience.collisionFlags.includes('hangover'),
);
assert(hangoverKids.length > 0, 'hangover collision flags detected on kids_meal');
assert(
  hangoverKids.every((recipe) => !EXPLICIT_SET.has(recipe.id)),
  'hangover kids_meal was not promoted',
);

const honeyListed = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.safetySignals.honeyListed);
assert(honeyListed.length >= 1, 'honeyListed is derived from ingredients');
assert(
  honeyListed.every((recipe) => recipe.ingredients.some((item) => item.name.includes('꿀'))),
  'honeyListed matches 꿀 ingredient names',
);

const { image: _image, familyAudience: _family, ...eggInput } = eggRoll ?? HANKKI_RECIPES[0]!;
const rebuilt = createHankkiRecipe(eggInput);
assert(rebuilt.familyAudience.reviewStatus === eggRoll?.familyAudience.reviewStatus, 'rebuild keeps reviewStatus');
assert(rebuilt.id === eggRoll?.id, 'factory rebuild preserves id');

const eligibleElementary = HANKKI_RECIPES.filter(
  (recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'elementary' }).ok,
);
assert(
  eligibleElementary.length === 78,
  `elementary child-feed eligible 78 (got ${eligibleElementary.length})`,
);
const eligibleToddler = HANKKI_RECIPES.filter(
  (recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'toddler' }).ok,
);
assert(
  eligibleToddler.length === 74,
  `toddler child-feed eligible 74 (got ${eligibleToddler.length})`,
);
const eligibleBaby = HANKKI_RECIPES.filter(
  (recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'baby' }).ok,
);
assert(eligibleBaby.length === 70, `baby child-feed eligible 70 (got ${eligibleBaby.length})`);

const toast = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0173');
assert(Boolean(toast), '햄치즈토스트 exists');
if (toast) {
  assert(toast.familyAudience.childMeal?.schoolMorningFriendly === true, 'toast schoolMorningFriendly is true');
  assert(!toast.familyAudience.kidsMealTag, 'non-kids_meal toast can still be explicit elementary');
}

const friedRice = HANKKI_RECIPES.find((recipe) => recipe.id === '002');
if (friedRice) {
  assert(friedRice.familyAudience.childMeal?.schoolMorningFriendly === null, '볶음밥 schoolMorningFriendly stays null');
}

const NEW_BREAKFAST_IDS = [
  'recipe_0305',
  'recipe_0306',
  'recipe_0307',
  'recipe_0308',
  'recipe_0309',
  'recipe_0310',
  'recipe_0311',
  'recipe_0312',
  'recipe_0313',
  'recipe_0314',
  'recipe_0315',
  'recipe_0316',
  'recipe_0317',
  'recipe_0318',
  'recipe_0319',
];
const newBreakfast = NEW_BREAKFAST_IDS.map((id) => HANKKI_RECIPES.find((recipe) => recipe.id === id));
assert(
  newBreakfast.every(Boolean),
  '15 new elementary breakfast ids exist',
);
assert(
  newBreakfast.every(
    (recipe) =>
      recipe &&
      recipe.familyAudience.reviewStatus === 'explicit' &&
      recipe.familyAudience.audiences.includes('elementary') &&
      recipe.familyAudience.audiences.includes('general') &&
      recipe.standardMetadata.mealTypes.includes('breakfast') &&
      recipe.standardMetadata.spiceLevel === 'mild' &&
      recipe.ingredients.length >= 3 &&
      recipe.recipe.steps.length >= 4 &&
      recipe.recipe.steps.length <= 6,
  ),
  'new 15 are explicit elementary breakfast with complete recipes',
);
assert(
  newBreakfast.every((recipe) => recipe && !recipe.familyAudience.safetySignals.honeyListed),
  'new 15 do not list honey',
);
assert(
  newBreakfast.every((recipe) => recipe && !recipe.familyAudience.collisionFlags.includes('spicy')),
  'new 15 are not spicy',
);

const names = HANKKI_RECIPES.map((recipe) => recipe.name);
assert(new Set(names).size === names.length, 'no duplicate recipe names');

const riceBall = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0306');
if (riceBall) {
  assert(riceBall.familyAudience.childMeal?.schoolMorningFriendly === true, '주먹밥 schoolMorningFriendly is true');
  assert(riceBall.familyAudience.safetySignals.allergyTags.includes('fish'), 'tuna rice ball keeps fish allergy');
  assert(!riceBall.familyAudience.safetySignals.allergyTags.includes('milk'), 'tuna rice ball does not infer milk from mayo');
  assert(
    riceBall.ingredients.some((ing) => ing.name === '마요네즈' && ing.iconKey === 'mayo'),
    'tuna rice ball mayo uses mayo iconKey',
  );
}

const riceBurger = HANKKI_RECIPES.find((recipe) => recipe.id === 'recipe_0317');
if (riceBurger) {
  assert(!riceBurger.familyAudience.safetySignals.allergyTags.includes('milk'), 'rice burger does not infer milk from mayo');
  assert(riceBurger.familyAudience.safetySignals.allergyTags.includes('egg'), 'rice burger keeps explicit egg for mayo');
  assert(
    riceBurger.ingredients.some((ing) => ing.name === '마요네즈' && ing.iconKey === 'mayo'),
    'rice burger mayo uses mayo iconKey',
  );
}

assert(
  newBreakfast.every((recipe) => recipe && recipe.nutrition.source === 'unverified'),
  'new 15 nutrition.source is unverified',
);
assert(
  newBreakfast.every(
    (recipe) => recipe && recipe.nutrition.source === 'unverified' && recipe.nutrition.calorie > 0,
  ),
  'unverified nutrition keeps schema calorie > 0 but is marked not-for-display',
);

const mayoMiskeyed = HANKKI_RECIPES.filter((recipe) =>
  recipe.ingredients.some((ing) => /마요/.test(ing.name) && ing.iconKey === 'butter'),
);
assert(mayoMiskeyed.length === 0, 'no 마요네즈 ingredient still uses butter iconKey');

assert(shouldIgnoreFamilyAudienceForHomeFeed() === true, 'home still ignores familyAudience for feed switching');
assert(
  toddlerExplicit.every((recipe) => isExcludedFromGeneralHomeFeed(recipe.familyAudience)),
  'all toddler explicit rows match home-exclusion rule',
);
assert(
  elementaryExplicit.every((recipe) => !isExcludedFromGeneralHomeFeed(recipe.familyAudience)),
  'elementary 78 stay in general home exclusion-wise',
);
const homeExcludedIds = listGeneralHomeExcludedRecipeIds();
assert(homeExcludedIds.length === 144, `home excluded toddler+baby 144 (got ${homeExcludedIds.length})`);
assert(
  TODDLER_PILOT_IDS.every((id) => homeExcludedIds.includes(id)),
  'home exclusion covers toddler pilot ids',
);
assert(
  babyExplicit.every((recipe) => homeExcludedIds.includes(recipe.id)),
  'home exclusion covers baby pilot ids',
);
assert(
  homeExcludedIds.every(
    (id) =>
      TODDLER_PILOT_IDS.includes(id as (typeof TODDLER_PILOT_IDS)[number]) ||
      babyExplicit.some((recipe) => recipe.id === id),
  ),
  'home exclusion does not add kids_meal or elementary ids',
);

function recipeToHomeMenu(recipe: (typeof HANKKI_RECIPES)[number]): MenuItem {
  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: 'recipe',
    title: recipe.name,
    subtitle: recipe.name,
    mealTime: ['BREAKFAST', 'LUNCH', 'DINNER', 'LATE_NIGHT'],
    cookTime: recipe.time,
    difficulty: 'easy',
    aiReason: recipe.name,
    tags: [],
    badges: [],
  };
}

const { candidates: homeCandidates } = buildRecommendationCandidatePool({
  menus: HANKKI_RECIPES.map(recipeToHomeMenu),
  mealType: 'dinner',
  mealMode: 'homemade',
});
assert(
  homeCandidates.filter((menu) => homeExcludedIds.includes(menu.id)).length === 0,
  'dinner home candidate pool has 0 toddler/baby-approved recipes',
);
assert(listElementaryBreakfastWeekCandidates().length === 45, 'elementary weekly eligible 45');

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nSprint v1.1 family audience schema QA — pass');
