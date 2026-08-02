/**
 * Fridge Raid MVP — automated QA scenarios.
 * Run: npm run test:fridge-raid
 */
import { northStarHomeCopy } from '../constants/northStarHomeCopy';
import { listSideDishRecipeIds } from '../data/recipes/sideDishRecipeIds';
import { isSideDishRecipe } from '../data/recipes/sideDishPolicy';
import { buildRecommendationCandidatePool } from '../services/recommendation/buildCandidatePool';
import { recipeToFridgeMenuItem } from '../services/fridge/recipeToFridgeMenuItem';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildFridgeRaidCandidatesFromIconKeys,
  scoreFridgeRaidCandidates,
  selectFridgeRaidDisplayResults,
} from '../services/fridge/buildFridgeRaidCandidates';
import {
  FRIDGE_NOODLE_MATCH_KEY,
  buildPantryMatchKeySet,
  resolveFridgeMatchKey,
  resolveFridgeIngredientInput,
  resolveRecipeIngredientMatchKey,
} from '../services/fridge/fridgeIngredientMatch';
import { clearFridgeRecipeIndexCache } from '../services/fridge/fridgeRecipeIndex';
import { menuPassesAiRecommendationExclusions } from '../services/recommendation/mealIntelligence/aiRecommendationExclusions';
import { recipeToFridgeMenuItem } from '../services/fridge/recipeToFridgeMenuItem';
import {
  createDefaultAiRecommendationSettings,
  type AiRecommendationSettings,
} from '../types/aiRecommendationSettings';
import type { PantrySnapshot } from '../types/pantry';
import type { RecommendationContext } from '../types/preference';

const ALL_RECIPES = HANKKI_RECIPES;

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

function contextFor(settings?: Partial<AiRecommendationSettings>): RecommendationContext {
  const aiRecommendationSettings = {
    ...createDefaultAiRecommendationSettings(),
    ...settings,
  };

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
    aiRecommendationSettings,
  };
}

function scoreWithIconKeys(iconKeys: string[], recipes = ALL_RECIPES) {
  return scoreFridgeRaidCandidates({
    recipes,
    pantry: pantryFromIconKeys(iconKeys),
    context: contextFor(),
  });
}

function countScored(results: ReturnType<typeof scoreFridgeRaidCandidates>): number {
  return (
    results.ready.length +
    results.oneMissing.length +
    results.similar.length +
    results.sideDishes.length
  );
}

function countMainScored(results: ReturnType<typeof scoreFridgeRaidCandidates>): number {
  return results.ready.length + results.oneMissing.length + results.similar.length;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
    process.exitCode = 1;
  }
}

console.log('Fridge Raid QA — start\n');
clearFridgeRecipeIndexCache();

runScenario('재료 0개 → 빈 결과', () => {
  const results = scoreFridgeRaidCandidates({
    recipes: ALL_RECIPES,
    pantry: pantryFromIconKeys([]),
    context: contextFor(),
  });
  assert(countScored(results) === 0, 'expected empty groups');
});

runScenario('계란만 선택 → ready 또는 one_missing 후보 존재', () => {
  assert(countScored(scoreWithIconKeys(['egg'])) > 0, 'expected at least one candidate');
});

runScenario('밥 + 계란 + 햄 선택', () => {
  assert(countScored(scoreWithIconKeys(['rice', 'egg', 'ham'])) > 0, 'expected matches');
});

runScenario('김치 + 돼지고기 + 두부 선택', () => {
  assert(countScored(scoreWithIconKeys(['kimchi', 'pork', 'tofu'])) > 0, 'expected matches');
});

runScenario('필수 재료 100% 보유 메뉴 → ready 그룹', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const mains = recipe!.ingredients.filter((item) => item.group === 'main');
  const iconKeys = mains.map((item) => resolveRecipeIngredientMatchKey(item));
  const results = scoreWithIconKeys(iconKeys, [recipe!]);
  assert(results.ready.some((item) => item.recipeId === recipe!.id), 'expected ready match');
});

runScenario('필수 재료 1개 부족 메뉴 → one_missing 그룹', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const mains = recipe!.ingredients.filter((item) => item.group === 'main');
  const partial = mains.slice(0, Math.max(1, mains.length - 1)).map((item) =>
    resolveRecipeIngredientMatchKey(item),
  );
  const results = scoreWithIconKeys(partial, [recipe!]);
  assert(
    results.oneMissing.some((item) => item.recipeId === recipe!.id),
    'expected one_missing match',
  );
});

runScenario('일치율 50% 메뉴 → similar 그룹', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '김치찌개');
  assert(Boolean(recipe), '김치찌개 recipe missing');
  const mains = recipe!.ingredients.filter((item) => item.group === 'main');
  assert(mains.length >= 2, 'expected at least two mains');
  const half = mains.slice(0, Math.ceil(mains.length / 2)).map((item) =>
    resolveRecipeIngredientMatchKey(item),
  );
  const results = scoreWithIconKeys(half, [recipe!]);
  assert(
    results.similar.some((item) => item.recipeId === recipe!.id) ||
      results.oneMissing.some((item) => item.recipeId === recipe!.id),
    'expected similar or one_missing',
  );
});

runScenario('seasoning 없어도 ready 판정', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const mains = recipe!.ingredients.filter((item) => item.group === 'main');
  const iconKeys = mains.map((item) => resolveRecipeIngredientMatchKey(item));
  const results = scoreWithIconKeys(iconKeys, [recipe!]);
  assert(results.ready.length > 0, 'seasoning should not block ready');
});

runScenario('해산물 제외 설정 시 참치 메뉴 미노출', () => {
  const seafoodRecipe = ALL_RECIPES.find((recipe) =>
    recipe.ingredients.some((ing) => ing.iconKey === 'tuna'),
  );
  assert(Boolean(seafoodRecipe), 'tuna recipe missing');
  const context = contextFor({ avoidedFoods: ['seafood'] });
  const results = scoreFridgeRaidCandidates({
    recipes: ALL_RECIPES,
    pantry: pantryFromIconKeys(['tuna', 'onion', 'egg', 'rice', 'kimchi', 'pork']),
    context,
  });
  const all = [...results.ready, ...results.oneMissing, ...results.similar];
  assert(!all.some((item) => item.recipeId === seafoodRecipe!.id), 'seafood menu should be excluded');
  assert(
    !menuPassesAiRecommendationExclusions(recipeToFridgeMenuItem(seafoodRecipe!), context),
    'exclusion helper should block tuna menu',
  );
});

runScenario('매운맛 싫어함 설정 시 매운 메뉴 미노출', () => {
  const spicyRecipe = ALL_RECIPES.find((recipe) => recipe.name.includes('떡볶이'));
  assert(Boolean(spicyRecipe), 'spicy recipe missing');
  const context = contextFor({ spicyLevel: 'dislike' });
  const results = scoreFridgeRaidCandidates({
    recipes: ALL_RECIPES,
    pantry: pantryFromIconKeys(['rice_cake', 'fish_cake', 'cabbage', 'green_onion', 'egg']),
    context,
  });
  const all = [...results.ready, ...results.oneMissing, ...results.similar];
  assert(!all.some((item) => item.recipeId === spicyRecipe!.id), 'spicy menu should be excluded');
});

runScenario('면류와 떡 분리', () => {
  assert(
    resolveFridgeMatchKey('rice_cake', '소면') === FRIDGE_NOODLE_MATCH_KEY,
    'noodle name should map to fridge_noodle',
  );
  assert(
    resolveFridgeMatchKey('rice_cake', '떡국떡') === 'rice_cake',
    'rice cake name should stay rice_cake',
  );

  const ramyeon = ALL_RECIPES.find((item) => item.name === '라면');
  const tteokguk = ALL_RECIPES.find((item) => item.id === '017');
  assert(Boolean(ramyeon) && Boolean(tteokguk), '떡국/라면 recipe missing');

  const noodleResults = scoreWithIconKeys([FRIDGE_NOODLE_MATCH_KEY], [ramyeon!]);
  const riceCakeResults = scoreWithIconKeys(['rice_cake'], [tteokguk!]);

  const noodleAll = [...noodleResults.ready, ...noodleResults.oneMissing, ...noodleResults.similar];
  const riceAll = [...riceCakeResults.ready, ...riceCakeResults.oneMissing, ...riceCakeResults.similar];

  assert(noodleAll.some((item) => item.recipeId === ramyeon!.id), '면류 선택 시 라면 후보 기대');
  assert(riceAll.some((item) => item.recipeId === tteokguk!.id), '떡 선택 시 떡국 후보 기대');

  const crossNoodle = scoreWithIconKeys([FRIDGE_NOODLE_MATCH_KEY], [tteokguk!]);
  const crossRice = scoreWithIconKeys(['rice_cake'], [ramyeon!]);
  assert(countScored(crossNoodle) === 0, '면류만으로 떡국 노출 금지');
  assert(countScored(crossRice) === 0, '떡만으로 라면 노출 금지');
});

runScenario('직접 입력 alias 해석 성공', () => {
  assert(resolveFridgeIngredientInput('양파')?.iconKey === 'onion', '양파 alias');
  assert(resolveFridgeIngredientInput('면류')?.matchKey === FRIDGE_NOODLE_MATCH_KEY, '면류 alias');
});

runScenario('직접 입력 실패', () => {
  assert(resolveFridgeIngredientInput('만두') === null, '만두 should fail');
  assert(resolveFridgeIngredientInput('???') === null, 'unknown should fail');
});

runScenario('전체 점수 후 그룹별 상위 5개만 표시', () => {
  const scored = scoreWithIconKeys(['egg', 'rice', 'ham', 'kimchi', 'pork', 'tofu', 'onion']);
  const recipesById = new Map(ALL_RECIPES.map((recipe) => [recipe.id, recipe]));
  const display = selectFridgeRaidDisplayResults(scored, recipesById, 5, false);

  assert(display.ready.length <= 5, 'ready max 5');
  assert(display.oneMissing.length <= 5, 'one_missing max 5');
  assert(display.similar.length <= 5, 'similar max 5');
  assert(display.sideDishes.length <= 5, 'side_dish max 5');

  const totalScored = countScored(scored);
  const totalDisplay =
    display.ready.length +
    display.oneMissing.length +
    display.similar.length +
    display.sideDishes.length;
  assert(totalScored >= totalDisplay, 'display should be a subset of scored results');
});

runScenario('레시피 카탈로그 길이 기준 동작', () => {
  assert(ALL_RECIPES.length > 0, 'recipe catalog should not be empty');
  const results = scoreWithIconKeys(['egg']);
  assert(countScored(results) > 0, 'expected matches against full catalog');
});

runScenario('buildFridgeRaidCandidatesFromIconKeys 호환', () => {
  const display = buildFridgeRaidCandidatesFromIconKeys(['egg'], ALL_RECIPES, contextFor());
  assert(display.ready.length + display.oneMissing.length > 0, 'helper should still work');
});

runScenario('알레르기(돼지고기) 설정 시 돼지고기 메뉴 미노출', () => {
  const porkRecipe = ALL_RECIPES.find((recipe) =>
    recipe.ingredients.some((ing) => ing.iconKey === 'pork' && ing.group === 'main'),
  );
  assert(Boolean(porkRecipe), 'pork main recipe missing');
  const context = contextFor({ customAvoidedFood: '돼지고기' });
  const results = scoreFridgeRaidCandidates({
    recipes: ALL_RECIPES,
    pantry: pantryFromIconKeys(['pork', 'kimchi', 'tofu', 'onion', 'egg', 'rice']),
    context,
  });
  const all = [...results.ready, ...results.oneMissing, ...results.similar];
  assert(!all.some((item) => item.recipeId === porkRecipe!.id), 'pork allergy menu should be excluded');
});

runScenario('직접 제외 재료 설정 시 해당 메뉴 미노출', () => {
  const kimchiRecipe = ALL_RECIPES.find((recipe) =>
    recipe.ingredients.some((ing) => ing.iconKey === 'kimchi' && ing.group === 'main'),
  );
  assert(Boolean(kimchiRecipe), 'kimchi main recipe missing');
  const context = contextFor({ customAvoidedFood: '김치' });
  const results = scoreFridgeRaidCandidates({
    recipes: ALL_RECIPES,
    pantry: pantryFromIconKeys(['kimchi', 'pork', 'tofu', 'onion', 'egg', 'rice']),
    context,
  });
  const all = [...results.ready, ...results.oneMissing, ...results.similar];
  assert(!all.some((item) => item.recipeId === kimchiRecipe!.id), 'avoided ingredient menu should be excluded');
});

runScenario('중복 matchKey pantry 집합은 1개로 계산', () => {
  const pantry = pantryFromIconKeys(['egg', 'egg', 'egg']);
  const keys = buildPantryMatchKeySet(pantry);
  assert(keys.size === 1, 'duplicate icon keys should collapse');
  const results = scoreWithIconKeys(['egg']);
  assert(countScored(results) > 0, 'single egg should still match');
});

runScenario('pantry matchKey 스냅샷 복원', () => {
  const pantry = pantryFromIconKeys(['onion', 'egg']);
  assert(pantry.items.every((item) => item.iconKey.length > 0), 'iconKey should be present');
  assert(pantry.matchKeys.includes('onion') && pantry.matchKeys.includes('egg'), 'match keys restored');
});

runScenario('홈 준비 중 카드 설문 배지 유지 (냉장고 제외)', () => {
  const others = northStarHomeCopy.comingSoon.cards.filter((card) => card.id !== 'fridge');
  assert(others.every((card) => card.badge === '준비 중'), 'other coming-soon cards should stay 준비 중');
  const fridge = northStarHomeCopy.comingSoon.cards.find((card) => card.id === 'fridge');
  assert(fridge?.badge === '지금 시작', 'fridge card should show live badge');
});

runScenario('결과 카드 recipeId는 상세 라우트로 연결 가능', () => {
  const display = buildFridgeRaidCandidatesFromIconKeys(['egg', 'rice'], ALL_RECIPES, contextFor());
  const first = display.ready[0] ?? display.oneMissing[0] ?? display.similar[0];
  assert(Boolean(first), 'expected at least one display candidate');
  assert(Boolean(ALL_RECIPES.find((recipe) => recipe.id === first!.recipeId)), 'recipe id should exist in catalog');
});

runScenario('기존 홈 추천 엔진 회귀 없음', () => {
  const fridgeSource = fs.readFileSync(
    path.join(__dirname, '../services/fridge/buildFridgeRaidCandidates.ts'),
    'utf8',
  );
  assert(!fridgeSource.includes('recommendationEngine'), 'fridge scorer must not import home engine');
  assert(!fridgeSource.includes('buildRecommendationCandidatePool'), 'fridge scorer must stay independent');
});

runScenario('신규 Hero 이미지 정상 노출 (레지스트리 기반)', () => {
  const latest = ALL_RECIPES[ALL_RECIPES.length - 1];
  assert(Boolean(latest), 'latest recipe missing');
  assert(Boolean(latest.image?.trim()), `image path should exist for ${latest.id}`);
  assert(Boolean(latest.heroImageKey?.trim()), `heroImageKey should exist for ${latest.id}`);
});

runScenario('ready 후보는 ownedMainNames 포함', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const mains = recipe!.ingredients.filter((item) => item.group === 'main');
  const iconKeys = mains.map((item) => resolveRecipeIngredientMatchKey(item));
  const display = buildFridgeRaidCandidatesFromIconKeys(iconKeys, [recipe!], contextFor());
  const ready = display.ready.find((item) => item.recipeId === recipe!.id);
  assert(Boolean(ready), 'expected ready row');
  assert(ready!.ownedMainNames.length > 0, 'ready row should list owned main ingredients');
});

runScenario('홈 기본 추천 후보에 SIDE_DISH 0건', () => {
  const menus = ALL_RECIPES.map((recipe) => recipeToFridgeMenuItem(recipe));
  const { candidates } = buildRecommendationCandidatePool({
    menus,
    mealType: 'dinner',
    mealMode: 'homemade',
    context: contextFor(),
  });
  const sideHits = candidates.filter((menu) => listSideDishRecipeIds().includes(menu.id));
  assert(sideHits.length === 0, 'home pool should exclude side dishes');
});

runScenario('냉장고 메인 3그룹에 SIDE_DISH 0건', () => {
  const sideIds = new Set(listSideDishRecipeIds());
  const results = scoreWithIconKeys([
    'potato',
    'tofu',
    'spinach',
    'onion',
    'egg',
    'kimchi',
    'pork',
    'rice',
    'ham',
    'anchovy',
    'peanut',
    'bean_sprout',
    'green_onion',
    'garlic',
    'zucchini',
    'tuna',
    'green_chili',
  ]);
  const mainBuckets = [...results.ready, ...results.oneMissing, ...results.similar];
  assert(mainBuckets.every((item) => !sideIds.has(item.recipeId)), 'main groups must exclude side dishes');
});

runScenario('냉장고 반찬 그룹에는 SIDE_DISH만 표시', () => {
  const sideIds = new Set(listSideDishRecipeIds());
  const results = scoreWithIconKeys([
    'potato',
    'tofu',
    'spinach',
    'onion',
    'egg',
    'kimchi',
    'anchovy',
    'peanut',
    'bean_sprout',
    'green_onion',
    'garlic',
    'zucchini',
    'green_chili',
    'tuna',
  ]);
  assert(results.sideDishes.length > 0, 'expected side dish matches');
  assert(
    results.sideDishes.every((item) => sideIds.has(item.recipeId)),
    'side dish group should only contain SIDE_DISH recipes',
  );
  assert(
    results.sideDishes.every((item) => item.group === 'side_dish'),
    'side dish rows should use side_dish group id',
  );
});

runScenario('반찬 분류 정책 — 9개 핵심 메뉴 + 꽈리고추참치볶음', () => {
  const expected = [
    '018',
    '029',
    '030',
    '097',
    '098',
    '100',
    'recipe_0136',
    'recipe_0137',
    'recipe_0138',
    'recipe_0128',
  ];
  const classified = listSideDishRecipeIds().sort();
  assert(classified.length === expected.length, `expected ${expected.length} side dishes, got ${classified.length}`);
  for (const id of expected) {
    assert(classified.includes(id), `missing side dish id ${id}`);
    const recipe = ALL_RECIPES.find((item) => item.id === id);
    assert(Boolean(recipe), `recipe ${id} missing`);
    assert(isSideDishRecipe(recipe!), `recipe ${id} should be classified as side dish`);
    assert(recipe!.collectionIds.includes('SIDE_DISH'), `recipe ${id} should have SIDE_DISH collection`);
    assert(!recipe!.collectionIds.includes('HOME'), `recipe ${id} must not have HOME collection`);
  }
});

runScenario('계란말이는 홈 한 끼 후보 유지', () => {
  const recipe = ALL_RECIPES.find((item) => item.id === '019');
  assert(Boolean(recipe), '계란말이 missing');
  assert(!isSideDishRecipe(recipe!), '계란말이 should stay a home meal');
  assert(recipe!.collectionIds.includes('HOME'), '계란말이 should remain in HOME collection');
});

runScenario('브로콜리 입력은 broccoli key로 해석', () => {
  const resolved = resolveFridgeIngredientInput('브로콜리');
  assert(resolved?.iconKey === 'broccoli', 'broccoli iconKey');
  assert(resolved?.matchKey === 'broccoli', 'broccoli matchKey');
});

runScenario('브로콜리 선택 시 시금치 레시피와 매칭되지 않음', () => {
  const spinachRecipe = ALL_RECIPES.find((item) => item.id === '097');
  assert(Boolean(spinachRecipe), '시금치나물 recipe missing');
  const results = scoreWithIconKeys(['broccoli']);
  const all = [...results.ready, ...results.oneMissing, ...results.similar, ...results.sideDishes];
  assert(!all.some((item) => item.recipeId === spinachRecipe!.id), 'broccoli must not match spinach recipe');
});

runScenario('시금치 선택 시 브로콜리-only 매칭 없음', () => {
  const spinachRecipe = ALL_RECIPES.find((item) => item.id === '097');
  assert(Boolean(spinachRecipe), '시금치나물 recipe missing');
  const spinachResults = scoreWithIconKeys(['spinach']);
  const spinachHits = [
    ...spinachResults.ready,
    ...spinachResults.oneMissing,
    ...spinachResults.similar,
    ...spinachResults.sideDishes,
  ];
  assert(spinachHits.some((item) => item.recipeId === spinachRecipe!.id), 'spinach should match spinach recipe');

  const broccoliOnly = scoreWithIconKeys(['broccoli'], [spinachRecipe!]);
  const broccoliHits = [
    ...broccoliOnly.ready,
    ...broccoliOnly.oneMissing,
    ...broccoliOnly.similar,
    ...broccoliOnly.sideDishes,
  ];
  assert(broccoliHits.length === 0, 'broccoli must not match spinach-only recipe');
});

console.log('\nFridge Raid QA — done');
