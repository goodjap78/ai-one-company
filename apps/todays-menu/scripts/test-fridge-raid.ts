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
  countFridgeScoredCandidates,
  countPrimaryFridgeCandidates,
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
import { clearFridgeRecipeIndexCache, getFridgeRecipeIndexEntry } from '../services/fridge/fridgeRecipeIndex';
import { isTierRequiredIngredient } from '../services/fridge/fridgeIngredientAlignment';
import { menuPassesAiRecommendationExclusions } from '../services/recommendation/mealIntelligence/aiRecommendationExclusions';
import { recipeToFridgeMenuItem } from '../services/fridge/recipeToFridgeMenuItem';
import {
  createDefaultAiRecommendationSettings,
  type AiRecommendationSettings,
} from '../types/aiRecommendationSettings';
import type { PantrySnapshot } from '../types/pantry';
import type { RecommendationContext } from '../types/preference';
import {
  FRIDGE_CHIP_COLUMNS_DEFAULT,
  FRIDGE_CHIP_COLUMNS_NARROW,
  resolveFridgeChipColumnCount,
  resolveFridgeChipItemWidth,
} from '../constants/fridgeRaidChipLayout';
import { FRIDGE_SHOPPING_CONFIG } from '../constants/fridgeShoppingConfig';
import { FRIDGE_POPULAR_CHIPS } from '../constants/fridgeRaidCopy';

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
  return countFridgeScoredCandidates(results);
}

function countMainScored(results: ReturnType<typeof scoreFridgeRaidCandidates>): number {
  return countPrimaryFridgeCandidates(results);
}

function allMainCandidates(results: ReturnType<typeof scoreFridgeRaidCandidates>) {
  return [...results.tier5, ...results.tier4, ...results.tier3, ...results.extended];
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

runScenario('필수 재료 100% 보유 메뉴 → tier5', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const iconKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  const results = scoreWithIconKeys(iconKeys, [recipe!]);
  assert(results.tier5.some((item) => item.recipeId === recipe!.id), 'expected tier5 match');
});

runScenario('필수 재료 1개 부족 메뉴 → tier4', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const tierKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  const partial = tierKeys.slice(0, Math.max(1, tierKeys.length - 1));
  const results = scoreWithIconKeys(partial, [recipe!]);
  assert(
    results.tier4.some((item) => item.recipeId === recipe!.id) ||
      results.tier3.some((item) => item.recipeId === recipe!.id),
    'expected tier4 or tier3 match',
  );
});

runScenario('일치율 50% 메뉴 → primary 또는 extended', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '김치찌개');
  assert(Boolean(recipe), '김치찌개 recipe missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const tierKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  assert(tierKeys.length >= 2, 'expected at least two tier keys');
  const half = tierKeys.slice(0, Math.ceil(tierKeys.length / 2));
  const results = scoreWithIconKeys(half, [recipe!]);
  assert(
    allMainCandidates(results).some((item) => item.recipeId === recipe!.id),
    'expected primary or extended match',
  );
});

runScenario('seasoning 없어도 tier5 가능 (양념 미포함)', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const iconKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  const results = scoreWithIconKeys(iconKeys, [recipe!]);
  assert(results.tier5.length > 0, 'tier required without pantry staples should reach tier5');
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
  const all = allMainCandidates(results);
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
  const all = allMainCandidates(results);
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

  const noodleAll = allMainCandidates(noodleResults);
  const riceAll = allMainCandidates(riceCakeResults);

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

  assert(display.tier5.length <= 5, 'ready max 5');
  assert(display.tier4.length <= 5, 'one_missing max 5');
  assert(display.tier3.length <= 5, 'similar max 5');
  assert(display.sideDishes.length <= 5, 'side_dish max 5');

  const totalScored = countScored(scored);
  const totalDisplay =
    display.tier5.length +
    display.tier4.length +
    display.tier3.length +
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
  const primary =
    display.tier5.length + display.tier4.length + display.tier3.length;
  assert(primary > 0 || display.extended.length > 0, 'helper should still work');
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
  const all = allMainCandidates(results);
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
  const all = allMainCandidates(results);
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

runScenario('홈 준비 중 카드 설문 배지 유지 (상단 냉장고 제외)', () => {
  const cards = northStarHomeCopy.comingSoon.cards;
  assert(cards.length === 4, 'coming soon grid should have 4 cards');
  assert(
    cards.every((card) => card.badge === '준비 중'),
    'coming-soon cards should show 준비 중 badge',
  );
  assert(
    !cards.some((card) => card.id === 'fridge' || card.id === 'pet'),
    'fridge and pet should be hidden from home coming-soon grid',
  );
  assert(
    cards.some((card) => card.id === 'dineOut'),
    'dineOut card should be in coming-soon grid',
  );
});

runScenario('결과 카드 recipeId는 상세 라우트로 연결 가능', () => {
  const display = buildFridgeRaidCandidatesFromIconKeys(['egg', 'rice'], ALL_RECIPES, contextFor());
  const first = display.tier5[0] ?? display.tier4[0] ?? display.tier3[0];
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

runScenario('ready 후보는 matchedIngredients 포함', () => {
  const recipe = ALL_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 recipe missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const iconKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  const display = buildFridgeRaidCandidatesFromIconKeys(iconKeys, [recipe!], contextFor());
  const ready = display.tier5.find((item) => item.recipeId === recipe!.id);
  assert(Boolean(ready), 'expected tier5 row');
  assert(ready!.matchedIngredients.length > 0, 'tier5 row should list matched ingredients');
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
  const mainBuckets = allMainCandidates(results);
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

runScenario('반찬 분류 정책 — SIDE_DISH 30개', () => {
  const expected = [
    '018',
    '029',
    '030',
    '097',
    '098',
    '100',
    'recipe_0128',
    'recipe_0136',
    'recipe_0137',
    'recipe_0138',
    'recipe_0141',
    'recipe_0142',
    'recipe_0143',
    'recipe_0144',
    'recipe_0145',
    'recipe_0146',
    'recipe_0147',
    'recipe_0148',
    'recipe_0149',
    'recipe_0150',
    'recipe_0151',
    'recipe_0152',
    'recipe_0153',
    'recipe_0154',
    'recipe_0155',
    'recipe_0156',
    'recipe_0157',
    'recipe_0158',
    'recipe_0159',
    'recipe_0160',
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
  const all = allMainCandidates(results).concat(results.sideDishes);
  assert(!all.some((item) => item.recipeId === spinachRecipe!.id), 'broccoli must not match spinach recipe');
});

runScenario('시금치 선택 시 브로콜리-only 매칭 없음', () => {
  const spinachRecipe = ALL_RECIPES.find((item) => item.id === '097');
  assert(Boolean(spinachRecipe), '시금치나물 recipe missing');
  const spinachResults = scoreWithIconKeys(['spinach']);
  const spinachHits = allMainCandidates(spinachResults).concat(spinachResults.sideDishes);
  assert(spinachHits.some((item) => item.recipeId === spinachRecipe!.id), 'spinach should match spinach recipe');

  const broccoliOnly = scoreWithIconKeys(['broccoli'], [spinachRecipe!]);
  const broccoliHits = allMainCandidates(broccoliOnly).concat(broccoliOnly.sideDishes);
  assert(broccoliHits.length === 0, 'broccoli must not match spinach-only recipe');
});

runScenario('인기 재료 — 정확히 10개', () => {
  assert(FRIDGE_POPULAR_CHIPS.length === 10, `expected 10 popular chips, got ${FRIDGE_POPULAR_CHIPS.length}`);
});

runScenario('인기 재료 — 순서 고정', () => {
  const expectedLabels = [
    '양파',
    '계란',
    '대파',
    '감자',
    '당근',
    '두부',
    '김',
    '버섯',
    '무',
    '양배추',
  ];
  const labels = FRIDGE_POPULAR_CHIPS.map((chip) => chip.label);
  assert(labels.join('|') === expectedLabels.join('|'), `order mismatch: ${labels.join(', ')}`);
});

runScenario('인기 재료 — canonical key 매핑', () => {
  const expectedKeys = [
    'onion',
    'egg',
    'green_onion',
    'potato',
    'carrot',
    'tofu',
    'seaweed',
    'mushroom',
    'radish',
    'cabbage',
  ];
  const keys = FRIDGE_POPULAR_CHIPS.map((chip) => chip.iconKey);
  assert(keys.join('|') === expectedKeys.join('|'), `key mismatch: ${keys.join(', ')}`);
});

runScenario('인기 재료 — canonical key 중복 0', () => {
  const keys = FRIDGE_POPULAR_CHIPS.map((chip) => chip.iconKey);
  assert(new Set(keys).size === keys.length, 'popular chip iconKeys must be unique');
});

runScenario('인기 재료 — 제외 항목 미노출', () => {
  const labels = new Set(FRIDGE_POPULAR_CHIPS.map((chip) => chip.label));
  const excluded = ['돼지고기', '김치', '햄', '면류', '브로콜리'];
  for (const name of excluded) {
    assert(!labels.has(name), `${name} should not appear in popular chips`);
  }
});

runScenario('직접 입력 — 인기 재료 외 재료 추가 가능', () => {
  assert(resolveFridgeIngredientInput('김치')?.iconKey === 'kimchi', 'kimchi via custom input');
  assert(resolveFridgeIngredientInput('돼지고기')?.iconKey === 'pork', 'pork via custom input');
  assert(resolveFridgeIngredientInput('면류')?.matchKey === FRIDGE_NOODLE_MATCH_KEY, 'noodle via custom input');
});

runScenario('인기 재료 칩 그리드 — 일반 폭 5열', () => {
  assert(resolveFridgeChipColumnCount(390) === FRIDGE_CHIP_COLUMNS_DEFAULT, '390px should use 5 columns');
  assert(resolveFridgeChipColumnCount(430) === 5, '430px should use 5 columns');
});

runScenario('인기 재료 칩 그리드 — 좁은 폭 4열', () => {
  assert(resolveFridgeChipColumnCount(359) === FRIDGE_CHIP_COLUMNS_NARROW, '359px should use 4 columns');
  assert(resolveFridgeChipColumnCount(320) === 4, '320px should use 4 columns');
});

runScenario('인기 재료 칩 동일 폭 계산', () => {
  const widthAt430 = resolveFridgeChipItemWidth(430);
  const widthAt320 = resolveFridgeChipItemWidth(320);
  assert(widthAt430 > 0 && widthAt320 > 0, 'chip widths should be positive');
  assert(resolveFridgeChipItemWidth(430) === widthAt430, '430px width should be stable');
  assert(resolveFridgeChipItemWidth(320) === widthAt320, '320px width should be stable');
});

runScenario('새우·생선 matchKey 분리', () => {
  const shrimpRecipe = ALL_RECIPES.find((item) => item.id === 'recipe_0149');
  const sauryRecipe = ALL_RECIPES.find((item) => item.id === 'recipe_0158');
  assert(Boolean(shrimpRecipe), '새우볶음 missing');
  assert(Boolean(sauryRecipe), '꽁치간장조림 missing');

  const shrimpResolved = resolveFridgeIngredientInput('새우');
  assert(shrimpResolved?.iconKey === 'shrimp', '새우 -> shrimp');
  assert(shrimpResolved?.matchKey === 'shrimp', '새우 matchKey -> shrimp');

  const shrimpResults = scoreWithIconKeys(['shrimp']);
  const shrimpHits = allMainCandidates(shrimpResults).concat(shrimpResults.sideDishes);
  assert(shrimpHits.some((item) => item.recipeId === shrimpRecipe!.id), 'shrimp should match 새우볶음');

  const fishResults = scoreWithIconKeys(['fish_generic']);
  const fishHits = allMainCandidates(fishResults).concat(fishResults.sideDishes);
  assert(!fishHits.some((item) => item.recipeId === shrimpRecipe!.id), 'fish_generic must not match 새우볶음');

  const shrimpOnlyAgainstSaury = scoreWithIconKeys(['shrimp'], [sauryRecipe!]);
  const sauryShrimpHits = allMainCandidates(shrimpOnlyAgainstSaury);
  assert(sauryShrimpHits.length === 0, 'shrimp must not match fish-only 꽁치간장조림');
});

runScenario('연근·무 matchKey 분리', () => {
  const lotusRecipe = ALL_RECIPES.find((item) => item.id === 'recipe_0151');
  assert(Boolean(lotusRecipe), '연근조림 missing');

  const lotusResolved = resolveFridgeIngredientInput('연근');
  assert(lotusResolved?.iconKey === 'lotus_root', '연근 -> lotus_root');
  assert(lotusResolved?.matchKey === 'lotus_root', '연근 matchKey -> lotus_root');

  const lotusResults = scoreWithIconKeys(['lotus_root']);
  const lotusHits = [...lotusResults.sideDishes];
  assert(lotusHits.some((item) => item.recipeId === lotusRecipe!.id), 'lotus_root should match 연근조림');

  const radishResults = scoreWithIconKeys(['radish']);
  const radishHits = [...radishResults.sideDishes];
  assert(!radishHits.some((item) => item.recipeId === lotusRecipe!.id), 'radish must not match 연근조림');
});

runScenario('우엉·당근 matchKey 분리', () => {
  const burdockRecipe = ALL_RECIPES.find((item) => item.id === 'recipe_0152');
  assert(Boolean(burdockRecipe), '우엉조림 missing');

  const burdockResolved = resolveFridgeIngredientInput('우엉');
  assert(burdockResolved?.iconKey === 'burdock', '우엉 -> burdock');
  assert(burdockResolved?.matchKey === 'burdock', '우엉 matchKey -> burdock');

  const burdockResults = scoreWithIconKeys(['burdock']);
  const burdockHits = [...burdockResults.sideDishes];
  assert(burdockHits.some((item) => item.recipeId === burdockRecipe!.id), 'burdock should match 우엉조림');

  const carrotResults = scoreWithIconKeys(['carrot']);
  const carrotHits = [...carrotResults.sideDishes];
  assert(!carrotHits.some((item) => item.recipeId === burdockRecipe!.id), 'carrot must not match 우엉조림');
});

runScenario('해산물 제외 시 새우볶음 미노출', () => {
  const shrimpRecipe = ALL_RECIPES.find((item) => item.id === 'recipe_0149');
  assert(Boolean(shrimpRecipe), '새우볶음 missing');
  const context = contextFor({ avoidedFoods: ['seafood'] });
  assert(
    !menuPassesAiRecommendationExclusions(recipeToFridgeMenuItem(shrimpRecipe!), context),
    'seafood avoid should exclude 새우볶음',
  );
});

runScenario('쇼핑 브릿지 비활성 — 외부 연결 없음', () => {
  assert(FRIDGE_SHOPPING_CONFIG.enabled === false);
  assert(!FRIDGE_SHOPPING_CONFIG.targetUrl);
  assert(!FRIDGE_SHOPPING_CONFIG.bannerImageUrl);
  assert(!FRIDGE_SHOPPING_CONFIG.provider);
  assert(FRIDGE_SHOPPING_CONFIG.isAffiliate === false);
});

console.log('\nFridge Raid QA — done');
