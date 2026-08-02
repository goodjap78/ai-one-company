import type { Recipe } from '../../data/recipes/types';
import { isSideDishRecipe } from '../../data/recipes/sideDishPolicy';
import type { PantrySnapshot } from '../../types/pantry';
import type { RecommendationContext } from '../../types/preference';
import { menuPassesAiRecommendationExclusions } from '../recommendation/mealIntelligence/aiRecommendationExclusions';
import { scoreMetadataPreferences } from '../recommendation/mealIntelligence/aiRecommendationMetadataScoring';
import { explicitCookTimeLimitMinutes } from '../recommendation/cookTimePreference';
import { buildFridgeRecipeIndex } from './fridgeRecipeIndex';
import { buildPantryMatchKeySet, pantryOwnsMatchKey } from './fridgeIngredientMatch';
import { recipeToFridgeMenuItem } from './recipeToFridgeMenuItem';
import type {
  FridgeRaidCandidate,
  FridgeRaidDisplayGroups,
  FridgeRaidDisplayInput,
  FridgeRaidGroupId,
  FridgeRaidScoreInput,
  FridgeRaidScoredCandidate,
  FridgeRaidScoredGroups,
} from './fridgeRaidTypes';

export type {
  FridgeRaidCandidate,
  FridgeRaidDisplayGroups,
  FridgeRaidGroupId,
  FridgeRaidScoredCandidate,
  FridgeRaidScoredGroups,
  FridgeRaidScoreInput,
  FridgeRaidDisplayInput,
} from './fridgeRaidTypes';

const DEFAULT_LIMIT_PER_GROUP = 5;

function resolveHeroImageForRecipe(recipe: Recipe) {
  const { resolveFridgeRecipeHeroImage } =
    require('./resolveFridgeRecipeHeroImage') as typeof import('./resolveFridgeRecipeHeroImage');
  return resolveFridgeRecipeHeroImage(recipe);
}

const SCORE_WEIGHTS = {
  main: 70,
  sub: 20,
  cookTime: 5,
  aiSettings: 5,
} as const;

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function ratioScore(ratio: number, maxPoints: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return Math.min(maxPoints, ratio * maxPoints);
}

function cookTimeBonus(cookTime: number, context?: RecommendationContext): number {
  const limit = explicitCookTimeLimitMinutes(context);
  if (limit === null) return 0;
  if (cookTime <= limit) return SCORE_WEIGHTS.cookTime;
  return 0;
}

function aiSettingsBonus(menuItem: ReturnType<typeof recipeToFridgeMenuItem>, context?: RecommendationContext): number {
  const mealType = 'dinner';
  const result = scoreMetadataPreferences(menuItem, mealType, context);
  if (result.total <= 0) return 0;
  const normalized = Math.min(1, result.total / 40);
  return roundScore(normalized * SCORE_WEIGHTS.aiSettings);
}

function buildReason(group: FridgeRaidGroupId, missingMainNames: string[]): string {
  if (group === 'side_dish') {
    if (missingMainNames.length === 0) return '곁들이기 좋은 반찬이에요';
    if (missingMainNames.length === 1 && missingMainNames[0]) {
      return `${missingMainNames[0]}만 더 있으면 만들 수 있어요`;
    }
    return '비슷한 재료로 반찬을 만들 수 있어요';
  }
  if (group === 'ready') return '필수 재료를 모두 갖고 있어요';
  if (group === 'one_missing' && missingMainNames[0]) {
    return `${missingMainNames[0]}만 더 있으면 만들 수 있어요`;
  }
  if (missingMainNames.length > 0) {
    return '비슷한 재료로 만들 수 있어요';
  }
  return '재료가 많이 맞아요';
}

function classifyGroup(ownedMainCount: number, totalMainCount: number): FridgeRaidGroupId | null {
  if (totalMainCount === 0) return null;
  if (ownedMainCount === 0) return null;

  const missingMain = totalMainCount - ownedMainCount;
  const mainRatio = ownedMainCount / totalMainCount;

  if (missingMain === 0) return 'ready';
  if (missingMain === 1) return 'one_missing';
  if (missingMain >= 2 && mainRatio >= 0.5) return 'similar';
  return null;
}

function countOwnedKeys(keys: string[], ownedKeys: Set<string>): number {
  let count = 0;
  for (const key of keys) {
    if (pantryOwnsMatchKey(ownedKeys, key)) count += 1;
  }
  return count;
}

function collectOwnedMainNames(
  mainKeys: string[],
  mainNames: string[],
  ownedKeys: Set<string>,
): string[] {
  const owned: string[] = [];
  for (let index = 0; index < mainKeys.length; index += 1) {
    if (pantryOwnsMatchKey(ownedKeys, mainKeys[index])) {
      owned.push(mainNames[index] ?? mainKeys[index]);
    }
  }
  return owned;
}

function collectMissingMainNames(
  mainKeys: string[],
  mainNames: string[],
  ownedKeys: Set<string>,
): string[] {
  const missing: string[] = [];
  for (let index = 0; index < mainKeys.length; index += 1) {
    if (!pantryOwnsMatchKey(ownedKeys, mainKeys[index])) {
      missing.push(mainNames[index] ?? mainKeys[index]);
    }
  }
  return missing;
}

const SORT_DESC = (a: FridgeRaidScoredCandidate, b: FridgeRaidScoredCandidate) => {
  if (b.score !== a.score) return b.score - a.score;
  if (b.mainMatchRatio !== a.mainMatchRatio) return b.mainMatchRatio - a.mainMatchRatio;
  return a.cookTime - b.cookTime;
};

/**
 * Score every recipe in the catalog — no per-group cap.
 * Uses memoized main/sub match keys and Set-based pantry lookups.
 */
export function scoreFridgeRaidCandidates(input: FridgeRaidScoreInput): FridgeRaidScoredGroups {
  const empty: FridgeRaidScoredGroups = {
    ready: [],
    oneMissing: [],
    similar: [],
    sideDishes: [],
  };
  if (input.pantry.items.length === 0 || input.recipes.length === 0) {
    return empty;
  }

  const ownedKeys = buildPantryMatchKeySet(input.pantry);
  const recipeIndex = buildFridgeRecipeIndex(input.recipes);

  const buckets: Record<FridgeRaidGroupId, FridgeRaidScoredCandidate[]> = {
    ready: [],
    one_missing: [],
    similar: [],
    side_dish: [],
  };

  for (const recipe of input.recipes) {
    const indexed = recipeIndex.get(recipe.id);
    if (!indexed) continue;

    const menuItem = recipeToFridgeMenuItem(recipe);
    if (!menuPassesAiRecommendationExclusions(menuItem, input.context)) continue;

    const totalMainCount = indexed.mainMatchKeys.length;
    const ownedMainCount = countOwnedKeys(indexed.mainMatchKeys, ownedKeys);
    if (ownedMainCount === 0 || totalMainCount === 0) continue;

    const sideDish = isSideDishRecipe(recipe);
    const group = sideDish ? 'side_dish' : classifyGroup(ownedMainCount, totalMainCount);
    if (!group) continue;

    const ownedSubCount = countOwnedKeys(indexed.subMatchKeys, ownedKeys);
    const mainMatchRatio = totalMainCount > 0 ? ownedMainCount / totalMainCount : 0;
    const subMatchRatio =
      indexed.subMatchKeys.length > 0 ? ownedSubCount / indexed.subMatchKeys.length : 1;

    const score =
      ratioScore(mainMatchRatio, SCORE_WEIGHTS.main) +
      ratioScore(subMatchRatio, SCORE_WEIGHTS.sub) +
      cookTimeBonus(indexed.cookTime, input.context) +
      aiSettingsBonus(menuItem, input.context);

    const ownedMainNames = collectOwnedMainNames(
      indexed.mainMatchKeys,
      indexed.mainNames,
      ownedKeys,
    );
    const missingMainNames = collectMissingMainNames(
      indexed.mainMatchKeys,
      indexed.mainNames,
      ownedKeys,
    );

    const candidate: FridgeRaidScoredCandidate = {
      recipeId: indexed.recipeId,
      title: indexed.title,
      cookTime: indexed.cookTime,
      group,
      score: roundScore(score),
      mainMatchRatio,
      subMatchRatio,
      matchPercent: Math.round(mainMatchRatio * 100),
      ownedMainNames,
      missingMainNames,
      reason: buildReason(group, missingMainNames),
    };

    buckets[group].push(candidate);
  }

  return {
    ready: buckets.ready.sort(SORT_DESC),
    oneMissing: buckets.one_missing.sort(SORT_DESC),
    similar: buckets.similar.sort(SORT_DESC),
    sideDishes: buckets.side_dish.sort(SORT_DESC),
  };
}

/**
 * After full scoring, keep only the top N per group and attach hero images.
 * Hero resolution runs only for display rows (not the full catalog).
 */
export function selectFridgeRaidDisplayResults(
  scored: FridgeRaidScoredGroups,
  recipesById: Map<string, Recipe>,
  limitPerGroup = DEFAULT_LIMIT_PER_GROUP,
  attachHeroImages = true,
): FridgeRaidDisplayGroups {
  const enrich = (items: FridgeRaidScoredCandidate[]): FridgeRaidCandidate[] =>
    items.slice(0, limitPerGroup).map((item) => {
      const recipe = recipesById.get(item.recipeId);
      return {
        ...item,
        heroImage:
          attachHeroImages && recipe
            ? resolveHeroImageForRecipe(recipe)
            : { emoji: '🍽️', url: null, accessibilityLabel: item.title },
      };
    });

  return {
    ready: enrich(scored.ready),
    oneMissing: enrich(scored.oneMissing),
    similar: enrich(scored.similar),
    sideDishes: enrich(scored.sideDishes),
  };
}

/** Score full catalog, then return top display rows for the results screen. */
export function buildFridgeRaidDisplayResults(input: FridgeRaidDisplayInput): FridgeRaidDisplayGroups {
  const scored = scoreFridgeRaidCandidates(input);
  const recipesById = new Map(input.recipes.map((recipe) => [recipe.id, recipe]));
  return selectFridgeRaidDisplayResults(
    scored,
    recipesById,
    input.limitPerGroup ?? DEFAULT_LIMIT_PER_GROUP,
    input.attachHeroImages ?? true,
  );
}

/** @deprecated Prefer `buildFridgeRaidDisplayResults` with `recipes: Recipe[]`. */
export function buildFridgeRaidCandidates(input: FridgeRaidDisplayInput): FridgeRaidDisplayGroups {
  return buildFridgeRaidDisplayResults(input);
}

export function buildFridgeRaidCandidatesFromIconKeys(
  iconKeys: string[],
  recipes: Recipe[],
  context: RecommendationContext,
  attachHeroImages = false,
): FridgeRaidDisplayGroups {
  const now = new Date().toISOString();
  const pantry: PantrySnapshot = {
    version: 2,
    items: iconKeys.map((iconKey, index) => ({
      id: `test_${index}`,
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

  return buildFridgeRaidDisplayResults({ recipes, pantry, context, attachHeroImages });
}
