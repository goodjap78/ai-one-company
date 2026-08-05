import type { Recipe } from '../../data/recipes/types';
import { isSideDishRecipe } from '../../data/recipes/sideDishPolicy';
import type { PantrySnapshot } from '../../types/pantry';
import type { RecommendationContext } from '../../types/preference';
import { menuPassesAiRecommendationExclusions } from '../recommendation/mealIntelligence/aiRecommendationExclusions';
import { alignFridgeIngredients } from './fridgeIngredientAlignment';
import { buildFridgeRecipeIndex } from './fridgeRecipeIndex';
import { buildPantryMatchKeySet } from './fridgeIngredientMatch';
import { recipeToFridgeMenuItem } from './recipeToFridgeMenuItem';
import {
  buildFridgeRecommendationReason,
  buildFridgeTierHint,
  applyMinimumUtilizationOrder,
  difficultyRank,
  isPrimaryFridgeRecommendation,
  starRatingFromMissingCount,
} from './fridgeRecommendationIntelligence';
import type {
  FridgeRaidCandidate,
  FridgeRaidDisplayGroups,
  FridgeRaidDisplayInput,
  FridgeRaidGroupId,
  FridgeRaidScoredCandidate,
  FridgeRaidScoredGroups,
  FridgeRaidScoreInput,
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

function legacyGroupFromStar(
  starRating: number,
  sideDish: boolean,
): FridgeRaidGroupId {
  if (sideDish) return 'side_dish';
  if (starRating === 5) return 'ready';
  if (starRating === 4) return 'one_missing';
  return 'similar';
}

function bucketForCandidate(
  candidate: FridgeRaidScoredCandidate,
  sideDish: boolean,
): keyof FridgeRaidScoredGroups {
  if (sideDish) return 'sideDishes';
  if (!isPrimaryFridgeRecommendation(candidate.missingCount)) return 'extended';
  if (candidate.starRating === 5) return 'tier5';
  if (candidate.starRating === 4) return 'tier4';
  return 'tier3';
}

/**
 * Score every recipe — Refrigerator Intelligence Engine v1.0.
 * Tiers by missing required ingredients; missing ≥ 3 → extended bucket only.
 */
export function scoreFridgeRaidCandidates(input: FridgeRaidScoreInput): FridgeRaidScoredGroups {
  const empty: FridgeRaidScoredGroups = {
    tier5: [],
    tier4: [],
    tier3: [],
    extended: [],
    sideDishes: [],
  };
  if (input.pantry.items.length === 0 || input.recipes.length === 0) {
    return empty;
  }

  const ownedKeys = buildPantryMatchKeySet(input.pantry);
  const recipeIndex = buildFridgeRecipeIndex(input.recipes);

  const buckets: FridgeRaidScoredGroups = {
    tier5: [],
    tier4: [],
    tier3: [],
    extended: [],
    sideDishes: [],
  };

  for (const recipe of input.recipes) {
    const indexed = recipeIndex.get(recipe.id);
    if (!indexed) continue;

    const menuItem = recipeToFridgeMenuItem(recipe);
    if (!menuPassesAiRecommendationExclusions(menuItem, input.context)) continue;

    const alignment = alignFridgeIngredients(
      indexed.requiredIngredients,
      ownedKeys,
      input.pantry.items,
    );

    if (alignment.matchedCount === 0) continue;

    const sideDish = isSideDishRecipe(recipe);
    const starRating = starRatingFromMissingCount(alignment.missingCount);
    const group = legacyGroupFromStar(starRating, sideDish);
    const difficulty = difficultyRank(indexed.difficulty);

    const candidate: FridgeRaidScoredCandidate = {
      recipeId: indexed.recipeId,
      title: indexed.title,
      cookTime: indexed.cookTime,
      group,
      starRating,
      tierHint: buildFridgeTierHint(starRating, alignment.missingIngredients),
      matchedIngredients: alignment.matchedIngredients,
      missingIngredients: alignment.missingIngredients,
      extraSelectedIngredients: alignment.extraSelectedIngredients,
      matchedCount: alignment.matchedCount,
      missingCount: alignment.missingCount,
      matchRatio: alignment.matchRatio,
      selectedIngredientCount: alignment.selectedIngredientCount,
      matchedSelectedIngredients: alignment.matchedSelectedIngredients,
      matchedSelectedCount: alignment.matchedSelectedCount,
      selectedCoverageRatio: alignment.selectedCoverageRatio,
      unusedSelectedIngredients: alignment.unusedSelectedIngredients,
      matchPercent: Math.round(alignment.matchRatio * 100),
      ownedMainNames: alignment.matchedIngredients,
      missingMainNames: alignment.missingIngredients,
      reason: buildFridgeRecommendationReason(
        alignment.matchedIngredients,
        alignment.missingIngredients,
        starRating,
      ),
      score: alignment.matchRatio * 100,
      mainMatchRatio: alignment.matchRatio,
      subMatchRatio: alignment.matchRatio,
      difficultyRank: difficulty,
      recommendationPriority: indexed.recommendationPriority,
    };

    const bucket = bucketForCandidate(candidate, sideDish);
    buckets[bucket].push(candidate);
  }

  const selectedIngredientCount = input.pantry.items.length;

  for (const key of Object.keys(buckets) as (keyof FridgeRaidScoredGroups)[]) {
    buckets[key] = applyMinimumUtilizationOrder(buckets[key], selectedIngredientCount);
  }

  return buckets;
}

/**
 * After full scoring, keep only the top N per primary group and attach hero images.
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
    tier5: enrich(scored.tier5),
    tier4: enrich(scored.tier4),
    tier3: enrich(scored.tier3),
    extended: scored.extended.map((item) => {
      const recipe = recipesById.get(item.recipeId);
      return {
        ...item,
        heroImage:
          attachHeroImages && recipe
            ? resolveHeroImageForRecipe(recipe)
            : { emoji: '🍽️', url: null, accessibilityLabel: item.title },
      };
    }),
    sideDishes: enrich(scored.sideDishes),
  };
}

/** Score full catalog, then return display rows for the results screen. */
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

/** @deprecated Sprint 54 — map tier buckets to legacy ready/oneMissing/similar */
export function toLegacyScoredGroups(scored: FridgeRaidScoredGroups): {
  ready: FridgeRaidScoredCandidate[];
  oneMissing: FridgeRaidScoredCandidate[];
  similar: FridgeRaidScoredCandidate[];
  sideDishes: FridgeRaidScoredCandidate[];
} {
  return {
    ready: scored.tier5,
    oneMissing: scored.tier4,
    similar: [...scored.tier3, ...scored.extended],
    sideDishes: scored.sideDishes,
  };
}

export function countFridgeScoredCandidates(scored: FridgeRaidScoredGroups): number {
  return (
    scored.tier5.length +
    scored.tier4.length +
    scored.tier3.length +
    scored.extended.length +
    scored.sideDishes.length
  );
}

export function countPrimaryFridgeCandidates(scored: FridgeRaidScoredGroups): number {
  return scored.tier5.length + scored.tier4.length + scored.tier3.length;
}
