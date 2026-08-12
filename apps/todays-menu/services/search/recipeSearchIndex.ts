import { listCoreRecipes } from '../../data/recipes';
import { listGoldMeals } from '../../library/gold-meals';
import { listAllMasterRecipes } from '../../recipes';
import type { RecipeSearchEntry } from '../../types/recipeSearch';
import { getAllMenus } from '../recommendation/menuCatalog';

function upsertEntry(
  map: Map<string, RecipeSearchEntry>,
  entry: RecipeSearchEntry,
): void {
  const existing = map.get(entry.recipeId);
  if (!existing) {
    map.set(entry.recipeId, entry);
    return;
  }

  if (entry.ingredientNames.length > existing.ingredientNames.length) {
    map.set(entry.recipeId, {
      ...existing,
      ...entry,
      ingredientNames:
        entry.ingredientNames.length > 0 ? entry.ingredientNames : existing.ingredientNames,
    });
  }
}

function buildRecipeSearchIndex(): RecipeSearchEntry[] {
  const map = new Map<string, RecipeSearchEntry>();

  for (const recipe of listCoreRecipes()) {
    upsertEntry(map, {
      recipeId: recipe.id,
      title: recipe.name,
      subtitle: recipe.aiReasonTemplates[0] ?? recipe.name,
      mode: 'homemade',
      ingredientNames: [
        ...recipe.ingredients.map((item) => item.name),
        ...recipe.seasonings.map((item) => item.name),
      ],
    });
  }

  for (const meal of listGoldMeals()) {
    upsertEntry(map, {
      recipeId: meal.id,
      title: meal.title,
      subtitle: meal.subtitle,
      mode: meal.mode,
      ingredientNames: meal.ingredients.map((item) => item.name),
    });
  }

  for (const recipe of listAllMasterRecipes()) {
    upsertEntry(map, {
      recipeId: recipe.id,
      title: recipe.title.ko,
      subtitle: recipe.subtitle.ko,
      mode: 'homemade',
      ingredientNames: recipe.ingredients.map((item) => item.name.ko),
    });
  }

  for (const menu of getAllMenus()) {
    upsertEntry(map, {
      recipeId: menu.id,
      title: menu.title,
      subtitle: menu.subtitle,
      mode: menu.mode,
      ingredientNames: [],
    });
  }

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'ko'));
}

const RECIPE_SEARCH_INDEX = buildRecipeSearchIndex();

export function getRecipeSearchIndex(): RecipeSearchEntry[] {
  return RECIPE_SEARCH_INDEX;
}

export function getRecipeSearchIndexSize(): number {
  return RECIPE_SEARCH_INDEX.length;
}
