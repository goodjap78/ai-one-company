/**
 * Child-context recipe search — scoped to eligible feed pools only.
 */
import {
  applyBabyFilters,
  applyElementaryFilters,
  applyToddlerFilters,
  matchesChildSearchQuery,
  type BabySearchFilterState,
  type ElementarySearchFilterState,
  type ToddlerSearchFilterState,
} from '../../data/recipes/childSearchFilters';
import { listBabyFoodFeedRecipes, type BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import { listElementaryBrowseRecipes } from '../../data/recipes/elementaryBrowseFeed';
import {
  listToddlerMealFeedRecipes,
  type ToddlerFeedMealType,
} from '../../data/recipes/toddlerMealFeed';
import type { ChildRecipeAudience } from '../../data/recipes/recipeFamilyAudienceTypes';
import type { Recipe } from '../../data/recipes/types';

export type ChildSearchContext =
  | { audience: 'baby'; stage: BabyFoodFeedStage }
  | { audience: 'toddler'; mealType: ToddlerFeedMealType }
  | { audience: 'elementary' };

export function listChildSearchPool(context: ChildSearchContext): Recipe[] {
  switch (context.audience) {
    case 'baby':
      return listBabyFoodFeedRecipes(context.stage);
    case 'toddler':
      return listToddlerMealFeedRecipes(context.mealType);
    case 'elementary':
      return listElementaryBrowseRecipes();
    default:
      return [];
  }
}

export function searchBabyFeedRecipes(
  stage: BabyFoodFeedStage,
  query: string,
  filters: BabySearchFilterState,
): Recipe[] {
  return listBabyFoodFeedRecipes(stage)
    .filter((recipe) => matchesChildSearchQuery(recipe, query))
    .filter((recipe) => applyBabyFilters(recipe, filters));
}

export function searchToddlerFeedRecipes(
  mealType: ToddlerFeedMealType,
  query: string,
  filters: ToddlerSearchFilterState,
): Recipe[] {
  return listToddlerMealFeedRecipes(mealType)
    .filter((recipe) => matchesChildSearchQuery(recipe, query))
    .filter((recipe) => applyToddlerFilters(recipe, filters));
}

export function searchElementaryBrowseRecipes(
  query: string,
  filters: ElementarySearchFilterState,
): Recipe[] {
  return listElementaryBrowseRecipes()
    .filter((recipe) => matchesChildSearchQuery(recipe, query))
    .filter((recipe) => applyElementaryFilters(recipe, filters));
}

export function isChildBrowseMode(query: string, activeFilterCount: number): boolean {
  return query.trim().length > 0 || activeFilterCount > 0;
}

export function childAudienceOf(context: ChildSearchContext): ChildRecipeAudience {
  return context.audience;
}
