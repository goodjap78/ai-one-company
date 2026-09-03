/**
 * Sprint v1.1 — Baby transition-stage production QA.
 * Run: npm run test:baby-transition-production
 */
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import { BATCH_29_IDS } from '../data/recipes/batches/batch29';
import { BABY_PILOT_IDS } from '../data/recipes/babyPilotOverrides';
import {
  listBabyFoodCompletionRecipes,
  listBabyFoodFeedRecipes,
} from '../data/recipes/babyFoodFeed';
import { isOfficialBabyMonthRangeForStage } from '../data/recipes/babyFoodPolicyTypes';
import { listGeneralHomeExcludedRecipeIds } from '../data/recipes/generalHomeFeedExclusion';
import {
  isEligibleForChildFeed,
  isExcludedFromGeneralHomeFeed,
} from '../data/recipes/recipeFamilyAudiencePolicy';
import { validateAllRecipeFamilyAudience } from '../data/recipes/validateRecipeFamilyAudience';
import { validateBabyApprovedRecipe } from '../data/recipes/validateBabyFoodProduction';
import { TODDLER_PILOT_IDS } from '../data/recipes/toddlerPilotOverrides';
import { buildRecommendationCandidatePool } from '../services/recommendation/buildCandidatePool';
import { scoreFridgeRaidCandidates } from '../services/fridge/buildFridgeRaidCandidates';
import type { PantrySnapshot } from '../types/pantry';
import type { RecommendationContext } from '../types/preference';
import { createDefaultAiRecommendationSettings } from '../types/aiRecommendationSettings';
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

function pantryFromIconKeys(iconKeys: string[]): PantrySnapshot {
  const now = new Date().toISOString();
  return {
    version: 2,
    items: iconKeys.map((iconKey, index) => ({
      id: `qa_${index}`,
      name: iconKey,
      normalizedName: iconKey,
      iconKey,
      updatedAt: now,
    })),
    ingredientNames: iconKeys,
    matchKeys: iconKeys,
    updatedAt: now,
    extensions: {},
  };
}

function contextFor(): RecommendationContext {
  return {
    recentMeals: [],
    favorites: [],
    favoriteRecipeIds: [],
    preferenceDNA: {
      favoriteCategories: [],
      favoriteMealTypes: [],
      favoriteTags: [],
      favoriteEmotionTags: [],
      favoriteCookingTimes: [],
      favoriteDifficulty: [],
      favoriteSeasons: [],
      totalFavorites: 0,
    },
    conversationMemory: {
      mood: null,
      weather: null,
      lastGreeting: null,
      lastRecommendation: null,
      conversationCount: 0,
      updatedAt: '',
    },
    aiRecommendationSettings: createDefaultAiRecommendationSettings(),
  };
}

const EXPECTED_NAMES = [
  '소고기채소진밥',
  '닭고기채소진밥',
  '두부계란진밥',
  '감자진밥',
  '단호박진밥',
  '시금치진밥',
  '소고기미역국밥',
  '닭고기채소국밥',
  '두부채소국밥',
  '소고기밥볼',
  '채소밥볼',
  '김가루주먹밥',
  '감자계란찜',
  '흰살생선채소밥',
] as const;

const SCALABLE_IDS = [
  'recipe_0358',
  'recipe_0359',
  'recipe_0361',
  'recipe_0362',
  'recipe_0363',
  'recipe_0364',
  'recipe_0365',
  'recipe_0366',
  'recipe_0367',
  'recipe_0368',
  'recipe_0369',
  'recipe_0371',
] as const;

const SCALING_REVIEW_IDS = ['recipe_0360', 'recipe_0370'] as const;

console.log('Sprint v1.1 baby transition production QA — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);
const baby = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby'));
const toddler = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler'));
const elementary = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('elementary'),
);
assert(baby.length === 70, `baby 70 (got ${baby.length})`);
assert(toddler.length === 74, `toddler 74 (got ${toddler.length})`);
assert(elementary.length === 78, `elementary 78 (got ${elementary.length})`);
assert(BATCH_29_IDS.length === 14, 'transition batch 14');
assert(
  BATCH_29_IDS.every((id) => BABY_PILOT_IDS.includes(id as (typeof BABY_PILOT_IDS)[number])),
  'transition ids are in baby pilot list',
);

const names = HANKKI_RECIPES.map((recipe) => recipe.name);
assert(new Set(names).size === names.length, 'exact duplicate names 0');
assert(!names.includes('아기주먹밥'), '아기주먹밥 not used');
assert(!names.includes('애호박진밥') || getHankkiRecipeById('recipe_0355')?.name === '애호박진밥', '확장기 애호박진밥 kept');
assert(getHankkiRecipeById('recipe_0355')?.name === '애호박진밥', 'existing 애호박진밥 unchanged');
assert(getHankkiRecipeById('recipe_0356')?.name === '브로콜리진밥', 'existing 브로콜리진밥 unchanged');

for (let i = 0; i < BATCH_29_IDS.length; i += 1) {
  const id = BATCH_29_IDS[i]!;
  const expected = EXPECTED_NAMES[i];
  const recipe = getHankkiRecipeById(id);
  assert(recipe?.name === expected, `${id} name is ${expected}`);
  assert(recipe?.familyAudience.audiences.join(',') === 'baby', `${id} baby-only`);
  assert(recipe?.familyAudience.reviewStatus === 'explicit', `${id} explicit`);
  assert(recipe?.familyAudience.babySafetyReview?.reviewStatus === 'approved', `${id} approved`);
  assert(recipe?.familyAudience.babyFood?.stage === 'completion', `${id} stage completion`);
  assert(
    recipe?.familyAudience.babyFood?.monthRange.bound === 'from' &&
      recipe.familyAudience.babyFood.monthRange.minMonths === 12 &&
      recipe.familyAudience.babyFood.monthRange.maxMonths === undefined,
    `${id} monthRange from 12 open max`,
  );
  assert(
    isOfficialBabyMonthRangeForStage('completion', recipe!.familyAudience.babySafetyReview!.monthRange),
    `${id} official month range`,
  );
  assert(recipe?.nutrition.source === 'unverified', `${id} nutrition unverified`);
  assert(recipe?.recipe.steps.length >= 4 && recipe.recipe.steps.length <= 6, `${id} 4–6 steps`);
  assert(recipe.ingredients.length >= 3, `${id} ≥3 ingredients`);
  assert(validateBabyApprovedRecipe(recipe).length === 0, `${id} production validator 0`);
}

assert(validateAllRecipeFamilyAudience(HANKKI_RECIPES).length === 0, 'family audience issues 0');

const completion = baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'completion');
assert(completion.length === 19, '전환기 19');
assert(
  baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'early').length === 14,
  '시작기 14',
);
assert(
  baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'middle').length === 14,
  '적응기 14',
);
assert(
  baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'late').length === 15,
  '확장기 15',
);

assert(
  ['recipe_0358', 'recipe_0359', 'recipe_0360', 'recipe_0361', 'recipe_0362', 'recipe_0363'].every(
    (id) => getHankkiRecipeById(id)?.familyAudience.babyFood?.texture === 'family_transition',
  ),
  '진밥 six use family_transition',
);
assert(
  ['recipe_0364', 'recipe_0365', 'recipe_0366', 'recipe_0371'].every(
    (id) => getHankkiRecipeById(id)?.familyAudience.babyFood?.texture === 'family_transition',
  ),
  '국밥 and 흰살생선채소밥 use family_transition',
);
assert(
  ['recipe_0367', 'recipe_0368', 'recipe_0369'].every(
    (id) => getHankkiRecipeById(id)?.familyAudience.babyFood?.texture === 'finger_food',
  ),
  '밥볼/주먹밥 use finger_food',
);
assert(
  getHankkiRecipeById('recipe_0370')?.familyAudience.babyFood?.texture === 'soft_chunks',
  '감자계란찜 uses soft_chunks',
);

const fish = getHankkiRecipeById('recipe_0371')!;
assert(fish.standardMetadata.allergyTags.includes('fish'), '흰살생선 fish allergy');
assert(
  fish.recipe.steps.some((step) => /가시/.test(`${step.title} ${step.instruction} ${step.tip}`)),
  '흰살생선 steps remove bones',
);
assert(
  fish.familyAudience.babySafetyReview?.chokingCautions.length === 0,
  '흰살생선 choking cautions resolved empty',
);
assert(
  fish.familyAudience.babySafetyReview?.cookingSafetyFlags.includes('fully_cooked_required'),
  '흰살생선 fully_cooked_required',
);
assert(
  fish.ingredients.every((ing) => !/꿀/.test(ing.name)),
  'no honey in transition batch fish row',
);

assert(
  ['recipe_0360', 'recipe_0370'].every((id) =>
    getHankkiRecipeById(id)?.familyAudience.babySafetyReview?.cookingSafetyFlags.includes(
      'fully_cooked_required',
    ),
  ),
  'egg rows fully_cooked_required',
);

assert(
  SCALABLE_IDS.every((id) =>
    getHankkiRecipeById(id)!.ingredients.every((ing) => /^\d+(g|ml)$/.test(ing.amount)),
  ),
  'SCALABLE rows use g/ml only',
);
assert(
  SCALING_REVIEW_IDS.every((id) =>
    getHankkiRecipeById(id)!.ingredients.some((ing) => /개/.test(ing.amount)),
  ),
  'REVIEW_REQUIRED rows include count-based 개',
);
assert(
  baby.every((recipe) => !recipe.ingredients.some((ing) => /꿀/.test(ing.name))),
  'no honey in baby catalog ingredients',
);

assert(listBabyFoodFeedRecipes().length === 70, 'visible feed 70 with 전환기 tab');
assert(listBabyFoodFeedRecipes('completion').length === 19, '전환기 tab shows 19');
assert(listBabyFoodCompletionRecipes().length === 19, 'completion selector 19');
const BATCH_33_COMPLETION_IDS = ['recipe_0417', 'recipe_0418', 'recipe_0419'] as const;
const BATCH_36_COMPLETION_IDS = ['recipe_0456', 'recipe_0457'] as const;
assert(
  listBabyFoodCompletionRecipes().every(
    (recipe) =>
      BATCH_29_IDS.includes(recipe.id) ||
      (BATCH_33_COMPLETION_IDS as readonly string[]).includes(recipe.id) ||
      (BATCH_36_COMPLETION_IDS as readonly string[]).includes(recipe.id),
  ),
  'completion selector is batch29 + batch33 + batch36 completion rows',
);

assert(
  completion.every((recipe) => isExcludedFromGeneralHomeFeed(recipe.familyAudience)),
  'transition recipes match home-exclusion rule',
);
const excluded = new Set(listGeneralHomeExcludedRecipeIds());
assert(excluded.size === 144, `home excluded 144 (got ${excluded.size})`);
assert(
  BATCH_29_IDS.every((id) => excluded.has(id)) && TODDLER_PILOT_IDS.every((id) => excluded.has(id)),
  'home exclusion covers baby-approved + toddler-approved',
);

const { candidates: dinnerPool } = buildRecommendationCandidatePool({
  menus: HANKKI_RECIPES.map(recipeToHomeMenu),
  mealType: 'dinner',
  mealMode: 'homemade',
});
assert(
  dinnerPool.filter((menu) => BATCH_29_IDS.includes(menu.id)).length === 0,
  'Home dinner pool transition 0',
);

const scored = scoreFridgeRaidCandidates({
  recipes: HANKKI_RECIPES,
  pantry: pantryFromIconKeys(['egg', 'rice', 'tofu', 'beef', 'potato', 'chicken', 'carrot', 'spinach']),
  context: contextFor(),
});
const fridgeIds = [...scored.tier5, ...scored.tier4, ...scored.tier3, ...scored.extended, ...scored.sideDishes].map(
  (item) => item.recipeId,
);
assert(
  fridgeIds.every((id) => !BATCH_29_IDS.includes(id)),
  'Fridge Raid auto-discovery transition 0',
);
assert(
  completion.every((recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'baby' }).ok),
  'transition baby-feed eligible 14',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED baby transition production QA');
console.log('READY_TO_ENABLE_TRANSITION_UI: YES');
console.log('TRANSITION_UI_ENABLED: YES');
console.log('READY_FOR_DETAILED_BABY_RECIPE_UI: YES');
