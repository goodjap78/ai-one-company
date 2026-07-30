/**
 * Sprint 25 — QA scenarios for AI settings ↔ standardMetadata scoring.
 * Run: npm run test:ai-recommendation-metadata
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { menuMatchesMealType } from '../data/recipes/constants';
import {
  buildRecommendationCandidatePool,
  resolveRecommendationCandidates,
} from '../services/recommendation/buildCandidatePool';
import { evaluateAiRecommendationExclusions } from '../services/recommendation/mealIntelligence/aiRecommendationExclusions';
import {
  METADATA_SCORE_POINTS,
  scoreMetadataPreferences,
} from '../services/recommendation/mealIntelligence/aiRecommendationMetadataScoring';
import {
  DEFAULT_AI_RECOMMENDATION_SETTINGS,
  type AiRecommendationSettings,
} from '../types/aiRecommendationSettings';
import type { MealType } from '../types/home';
import type { MealTimeSlot } from '../types/mealTime';
import type { MenuItem } from '../types/recommendation';
import type { RecommendationContext } from '../types/preference';

const MEAL_TYPE_KO_TO_SLOT: Record<string, MealTimeSlot> = {
  아침: 'BREAKFAST',
  점심: 'LUNCH',
  저녁: 'DINNER',
  야식: 'LATE_NIGHT',
  간식: 'LATE_NIGHT',
};

type Scenario = {
  name: string;
  settings: AiRecommendationSettings;
  mealType?: MealType;
};

function mapMealTimes(mealType: string[]): MealTimeSlot[] {
  const slots = mealType
    .map((item) => MEAL_TYPE_KO_TO_SLOT[item])
    .filter((slot): slot is MealTimeSlot => Boolean(slot));
  return slots.length > 0 ? [...new Set(slots)] : ['DINNER'];
}

function recipeToMenuItem(recipe: (typeof HANKKI_RECIPES)[number]): MenuItem {
  return {
    id: recipe.id,
    mode: 'homemade',
    type: 'MAIN',
    mealStyle: recipe.time <= 15 ? 'instant' : 'recipe',
    title: recipe.name,
    subtitle: recipe.situation[0] ?? recipe.name,
    mealTime: mapMealTimes(recipe.mealType),
    cookTime: recipe.time,
    difficulty:
      recipe.difficulty === '쉬움' ? 'easy' : recipe.difficulty === '어려움' ? 'hard' : 'normal',
    aiReason: recipe.situation[0] ?? recipe.name,
    tags: [],
    badges: [],
  };
}

const CATALOG: MenuItem[] = HANKKI_RECIPES.map(recipeToMenuItem);

function contextFor(settings: AiRecommendationSettings): RecommendationContext {
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
    aiRecommendationSettings: settings,
  };
}

const scenarios: Scenario[] = [
  { name: '신규 사용자 (설정 없음)', settings: DEFAULT_AI_RECOMMENDATION_SETTINGS },
  {
    name: '한식 선호',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      preferredCuisines: ['korean'],
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '면 + 매운맛 선호',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      preferredCuisines: ['japanese', 'chinese'],
      spicyLevel: 'like',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '혼밥 + 20분 이하',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      householdSize: 'solo',
      maxCookTime: '20',
      updatedAt: new Date().toISOString(),
    },
    mealType: 'dinner',
  },
  {
    name: '가족 식사',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      householdSize: 'family',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '순한맛 (매운맛 제외)',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      spicyLevel: 'dislike',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '해산물 제외',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      avoidedFoods: ['seafood'],
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '특정 재료 직접 제외 (오이)',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      customAvoidedFood: '오이',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    name: '한식 선호 + 오이·김치 제외 충돌',
    settings: {
      ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
      preferredCuisines: ['korean'],
      customAvoidedFood: '오이, 김치',
      updatedAt: new Date().toISOString(),
    },
  },
];

function runScenario(scenario: Scenario): void {
  const mealType = scenario.mealType ?? 'dinner';
  const context = contextFor(scenario.settings);
  const { candidates } = buildRecommendationCandidatePool({
    menus: CATALOG,
    mealType,
    mealMode: 'homemade',
    context,
  });

  const scored = candidates
    .map((menu) => {
      const metadataScore = scoreMetadataPreferences(menu, mealType, context);
      return {
        menuId: menu.id,
        score: metadataScore.total,
        metadataScore,
        excluded: evaluateAiRecommendationExclusions(menu, context).excluded,
      };
    })
    .filter((entry) => !entry.excluded)
    .sort((a, b) => b.score - a.score || a.menuId.localeCompare(b.menuId));
  const top = scored[0];
  const excludedCount = CATALOG.filter(
    (menu) => evaluateAiRecommendationExclusions(menu, context).excluded,
  ).length;

  console.log(`\n## ${scenario.name}`);
  console.log(`- candidates: ${candidates.length}/${CATALOG.length} (excluded total: ${excludedCount})`);
  console.log(`- top: ${top ? `${top.menuId} (score ${top.score})` : '(none)'}`);
  if (top?.metadataScore.hits.length) {
    console.log(`- metadata hits: ${top.metadataScore.hits.map((h) => h.label).join(' | ')}`);
  }
  const primaryReason = top?.metadataScore.hits.find((h) => h.points > 0);
  if (primaryReason) {
    console.log(`- reason: ${primaryReason.label}`);
  }
}

function assertAllMenusScore(): void {
  let errors = 0;

  for (const menu of CATALOG) {
    try {
      evaluateAiRecommendationExclusions(menu, contextFor(DEFAULT_AI_RECOMMENDATION_SETTINGS));
      scoreMetadataPreferences(menu, 'dinner', contextFor(DEFAULT_AI_RECOMMENDATION_SETTINGS));
    } catch (error) {
      errors += 1;
      console.error(`score error for ${menu.id}:`, error);
    }
  }

  const dinnerPool = CATALOG.filter((menu) => menuMatchesMealType(menu.mealTime, 'dinner'));
  console.log(`\n## 100개 메뉴 점수 계산`);
  console.log(`- catalog menus: ${CATALOG.length}`);
  console.log(`- dinner-eligible: ${dinnerPool.length}`);
  console.log(`- errors: ${errors}`);
  if (errors > 0) process.exitCode = 1;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

function testFavoriteEggBonus(): void {
  console.log('\n## Test: 좋아하는 계란 가점');
  const baseline = contextFor(DEFAULT_AI_RECOMMENDATION_SETTINGS);
  const withEgg = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    customFavoriteFood: '계란',
    updatedAt: new Date().toISOString(),
  });

  const eggMenus = CATALOG.filter((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe?.ingredients.some((ing) => ing.iconKey === 'egg');
  });

  let improved = 0;
  for (const menu of eggMenus) {
    const base = scoreMetadataPreferences(menu, 'dinner', baseline).total;
    const boosted = scoreMetadataPreferences(menu, 'dinner', withEgg).total;
    if (boosted - base === METADATA_SCORE_POINTS.favoriteIngredient) improved += 1;
  }

  assert(improved > 0, `egg menus receive +${METADATA_SCORE_POINTS.favoriteIngredient} (${improved} menus)`);

  const sample = eggMenus[0];
  const hit = scoreMetadataPreferences(sample, 'dinner', withEgg).hits.find((h) =>
    h.key.startsWith('favorite_ingredient_'),
  );
  assert(Boolean(hit?.label.includes('계란')), 'egg metadata hit reason mentions 계란');
}

function testFavoriteChickenBonus(): void {
  console.log('\n## Test: 좋아하는 닭고기 가점');
  const withChicken = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    customFavoriteFood: '닭고기',
    updatedAt: new Date().toISOString(),
  });

  const chickenMenus = CATALOG.filter((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe?.ingredients.some((ing) => ing.iconKey === 'chicken');
  });

  const boosted = chickenMenus.filter(
    (menu) =>
      scoreMetadataPreferences(menu, 'dinner', withChicken).hits.some((h) =>
        h.key.startsWith('favorite_ingredient_chicken'),
      ),
  ).length;

  assert(boosted > 0, `chicken menus receive favorite bonus (${boosted} menus)`);
  const sample = chickenMenus[0];
  const hit = scoreMetadataPreferences(sample, 'dinner', withChicken).hits[0];
  assert(hit?.label.includes('닭고기'), 'chicken metadata hit reason mentions 닭고기');
}

function testFavoriteAvoidConflict(): void {
  console.log('\n## Test: 좋아하는 재료 + 제외 재료 충돌');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    customFavoriteFood: '계란',
    customAvoidedFood: '계란',
    updatedAt: new Date().toISOString(),
  });

  const eggMenus = CATALOG.filter((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe?.ingredients.some((ing) => ing.iconKey === 'egg');
  });

  const excluded = eggMenus.filter(
    (menu) => evaluateAiRecommendationExclusions(menu, context).excluded,
  ).length;

  assert(excluded === eggMenus.length, `all egg menus excluded on favorite/avoid conflict (${excluded}/${eggMenus.length})`);
}

function testSeafoodExclusionSurvivesRelaxation(): void {
  console.log('\n## Test: 해산물 제외 폴백 안전성');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    avoidedFoods: ['seafood'],
    householdSize: 'solo',
    maxCookTime: '10',
    preferredCuisines: ['korean'],
    updatedAt: new Date().toISOString(),
  });

  const { candidates, relaxation } = resolveRecommendationCandidates({
    menus: CATALOG,
    mealType: 'dinner',
    mealMode: 'homemade',
    context,
  });

  const leaks = candidates.filter((menu) =>
    evaluateAiRecommendationExclusions(menu, context).excluded,
  );

  const seafoodMenu = CATALOG.find((menu) => {
    const recipe = HANKKI_RECIPES.find((item) => item.id === menu.id);
    return recipe?.ingredients.some((ing) =>
      ['fish', 'fish_generic', 'tuna', 'salmon', 'mackerel', 'anchovy', 'squid', 'octopus'].includes(
        ing.iconKey,
      ),
    );
  });

  assert(leaks.length === 0, `relaxed pool (${relaxation}) has no excluded menus`);
  if (seafoodMenu) {
    assert(
      !candidates.some((menu) => menu.id === seafoodMenu.id),
      `seafood menu ${seafoodMenu.id} not in relaxed pool`,
    );
  }
}

function testExtremeExclusionNoUnsafeFallback(): void {
  console.log('\n## Test: 극단 제외 — 안전 조건 유지');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    spicyLevel: 'dislike',
    avoidedFoods: ['seafood', 'mushroom'],
    customAvoidedFood: '돼지, 소고기, 닭고기, 계란, 우유, 밀, 두부, 고추장, 고춧가루',
    updatedAt: new Date().toISOString(),
  });

  const { candidates, relaxation } = resolveRecommendationCandidates({
    menus: CATALOG,
    mealType: 'dinner',
    mealMode: 'homemade',
    context,
  });

  const unsafe = candidates.filter(
    (menu) => evaluateAiRecommendationExclusions(menu, context).excluded,
  );

  assert(unsafe.length === 0, `relaxed pool has no excluded menus (${relaxation}, count=${candidates.length})`);

  if (candidates.length === 0) {
    assert(relaxation === 'exhausted', 'extreme exclusions yield exhausted relaxation without unsafe fallback');
  }
}

function testKoreanRiceAndDishType(): void {
  console.log('\n## Test: 한식 + 밥 선택');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    preferredCuisines: ['korean'],
    preferredDishTypes: ['rice'],
    updatedAt: new Date().toISOString(),
  });

  const boosted = CATALOG.filter((menu) => {
    const score = scoreMetadataPreferences(menu, 'dinner', context);
    return score.hits.some((hit) => hit.key === 'dish_pref_rice' || hit.key === 'cuisine_korean');
  }).length;

  assert(boosted > 0, `korean + rice preferences score menus (${boosted})`);
}

function testNoodleSpicy(): void {
  console.log('\n## Test: 면 + 매운맛');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    preferredDishTypes: ['noodle'],
    spicyLevel: 'like',
    updatedAt: new Date().toISOString(),
  });

  const hitMenu = CATALOG.find((menu) => {
    const score = scoreMetadataPreferences(menu, 'dinner', context);
    return score.hits.some((hit) => hit.key === 'dish_pref_noodle' || hit.key === 'spice_like');
  });

  assert(Boolean(hitMenu), 'noodle + spicy settings produce metadata hits');
}

function testSoloSituation(): void {
  console.log('\n## Test: 혼밥 상황');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    preferredSituations: ['solo_meal'],
    updatedAt: new Date().toISOString(),
  });

  const matched = CATALOG.filter((menu) => {
    const score = scoreMetadataPreferences(menu, 'dinner', context);
    return score.hits.some((hit) => hit.key === 'situation_solo_meal');
  }).length;

  assert(matched > 0, `solo_meal situation scores menus (${matched})`);
}

function testMildSpicyPreference(): void {
  console.log('\n## Test: 순한맛 선호');
  const context = contextFor({
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    spicyLevel: 'mild',
    updatedAt: new Date().toISOString(),
  });

  const mildHits = CATALOG.filter((menu) => {
    const score = scoreMetadataPreferences(menu, 'dinner', context);
    return score.hits.some((hit) => hit.key === 'taste_mild_prefer');
  }).length;

  assert(mildHits > 0, `mild preference scores mild menus (${mildHits})`);
  const excludedSpicy = CATALOG.filter(
    (menu) => evaluateAiRecommendationExclusions(menu, context).excluded,
  ).length;
  assert(excludedSpicy === 0, 'mild preference does not hard-exclude spicy menus');
}

function testDefaultSettingsUnchanged(): void {
  console.log('\n## Test: 설정 없음 — 기존 추천 유지');
  const defaultContext = contextFor(DEFAULT_AI_RECOMMENDATION_SETTINGS);
  const defaultTop = CATALOG.map((menu) => ({
    menuId: menu.id,
    score: scoreMetadataPreferences(menu, 'dinner', defaultContext).total,
  }))
    .sort((a, b) => b.score - a.score || a.menuId.localeCompare(b.menuId))[0];

  assert(defaultTop?.score === 0, 'default metadata score remains 0');

  const { candidates } = buildRecommendationCandidatePool({
    menus: CATALOG,
    mealType: 'dinner',
    mealMode: 'homemade',
    context: defaultContext,
  });

  assert(candidates.length > 0, 'default settings still produce recommendation candidates');
}

console.log('========== AI Recommendation Metadata QA ==========');
for (const scenario of scenarios) {
  runScenario(scenario);
}
assertAllMenusScore();
testFavoriteEggBonus();
testFavoriteChickenBonus();
testFavoriteAvoidConflict();
testSeafoodExclusionSurvivesRelaxation();
testExtremeExclusionNoUnsafeFallback();
testKoreanRiceAndDishType();
testNoodleSpicy();
testSoloSituation();
testMildSpicyPreference();
testDefaultSettingsUnchanged();
console.log('\n===================================================');
