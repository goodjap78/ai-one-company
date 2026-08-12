import type { RecipeSearchResult } from '../../types/recipeSearch';
import { getRecipeSearchIndex } from './recipeSearchIndex';

const MAX_RESULTS = 40;

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/** Local in-memory search by recipe title or ingredient name. */
export function searchRecipes(query: string): RecipeSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: RecipeSearchResult[] = [];

  for (const entry of getRecipeSearchIndex()) {
    if (matchesQuery(entry.title, trimmed)) {
      results.push({
        recipeId: entry.recipeId,
        title: entry.title,
        subtitle: entry.subtitle,
        mode: entry.mode,
        matchType: 'title',
      });
      continue;
    }

    const matchedIngredient = entry.ingredientNames.find((name) => matchesQuery(name, trimmed));
    if (matchedIngredient) {
      results.push({
        recipeId: entry.recipeId,
        title: entry.title,
        subtitle: entry.subtitle,
        mode: entry.mode,
        matchType: 'ingredient',
        matchedIngredient,
      });
    }
  }

  return results
    .sort((a, b) => {
      if (a.matchType !== b.matchType) {
        return a.matchType === 'title' ? -1 : 1;
      }
      return a.title.localeCompare(b.title, 'ko');
    })
    .slice(0, MAX_RESULTS);
}
