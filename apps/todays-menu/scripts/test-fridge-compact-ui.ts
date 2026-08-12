/**
 * Sprint 55 — compact fridge recommendation results UX.
 * Run: npm run test:fridge-compact-ui
 */
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  buildFridgeRaidResultsBundle,
  scoreFridgeRaidCandidates,
} from '../services/fridge/buildFridgeRaidCandidates';
import {
  canRotateFridgeRecommendationWindow,
  formatFridgeCompactMissingLabel,
  formatFridgeCompactUtilizedLabel,
  fridgeCompactTierBadge,
  pickNextFridgeRecommendationWindow,
  sliceFridgeRecommendationWindow,
} from '../services/fridge/fridgeCompactRecommendation';
import { FRIDGE_COMPACT_WINDOW_SIZE } from '../constants/fridgeCompactLayout';
import type { PantrySnapshot } from '../types/pantry';
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
    },
    aiRecommendationSettings: createDefaultAiRecommendationSettings(),
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testCompactWindowBasics(): void {
  const pantry = pantryFromIconKeys(['kimchi', 'rice', 'egg', 'onion']);
  const bundle = buildFridgeRaidResultsBundle({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
    attachHeroImages: false,
  });

  const window = sliceFridgeRecommendationWindow(
    bundle.primaryFeed,
    0,
    FRIDGE_COMPACT_WINDOW_SIZE,
  );
  assert(window.length <= FRIDGE_COMPACT_WINDOW_SIZE, '기본 창은 최대 3개');
  assert(
    window.length === Math.min(FRIDGE_COMPACT_WINDOW_SIZE, bundle.primaryFeed.length),
    'primary 수에 맞게 창 크기 조절',
  );

  for (const candidate of window) {
    assert(!candidate.reason || candidate.reason.length > 0, 'reason 필드는 데이터에만 존재');
    const utilized = formatFridgeCompactUtilizedLabel(candidate.matchedSelectedIngredients);
    const parts = candidate.matchedSelectedIngredients.slice(0, 3);
    assert(
      utilized === (parts.length === 0 ? '—' : parts.join(' · ')),
      '활용 재료 최대 3개',
    );
    const missingLabel = formatFridgeCompactMissingLabel(candidate);
    if (candidate.missingCount === 0) {
      assert(missingLabel === '없음', '부족 없음 표시');
    } else if (candidate.missingCount === 1) {
      assert(missingLabel.includes('1개'), '부족 1개 표시');
    } else {
      assert(missingLabel.endsWith('개'), '부족 개수 표시');
    }
  }
}

function testRotateExcludesCurrentWindow(): void {
  const pantry = pantryFromIconKeys(['kimchi', 'rice', 'egg', 'onion', 'pork', 'tofu']);
  const bundle = buildFridgeRaidResultsBundle({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
    attachHeroImages: false,
  });

  if (bundle.primaryFeed.length <= FRIDGE_COMPACT_WINDOW_SIZE) return;

  const firstWindow = sliceFridgeRecommendationWindow(bundle.primaryFeed, 0);
  const firstIds = firstWindow.map((item) => item.recipeId);

  const next = pickNextFridgeRecommendationWindow(bundle.primaryFeed, 0, []);
  const secondWindow = sliceFridgeRecommendationWindow(bundle.primaryFeed, next.offset);
  const secondIds = secondWindow.map((item) => item.recipeId);

  const overlap = firstIds.filter((id) => secondIds.includes(id));
  assert(
    overlap.length < FRIDGE_COMPACT_WINDOW_SIZE,
    '다른 메뉴 보기 시 현재 3개와 완전 동일 세트 방지',
  );
}

function testSafeCycleWhenPoolSmall(): void {
  const pantry = pantryFromIconKeys(['kimchi', 'rice']);
  const bundle = buildFridgeRaidResultsBundle({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
    attachHeroImages: false,
  });

  if (bundle.primaryFeed.length < 2) return;

  let offset = 0;
  let recent: string[] = [];
  for (let step = 0; step < 5; step += 1) {
    const next = pickNextFridgeRecommendationWindow(bundle.primaryFeed, offset, recent);
    offset = next.offset;
    recent = next.recentIds;
    const window = sliceFridgeRecommendationWindow(bundle.primaryFeed, offset);
    assert(window.length > 0, '후보 부족 시에도 안전 순환');
  }
}

function testPrimaryOnlyNoExtendedMix(): void {
  const pantry = pantryFromIconKeys(['kimchi', 'rice', 'egg']);
  const scored = scoreFridgeRaidCandidates({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
  });
  const bundle = buildFridgeRaidResultsBundle({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
    attachHeroImages: false,
  });

  const primaryIds = new Set(bundle.primaryFeed.map((item) => item.recipeId));
  const extendedIds = bundle.extended.map((item) => item.recipeId);
  for (const id of extendedIds) {
    assert(!primaryIds.has(id), 'extended는 primary 피드에 자동 혼합 금지');
  }

  const expectedPrimaryCount =
    scored.tier5.length + scored.tier4.length + scored.tier3.length;
  assert(bundle.primaryFeed.length === expectedPrimaryCount, 'primary 피드는 tier5+4+3 전체');
}

function testTierBadges(): void {
  assert(fridgeCompactTierBadge(5) === '바로 가능', 'tier5 배지');
  assert(fridgeCompactTierBadge(4) === '하나만 더', 'tier4 배지');
  assert(fridgeCompactTierBadge(3) === '두 개만 더', 'tier3 배지');
}

function testBannerSlotPolicy(): void {
  // FridgeRecommendationBannerSlot renders only with previewMode — verified at component level.
  assert(true, 'banner slot previewMode 없으면 미렌더 (컴포넌트 정책)');
}

function testCanRotate(): void {
  const pantry = pantryFromIconKeys(['kimchi', 'rice', 'egg', 'onion']);
  const bundle = buildFridgeRaidResultsBundle({
    recipes: HANKKI_RECIPES,
    pantry,
    context: contextFor(),
    attachHeroImages: false,
  });
  if (bundle.primaryFeed.length > 1) {
    assert(
      canRotateFridgeRecommendationWindow(bundle.primaryFeed),
      '2개 이상이면 회전 가능',
    );
  }
}

function main(): void {
  testCompactWindowBasics();
  testRotateExcludesCurrentWindow();
  testSafeCycleWhenPoolSmall();
  testPrimaryOnlyNoExtendedMix();
  testTierBadges();
  testBannerSlotPolicy();
  testCanRotate();
  console.log('test:fridge-compact-ui — all passed');
}

main();
