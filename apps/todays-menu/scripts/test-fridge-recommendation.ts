/**
 * Sprint 54 / 54.1 — Refrigerator Intelligence Engine QA.
 * Run: npm run test:fridge-recommendation
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  countFridgeScoredCandidates,
  countPrimaryFridgeCandidates,
  scoreFridgeRaidCandidates,
} from '../services/fridge/buildFridgeRaidCandidates';
import { alignFridgeIngredients, isTierRequiredIngredient } from '../services/fridge/fridgeIngredientAlignment';
import {
  applyMinimumUtilizationOrder,
  buildFridgeRecommendationReason,
  buildFridgeTierHint,
  compareFridgeRecommendations,
  starRatingFromMissingCount,
} from '../services/fridge/fridgeRecommendationIntelligence';
import {
  buildPantryMatchKeySet,
  FRIDGE_FRENCH_FRIES_MATCH_KEY,
  resolveFridgeIngredientInput,
} from '../services/fridge/fridgeIngredientMatch';
import { traceFridgePantrySelection } from '../services/fridge/traceFridgePantrySelection';
import { lookupIngredientAlias } from '../data/ingredients/ingredientAliases';
import { getFridgeRecipeIndexEntry, clearFridgeRecipeIndexCache } from '../services/fridge/fridgeRecipeIndex';
import type { PantryItem, PantrySnapshot } from '../types/pantry';
import type { RecommendationContext } from '../types/preference';
import { createDefaultAiRecommendationSettings } from '../types/aiRecommendationSettings';

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

function pantryFromChips(chips: Array<{ label: string; iconKey: string }>): PantrySnapshot {
  const now = new Date().toISOString();
  const items: PantryItem[] = chips.map((chip, index) => ({
    id: `qa_${index}`,
    name: chip.label,
    normalizedName: chip.label,
    iconKey: chip.iconKey,
    updatedAt: now,
  }));
  return {
    version: 2,
    items,
    ingredientNames: items.map((item) => item.name),
    matchKeys: items.map((item) => item.iconKey),
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

function scoreWith(iconKeys: string[]) {
  return scoreFridgeRaidCandidates({
    recipes: HANKKI_RECIPES,
    pantry: pantryFromIconKeys(iconKeys),
    context: contextFor(),
  });
}

function scoreWithChips(chips: Array<{ label: string; iconKey: string }>) {
  return scoreFridgeRaidCandidates({
    recipes: HANKKI_RECIPES,
    pantry: pantryFromChips(chips),
    context: contextFor(),
  });
}

function primaryCandidates(scored: ReturnType<typeof scoreWith>) {
  return [...scored.tier5, ...scored.tier4, ...scored.tier3];
}

function countByMatchedSelected(
  candidates: Array<{ matchedSelectedCount: number }>,
  count: number,
): number {
  return candidates.filter((item) => item.matchedSelectedCount === count).length;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name}: ${message}`);
    process.exitCode = 1;
  }
}

console.log('Fridge Recommendation Intelligence QA — start\n');
clearFridgeRecipeIndexCache();

run('match/missing/extra 계산 — spec 예시', () => {
  const recipe = HANKKI_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const pantry = pantryFromIconKeys(['egg', 'green_onion', 'rice']);
  const owned = buildPantryMatchKeySet(pantry);
  const alignment = alignFridgeIngredients(indexed.requiredIngredients, owned, pantry.items);
  assert(alignment.matchedCount >= 3, 'matched >= 3');
  assert(alignment.missingCount >= 1, 'missing >= 1 (햄·부재료·간장 등)');
  assert(
    alignment.matchedIngredients.some((name) => name.includes('계란')),
    'matched includes egg',
  );
  assert(alignment.selectedIngredientCount === 3, 'selected count');
  assert(alignment.matchedSelectedCount >= 3, 'matched selected count');
});

run('starRating — missing 0/1/2/3+', () => {
  assert(starRatingFromMissingCount(0) === 5, 'missing 0 → 5');
  assert(starRatingFromMissingCount(1) === 4, 'missing 1 → 4');
  assert(starRatingFromMissingCount(2) === 3, 'missing 2 → 3');
  assert(starRatingFromMissingCount(3) === 2, 'missing 3 → 2');
});

run('tierHint — 규칙 기반 문구', () => {
  assert(buildFridgeTierHint(5, []) === '바로 만들 수 있어요', 'tier 5 hint');
  assert(
    buildFridgeTierHint(4, ['간장']) === '간장 하나만 있으면 됩니다',
    'tier 4 hint',
  );
  assert(
    buildFridgeTierHint(3, ['케첩', '양파']).includes('두 가지만'),
    'tier 3 hint',
  );
});

run('reason — AI 호출 없이 생성', () => {
  const reason = buildFridgeRecommendationReason(['계란', '밥'], ['간장'], 4);
  assert(reason.includes('간장'), 'reason mentions missing ingredient');
  assert(!reason.includes('undefined'), 'reason is concrete');
});

run('정렬 — matchedSelectedCount → coverage → missing → ratio', () => {
  const sorted = [
    {
      matchedSelectedCount: 1,
      selectedCoverageRatio: 0.33,
      missingCount: 0,
      matchRatio: 0.9,
      difficultyRank: 0,
      cookTime: 10,
      recommendationPriority: 90,
    },
    {
      matchedSelectedCount: 2,
      selectedCoverageRatio: 0.67,
      missingCount: 2,
      matchRatio: 0.5,
      difficultyRank: 1,
      cookTime: 30,
      recommendationPriority: 50,
    },
  ].sort(compareFridgeRecommendations);
  assert(sorted[0]!.matchedSelectedCount === 2, 'higher matchedSelectedCount first');
});

run('정렬 — coverage ratio after matchedSelectedCount tie', () => {
  const sorted = [
    {
      matchedSelectedCount: 2,
      selectedCoverageRatio: 0.5,
      missingCount: 1,
      matchRatio: 0.6,
      difficultyRank: 0,
      cookTime: 20,
      recommendationPriority: 50,
    },
    {
      matchedSelectedCount: 2,
      selectedCoverageRatio: 0.67,
      missingCount: 2,
      matchRatio: 0.5,
      difficultyRank: 1,
      cookTime: 30,
      recommendationPriority: 40,
    },
  ].sort(compareFridgeRecommendations);
  assert(sorted[0]!.selectedCoverageRatio === 0.67, 'higher coverage first when count tied');
});

run('2개 활용 메뉴가 1개 활용보다 우선 (≥2 선택)', () => {
  const ordered = applyMinimumUtilizationOrder(
    [
      {
        matchedSelectedCount: 1,
        selectedCoverageRatio: 0.5,
        missingCount: 0,
        matchRatio: 1,
        difficultyRank: 0,
        cookTime: 10,
        recommendationPriority: 90,
      },
      {
        matchedSelectedCount: 2,
        selectedCoverageRatio: 1,
        missingCount: 2,
        matchRatio: 0.5,
        difficultyRank: 1,
        cookTime: 30,
        recommendationPriority: 50,
      },
    ],
    2,
  );
  assert(ordered[0]!.matchedSelectedCount === 2, '2-use before 1-use');
});

run('unusedSelectedIngredients 계산', () => {
  const recipe = HANKKI_RECIPES.find((item) => item.name === '계란볶음밥');
  assert(Boolean(recipe), '계란볶음밥 missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const pantry = pantryFromChips([
    { label: '계란', iconKey: 'egg' },
    { label: '밥', iconKey: 'rice' },
    { label: '참치', iconKey: 'tuna' },
  ]);
  const owned = buildPantryMatchKeySet(pantry);
  const alignment = alignFridgeIngredients(indexed.requiredIngredients, owned, pantry.items);
  assert(alignment.matchedSelectedIngredients.includes('계란'), 'egg used');
  assert(alignment.matchedSelectedIngredients.includes('밥'), 'rice used');
  assert(alignment.unusedSelectedIngredients.includes('참치'), 'tuna unused');
  assert(alignment.extraSelectedIngredients.includes('참치'), 'extra matches unused');
});

run('alias — 양배추·햄·참치 매칭', () => {
  const cabbage = resolveFridgeIngredientInput('양배추');
  const ham = resolveFridgeIngredientInput('햄');
  const tuna = resolveFridgeIngredientInput('참치');
  assert(cabbage?.iconKey === 'cabbage', '양배추 → cabbage');
  assert(ham?.iconKey === 'ham', '햄 → ham');
  assert(tuna?.iconKey === 'tuna', '참치 → tuna');
});

run('계란·밥·파 선택 → primary 추천 존재 (missing<3)', () => {
  const scored = scoreWith(['egg', 'rice', 'green_onion']);
  assert(countPrimaryFridgeCandidates(scored) > 0, 'expected primary candidates');
  assert(
    scored.tier5.every((item) => item.missingCount === 0),
    'tier5 must have missing 0 when present',
  );
});

run('계란·밥·파 선택 → primary에 missing>=3 없음', () => {
  const scored = scoreWith(['egg', 'rice', 'green_onion']);
  const primary = primaryCandidates(scored);
  assert(
    primary.every((item) => item.missingCount < 3),
    'primary buckets exclude missing >= 3',
  );
});

run('계란만 선택 → missing>=3은 extended만', () => {
  const scored = scoreWith(['egg']);
  const primary = primaryCandidates(scored);
  assert(
    primary.every((item) => item.missingCount < 3),
    'primary excludes missing >= 3',
  );
  if (scored.extended.length > 0) {
    assert(
      scored.extended.every((item) => item.missingCount >= 3),
      'extended only missing >= 3',
    );
  }
  assert(countPrimaryFridgeCandidates(scored) > 0 || countFridgeScoredCandidates(scored) > 0, 'some results');
});

run('계란볶음밥 — 전체 필수 재료 보유 시 tier5', () => {
  const recipe = HANKKI_RECIPES.find((item) => item.id === '002');
  assert(Boolean(recipe), '002 missing');
  const indexed = getFridgeRecipeIndexEntry(recipe!);
  const iconKeys = indexed.requiredIngredients
    .filter(isTierRequiredIngredient)
    .map((item) => item.matchKey);
  const scored = scoreFridgeRaidCandidates({
    recipes: [recipe!],
    pantry: pantryFromIconKeys(iconKeys),
    context: contextFor(),
  });
  const hit = scored.tier5.find((item) => item.recipeId === '002');
  assert(Boolean(hit), 'full pantry should reach tier5 for 계란볶음밥');
  assert(hit!.missingCount === 0, 'tier5 missing 0');
});

run('후보에 matched/missing/selected 필드 존재', () => {
  const scored = scoreWith(['egg', 'rice']);
  const first = scored.tier5[0] ?? scored.tier4[0] ?? scored.tier3[0];
  assert(Boolean(first), 'expected candidate');
  assert(Array.isArray(first!.matchedIngredients), 'matchedIngredients');
  assert(Array.isArray(first!.missingIngredients), 'missingIngredients');
  assert(Array.isArray(first!.matchedSelectedIngredients), 'matchedSelectedIngredients');
  assert(Array.isArray(first!.unusedSelectedIngredients), 'unusedSelectedIngredients');
  assert(typeof first!.matchedSelectedCount === 'number', 'matchedSelectedCount');
  assert(typeof first!.selectedCoverageRatio === 'number', 'selectedCoverageRatio');
  assert(typeof first!.starRating === 'number', 'starRating');
});

run('양배추·햄·참치 — 2개 활용이 1개 활용보다 먼저', () => {
  const scored = scoreWithChips([
    { label: '양배추', iconKey: 'cabbage' },
    { label: '햄', iconKey: 'ham' },
    { label: '참치', iconKey: 'tuna' },
  ]);
  const primary = primaryCandidates(scored);
  const pool = primary.length > 0 ? primary : scored.extended;
  assert(pool.length > 0, 'expected scored results (primary or extended)');
  const twoUse = pool.filter((item) => item.matchedSelectedCount >= 2);
  const oneUse = pool.filter((item) => item.matchedSelectedCount === 1);
  if (twoUse.length > 0 && oneUse.length > 0) {
    const firstOneUseIndex = pool.findIndex((item) => item.matchedSelectedCount === 1);
    const lastTwoUseIndex = pool.reduce(
      (max, item, index) => (item.matchedSelectedCount >= 2 ? index : max),
      -1,
    );
    assert(lastTwoUseIndex < firstOneUseIndex, '2-use menus before 1-use menus');
  }
  const top = pool[0];
  assert(top!.matchedSelectedCount >= 2, 'top result uses at least 2 selected ingredients');
  assert(
    top!.matchedSelectedIngredients.includes('양배추') &&
      top!.matchedSelectedIngredients.includes('햄'),
    'top result uses cabbage and ham',
  );
});

run('추가 시나리오 — 계란·밥·파', () => {
  const scored = scoreWithChips([
    { label: '계란', iconKey: 'egg' },
    { label: '밥', iconKey: 'rice' },
    { label: '파', iconKey: 'green_onion' },
  ]);
  assert(countPrimaryFridgeCandidates(scored) > 0, 'egg rice onion primary');
});

run('추가 시나리오 — 두부·김치·대파', () => {
  const scored = scoreWithChips([
    { label: '두부', iconKey: 'tofu' },
    { label: '김치', iconKey: 'kimchi' },
    { label: '대파', iconKey: 'green_onion' },
  ]);
  assert(countPrimaryFridgeCandidates(scored) > 0, 'tofu kimchi green_onion primary');
});

run('추가 시나리오 — 양파·감자·햄', () => {
  const scored = scoreWithChips([
    { label: '양파', iconKey: 'onion' },
    { label: '감자', iconKey: 'potato' },
    { label: '햄', iconKey: 'ham' },
  ]);
  assert(countPrimaryFridgeCandidates(scored) > 0, 'onion potato ham primary');
});

run('감자튀김 alias — french_fries', () => {
  assert(lookupIngredientAlias('감자튀김') === FRIDGE_FRENCH_FRIES_MATCH_KEY, 'alias map');
  assert(lookupIngredientAlias('프렌치프라이') === FRIDGE_FRENCH_FRIES_MATCH_KEY, '프렌치프라이');
  const resolved = resolveFridgeIngredientInput('감자튀김');
  assert(resolved?.iconKey === FRIDGE_FRENCH_FRIES_MATCH_KEY, 'fridge input');
  assert(resolved?.iconKey !== 'potato', 'not potato iconKey');
});

run('french_fries pantry — potato 레시피 매칭 확장', () => {
  const pantry = pantryFromChips([{ label: '감자튀김', iconKey: FRIDGE_FRENCH_FRIES_MATCH_KEY }]);
  const keys = buildPantryMatchKeySet(pantry);
  assert(keys.has(FRIDGE_FRENCH_FRIES_MATCH_KEY), 'owns french_fries');
  assert(keys.has('potato'), 'satisfies potato');
});

const FOUR_SELECTION_FIXTURE = [
  { label: '감자튀김', iconKey: FRIDGE_FRENCH_FRIES_MATCH_KEY },
  { label: '계란', iconKey: 'egg' },
  { label: '햄', iconKey: 'ham' },
  { label: '양파', iconKey: 'onion' },
] as const;

run('4개 선택 전달 보존 — trace', () => {
  const pantry = pantryFromChips([...FOUR_SELECTION_FIXTURE]);
  const trace = traceFridgePantrySelection(pantry);
  assert(trace.selectedCount === 4, 'selected count 4');
  assert(trace.matchKeys.length === 4, 'normalized count 4');
  assert(trace.matchKeys.includes(FRIDGE_FRENCH_FRIES_MATCH_KEY), 'french_fries key');
  assert(!trace.matchKeys.includes('spinach'), 'no spinach key');
  assert(trace.selectedIngredientIds.length === 4, 'ids preserved');
});

run('4개 선택 — spinach 오염 방지 + 활용 재료 반영', () => {
  const scored = scoreWithChips([...FOUR_SELECTION_FIXTURE]);
  const pool = [...primaryCandidates(scored), ...scored.extended, ...scored.sideDishes];
  assert(pool.length > 0, 'expected recommendations');
  const spinachOnlyPool = pool.filter(
    (item) =>
      item.matchedSelectedCount === 1 &&
      item.matchedSelectedIngredients.length === 1 &&
      item.matchedSelectedIngredients[0] === '시금치',
  );
  assert(
    spinachOnlyPool.length < pool.length,
    'results are not exclusively spinach-only utilization',
  );
  const friesHits = pool.filter((item) =>
    item.matchedSelectedIngredients.some((name) => name.includes('감자튀김')),
  );
  assert(friesHits.length > 0, '감자튀김 활용 메뉴 존재');
});

console.log('\nFridge Recommendation Intelligence QA — done');
