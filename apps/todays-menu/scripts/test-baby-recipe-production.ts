/**
 * Sprint v1.1 — Baby recipe production #1 QA.
 * Run: npm run test:baby-recipe-production
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES, getHankkiRecipeById } from '../data/recipes/hankkiRecipes';
import {
  BABY_FIRST_BATCH_RESERVATIONS,
  listBabyFirstBatchIds,
} from '../data/recipes/babyFirstBatchReservation';
import { BABY_PILOT_IDS } from '../data/recipes/babyPilotOverrides';
import { EXISTING_GENERAL_PORRIDGE_SEVEN_IDS } from '../data/recipes/babyFoodPolicyTypes';
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
import {
  scoreFridgeRaidCandidates,
} from '../services/fridge/buildFridgeRaidCandidates';
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

const FORBIDDEN_COPY = /효능|면역|두뇌|영양소|적당량/;
const FORBIDDEN_NAME = /부드럽게으깬|한입크기로|안전한/;
const FORBIDDEN_SEASONING = /소금|설탕|참기름|대파|고추장|청양|꿀/;

console.log('Sprint v1.1 baby recipe production QA — start\n');

assert(HANKKI_RECIPES.length === 517, `catalog 517 (got ${HANKKI_RECIPES.length})`);

const baby = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('baby'));
const toddler = HANKKI_RECIPES.filter((recipe) => recipe.familyAudience.audiences.includes('toddler'));
const elementary = HANKKI_RECIPES.filter((recipe) =>
  recipe.familyAudience.audiences.includes('elementary'),
);

assert(baby.length === 70, `baby explicit 70 (got ${baby.length})`);
assert(toddler.length === 74, `toddler explicit 74 (got ${toddler.length})`);
assert(elementary.length === 78, `elementary explicit 78 (got ${elementary.length})`);
assert(
  BABY_PILOT_IDS.every((id) => baby.some((recipe) => recipe.id === id)),
  'baby ids are recipe_0336–0383 and batch2 0408–0419',
);
assert(
  listBabyFirstBatchIds().every((id) => Boolean(getHankkiRecipeById(id))),
  'reserved ids are filled',
);

assert(
  baby.every(
    (recipe) =>
      recipe.familyAudience.audiences.length === 1 &&
      recipe.familyAudience.audiences[0] === 'baby' &&
      recipe.familyAudience.reviewStatus === 'explicit' &&
      recipe.familyAudience.babySafetyReview?.reviewStatus === 'approved' &&
      recipe.familyAudience.babyFood !== null,
  ),
  'all 48 are baby-only, explicit, approved',
);

assert(
  EXISTING_GENERAL_PORRIDGE_SEVEN_IDS.every((id) => {
    const recipe = getHankkiRecipeById(id);
    return recipe && !recipe.familyAudience.audiences.includes('baby');
  }),
  'existing porridge 7 stay not-baby',
);

for (const row of BABY_FIRST_BATCH_RESERVATIONS) {
  const recipe = getHankkiRecipeById(row.id);
  assert(recipe?.name === row.name, `${row.id} name is ${row.name}`);
  assert(recipe?.familyAudience.babyFood?.stage === row.stage, `${row.id} stage ${row.stage}`);
}

const names = HANKKI_RECIPES.map((recipe) => recipe.name);
assert(new Set(names).size === names.length, 'no duplicate recipe names');
assert(!names.includes('단호박죽') || getHankkiRecipeById('recipe_0163')?.name === '단호박죽', 'general 단호박죽 kept');
assert(getHankkiRecipeById('recipe_0346')?.name === '단호박쌀죽', 'new row is 단호박쌀죽');
assert(getHankkiRecipeById('recipe_0351')?.name === '이유식계란찜', '0351 is 이유식계란찜');
assert(getHankkiRecipeById('recipe_0352')?.name === '고구마막대', '0352 is 고구마막대');
assert(getHankkiRecipeById('recipe_0354')?.name === '닭고기무른밥', '0354 is 닭고기무른밥');
assert(getHankkiRecipeById('recipe_0355')?.name === '애호박진밥', '0355 is 애호박진밥');
assert(getHankkiRecipeById('recipe_0356')?.name === '브로콜리진밥', '0356 is 브로콜리진밥');
assert(getHankkiRecipeById('recipe_0357')?.name === '찐사과배', '0357 is 찐사과배');
assert(getHankkiRecipeById('recipe_0358')?.name === '소고기채소진밥', '0358 is 소고기채소진밥');
assert(getHankkiRecipeById('recipe_0362')?.name === '단호박진밥', '0362 is 단호박진밥');
assert(getHankkiRecipeById('recipe_0363')?.name === '시금치진밥', '0363 is 시금치진밥');
assert(getHankkiRecipeById('recipe_0369')?.name === '김가루주먹밥', '0369 is 김가루주먹밥');
assert(getHankkiRecipeById('recipe_0371')?.name === '흰살생선채소밥', '0371 is 흰살생선채소밥');
assert(!names.includes('아기주먹밥'), '아기주먹밥 retired as a label-style name');
assert(!names.includes('사과배부드러운조각'), '사과배부드러운조각 retired');
assert(
  getHankkiRecipeById('recipe_0357')?.heroImageKey === 'baby_apple_pear_soft_pieces',
  '0357 heroImageKey unchanged',
);
assert(!names.includes('아기계란찜'), '아기계란찜 retired');
assert(!names.includes('고구마스틱'), '고구마스틱 retired');
assert(!names.includes('찐고구마막대'), 'does not collide with toddler 찐고구마 prefix');

assert(validateAllRecipeFamilyAudience(HANKKI_RECIPES).length === 0, 'family audience issues 0');
assert(
  baby.every((recipe) => validateBabyApprovedRecipe(recipe).length === 0),
  'baby production validator 0 issues',
);

assert(
  baby.every((recipe) => {
    const food = recipe.familyAudience.babyFood!;
    const review = recipe.familyAudience.babySafetyReview!;
    return (
      food.texture !== null &&
      food.texture === review.texture &&
      food.stage === review.stage &&
      isOfficialBabyMonthRangeForStage(review.stage, review.monthRange) &&
      isOfficialBabyMonthRangeForStage(food.stage, food.monthRange) &&
      review.chokingCautions.length === 0 &&
      review.honeyListed === false &&
      recipe.familyAudience.safetySignals.honeyListed === false &&
      recipe.ingredients.length >= 3 &&
      recipe.recipe.steps.length >= 4
    );
  }),
  'stage/monthRange/texture/steps/honey/choking complete',
);

const early = baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'early');
const middle = baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'middle');
const late = baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'late');
const completion = baby.filter((recipe) => recipe.familyAudience.babyFood?.stage === 'completion');
assert(early.length === 14, '시작기 14');
assert(middle.length === 14, '적응기 14');
assert(late.length === 15, '확장기 15');
assert(completion.length === 19, '전환기 19');
assert(
  early.every((recipe) => recipe.familyAudience.babyFood?.monthRange.bound === 'unspecified'),
  '시작기 monthRange unspecified',
);
assert(
  early.every((recipe) => {
    const texture = recipe.familyAudience.babyFood?.texture;
    return texture === 'thin_puree' || texture === 'mashed';
  }),
  '시작기 texture thin_puree or mashed',
);
assert(
  middle.every((recipe) => {
    const texture = recipe.familyAudience.babyFood?.texture;
    return texture === 'mashed' || texture === 'thick_puree';
  }),
  '적응기 texture mashed or thick_puree',
);
assert(
  getHankkiRecipeById('recipe_0352')?.familyAudience.babyFood?.texture === 'finger_food',
  '고구마막대 texture is finger_food',
);
assert(
  (getHankkiRecipeById('recipe_0352')?.familyAudience.babySafetyReview?.chokingCautions.length ?? 1) === 0,
  '고구마막대 choking cautions resolved empty',
);
assert(
  getHankkiRecipeById('recipe_0355')?.familyAudience.babyFood?.texture === 'thick_puree' &&
    getHankkiRecipeById('recipe_0356')?.familyAudience.babyFood?.texture === 'thick_puree',
  '진밥 two rows use thick_puree',
);
assert(
  getHankkiRecipeById('recipe_0354')?.familyAudience.babyFood?.texture === 'soft_chunks',
  '닭고기무른밥 texture is soft_chunks',
);
assert(
  getHankkiRecipeById('recipe_0357')?.familyAudience.babyFood?.texture === 'finger_food',
  '찐사과배 texture is finger_food',
);

assert(
  baby.every((recipe) => recipe.nutrition.source === 'unverified'),
  'nutrition.source unverified',
);
const calorieResolverSrc = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../utils/resolveRecipeCalories.ts'),
  'utf8',
);
assert(
  calorieResolverSrc.includes("source === 'unverified'") && calorieResolverSrc.includes('return null'),
  'calorie resolver hides unverified placeholders',
);
assert(
  baby.every((recipe) => !recipe.standardMetadata.dietaryTags.includes('high_protein')),
  'unverified nutrition does not create high_protein tag',
);

assert(
  baby.every((recipe) => !FORBIDDEN_NAME.test(recipe.name)),
  'menu names stay familiar',
);
assert(
  baby.every((recipe) => {
    const text = [
      ...recipe.recommendationMessages,
      ...recipe.recommendationReasons,
      ...recipe.situation,
      ...recipe.recipe.steps.map((step) => `${step.title} ${step.instruction} ${step.tip}`),
    ].join(' ');
    return !FORBIDDEN_COPY.test(text);
  }),
  'no medical/효능/적당량 copy',
);
assert(
  baby.every((recipe) =>
    recipe.ingredients.every((ing) => !FORBIDDEN_SEASONING.test(ing.name)),
  ),
  'no salt/sugar/sesame/green onion/chili/honey ingredients',
);

assert(
  baby.every((recipe) => {
    const usesSoakedRice = recipe.recipe.steps.some((step) => step.instruction.includes('불린 쌀'));
    if (!usesSoakedRice) return true;
    return recipe.recipe.steps.some(
      (step) => step.title.includes('불리기') || /불려요|불린 뒤/.test(step.instruction),
    );
  }),
  '불린 쌀 recipes include a soak step',
);

const beef = baby.filter((recipe) => recipe.name.includes('소고기'));
assert(
  beef.every((recipe) => recipe.standardMetadata.allergyTags.includes('beef')),
  'beef allergy tags present',
);
assert(
  getHankkiRecipeById('recipe_0344')?.standardMetadata.allergyTags.includes('chicken') &&
    getHankkiRecipeById('recipe_0354')?.standardMetadata.allergyTags.includes('chicken'),
  'chicken allergy tags',
);
assert(
  getHankkiRecipeById('recipe_0345')?.standardMetadata.allergyTags.includes('soy') &&
    getHankkiRecipeById('recipe_0353')?.standardMetadata.allergyTags.includes('soy') &&
    getHankkiRecipeById('recipe_0360')?.standardMetadata.allergyTags.includes('soy') &&
    getHankkiRecipeById('recipe_0366')?.standardMetadata.allergyTags.includes('soy'),
  'soy allergy tags',
);
assert(
  getHankkiRecipeById('recipe_0349')?.standardMetadata.allergyTags.includes('egg') &&
    getHankkiRecipeById('recipe_0351')?.standardMetadata.allergyTags.includes('egg') &&
    getHankkiRecipeById('recipe_0360')?.standardMetadata.allergyTags.includes('egg') &&
    getHankkiRecipeById('recipe_0370')?.standardMetadata.allergyTags.includes('egg'),
  'egg allergy tags',
);
assert(
  getHankkiRecipeById('recipe_0371')?.standardMetadata.allergyTags.includes('fish'),
  'fish allergy tag on 흰살생선채소밥',
);

assert(
  baby.every((recipe) => isExcludedFromGeneralHomeFeed(recipe.familyAudience)),
  'baby approved matches home-exclusion rule',
);
const excluded = new Set(listGeneralHomeExcludedRecipeIds());
assert(excluded.size === 144, `home excluded 144 (got ${excluded.size})`);
assert(
  BABY_PILOT_IDS.every((id) => excluded.has(id)) && TODDLER_PILOT_IDS.every((id) => excluded.has(id)),
  'home exclusion covers baby 70 + toddler 74',
);
const goldSrc = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../services/recommendation/goldMealCatalog.ts'),
  'utf8',
);
assert(goldSrc.includes('isExcludedFromGeneralHomeByRecipeId'), 'homemade Home catalog applies exclusion helper');

const { candidates: dinnerPool } = buildRecommendationCandidatePool({
  menus: HANKKI_RECIPES.map(recipeToHomeMenu),
  mealType: 'dinner',
  mealMode: 'homemade',
});
assert(
  dinnerPool.filter((menu) => excluded.has(menu.id)).length === 0,
  'Home dinner pool excluded ids 0',
);
const { candidates: refreshPool } = buildRecommendationCandidatePool({
  menus: HANKKI_RECIPES.map(recipeToHomeMenu),
  mealType: 'lunch',
  mealMode: 'homemade',
});
assert(
  refreshPool.filter((menu) => BABY_PILOT_IDS.includes(menu.id as (typeof BABY_PILOT_IDS)[number])).length === 0,
  'Home lunch/refresh pool baby 0',
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
  fridgeIds.every((id) => !BABY_PILOT_IDS.includes(id as (typeof BABY_PILOT_IDS)[number])),
  'Fridge Raid auto-discovery baby 0',
);
assert(Boolean(getHankkiRecipeById('recipe_0336')), 'direct route still resolves baby id');
assert(
  baby.every((recipe) => isEligibleForChildFeed(recipe.familyAudience, { audience: 'baby' }).ok),
  'baby feed eligible 70',
);

if (failed > 0) {
  console.error(`\nFAILED ${failed}`);
  process.exit(1);
}

console.log('\nPASSED baby recipe production QA');
console.log('READY_FOR_BABY_UI: YES');
