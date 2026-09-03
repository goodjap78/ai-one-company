/**
 * Global search policy for HANKKI catalog supplement.
 *
 * EXACT_MENU_ALLOW — exact child menu name → accessible in global search.
 * GENERAL_INGREDIENT_EXCLUDE — generic ingredient queries must not flood baby/toddler.
 */
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { isEligibleForChildFeed } from '../../data/recipes/recipeFamilyAudiencePolicy';
import { buildChildSearchBlob } from '../../data/recipes/childSearchFilters';
import type { Recipe } from '../../data/recipes/types';
import type { RecipeSearchResult } from '../../types/recipeSearch';

const MIN_EXACT_MENU_QUERY_LENGTH = 3;

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function isExactChildMenuNameMatch(recipeName: string, query: string): boolean {
  const normalizedName = normalizeSearchText(recipeName);
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < MIN_EXACT_MENU_QUERY_LENGTH) return false;
  return normalizedName === normalizedQuery || normalizedName.includes(normalizedQuery);
}

function isBabyOnlyChildRecipe(recipe: Recipe): boolean {
  const audiences = recipe.familyAudience.audiences;
  return (
    audiences.includes('baby') &&
    !audiences.includes('toddler') &&
    !audiences.includes('elementary') &&
    !audiences.includes('general')
  );
}

function isToddlerOnlyChildRecipe(recipe: Recipe): boolean {
  const audiences = recipe.familyAudience.audiences;
  return (
    audiences.includes('toddler') &&
    !audiences.includes('baby') &&
    !audiences.includes('general')
  );
}

function isExplicitElementaryRecipe(recipe: Recipe): boolean {
  const audience = recipe.familyAudience;
  if (!audience.audiences.includes('elementary')) return false;
  if (audience.reviewStatus !== 'explicit') return false;
  return isEligibleForChildFeed(audience, { audience: 'elementary' }).ok;
}

function isGlobalIngredientEligible(recipe: Recipe): boolean {
  if (isBabyOnlyChildRecipe(recipe) || isToddlerOnlyChildRecipe(recipe)) {
    return false;
  }
  if (isExplicitElementaryRecipe(recipe)) return true;
  if (recipe.familyAudience.audiences.includes('general')) return true;
  return false;
}

function toSearchResult(
  recipe: Recipe,
  matchType: 'title' | 'ingredient',
  matchedIngredient?: string,
): RecipeSearchResult {
  return {
    recipeId: recipe.id,
    title: recipe.name,
    subtitle: recipe.category[0] ?? '집밥',
    mode: 'homemade',
    matchType,
    ...(matchedIngredient ? { matchedIngredient } : {}),
  };
}

/** HANKKI supplement merged into global search (legacy index unchanged). */
export function searchHankkiGlobalSupplement(query: string): RecipeSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: RecipeSearchResult[] = [];
  const seen = new Set<string>();

  for (const recipe of HANKKI_RECIPES) {
    if (seen.has(recipe.id)) continue;

    if (matchesQuery(recipe.name, trimmed)) {
      if (isBabyOnlyChildRecipe(recipe) || isToddlerOnlyChildRecipe(recipe)) {
        if (!isExactChildMenuNameMatch(recipe.name, trimmed)) continue;
      }
      results.push(toSearchResult(recipe, 'title'));
      seen.add(recipe.id);
      continue;
    }

    if (!isGlobalIngredientEligible(recipe)) continue;

    const matchedIngredient = recipe.ingredients
      .map((item) => item.name)
      .find((name) => matchesQuery(name, trimmed));
    if (matchedIngredient) {
      results.push(toSearchResult(recipe, 'ingredient', matchedIngredient));
      seen.add(recipe.id);
      continue;
    }

    if (matchesQuery(buildChildSearchBlob(recipe), trimmed)) {
      const tagMatch = recipe.searchTags.find((tag) => matchesQuery(tag, trimmed));
      if (tagMatch) {
        results.push(toSearchResult(recipe, 'ingredient', tagMatch));
        seen.add(recipe.id);
      }
    }
  }

  return results.sort((a, b) => {
    if (a.matchType !== b.matchType) {
      return a.matchType === 'title' ? -1 : 1;
    }
    return a.title.localeCompare(b.title, 'ko');
  });
}

export function countBabyToddlerIngredientMatchesInGlobal(query: string): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;

  let count = 0;
  for (const recipe of HANKKI_RECIPES) {
    if (!isBabyOnlyChildRecipe(recipe) && !isToddlerOnlyChildRecipe(recipe)) continue;
    if (isExactChildMenuNameMatch(recipe.name, trimmed)) continue;
    const ingredientHit = recipe.ingredients.some((item) => matchesQuery(item.name, trimmed));
    const tagHit = recipe.searchTags.some((tag) => matchesQuery(tag, trimmed));
    if (ingredientHit || tagHit) count += 1;
  }
  return count;
}
