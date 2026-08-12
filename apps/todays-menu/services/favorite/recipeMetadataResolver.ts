import { getMasterRecipeById } from '../../recipes';
import type { RecipeEmotionId, RecipeTagId } from '../../recipes/types';
import type { MenuItem } from '../../types/recommendation';
import type {
  PreferenceCategory,
  PreferenceSeason,
  ResolvedRecipeMetadata,
} from '../../types/preference';
import { getMenuById } from '../recipe/mockRecipeDetails';
import {
  resolveSeasonFromBadgeLabel,
  resolveSeasonFromDate,
  uniqueEmotions,
  uniqueTags,
} from './preferenceUtils';

function resolveSeasonForMenu(menu: MenuItem, at: Date): PreferenceSeason {
  for (const badge of menu.badges) {
    if (badge.type !== 'season') continue;

    const fromBadge = resolveSeasonFromBadgeLabel(badge.label);
    if (fromBadge) return fromBadge;
  }

  return resolveSeasonFromDate(at);
}

function inferCatalogTags(menu: MenuItem): RecipeTagId[] {
  if (menu.tags.length > 0) return [...menu.tags];

  const tags: RecipeTagId[] = [];

  if (menu.cookTime <= 20) tags.push('quick');
  if (menu.mode === 'delivery') tags.push('budget');
  if (menu.mealTime.includes('LATE_NIGHT')) tags.push('late_night');
  if (menu.mealTime.includes('BREAKFAST')) tags.push('quick');
  if (menu.mealTime.includes('LUNCH') || menu.mealTime.includes('DINNER')) {
    tags.push('family');
  }

  for (const badge of menu.badges) {
    if (badge.type === 'family') tags.push('family');
    if (badge.type === 'time' && menu.cookTime <= 20) tags.push('quick');
  }

  return uniqueTags(tags);
}

function inferCatalogEmotions(_menu: MenuItem): RecipeEmotionId[] {
  return [];
}

function resolveFromMasterRecipe(recipeId: string, at: Date): ResolvedRecipeMetadata | null {
  const recipe = getMasterRecipeById(recipeId);
  if (!recipe) return null;

  return {
    category: recipe.category,
    difficulty: recipe.difficulty,
    cookingTime: recipe.cookTime,
    tags: [...recipe.tags],
    emotionTags: [...recipe.emotions],
    season: resolveSeasonFromDate(at),
  };
}

function resolveFromCatalogMenu(recipeId: string, at: Date): ResolvedRecipeMetadata | null {
  const menu = getMenuById(recipeId);
  if (!menu) return null;

  return {
    category: 'catalog',
    difficulty: menu.difficulty,
    cookingTime: menu.cookTime,
    tags: inferCatalogTags(menu),
    emotionTags: inferCatalogEmotions(menu),
    season: resolveSeasonForMenu(menu, at),
  };
}

export function resolveRecipeMetadata(
  recipeId: string,
  at: Date = new Date(),
): ResolvedRecipeMetadata {
  return (
    resolveFromMasterRecipe(recipeId, at) ??
    resolveFromCatalogMenu(recipeId, at) ?? {
      category: 'catalog',
      difficulty: 'easy',
      cookingTime: 30,
      tags: [],
      emotionTags: [],
      season: resolveSeasonFromDate(at),
    }
  );
}

export function resolvePreferenceCategory(recipeId: string): PreferenceCategory {
  return resolveRecipeMetadata(recipeId).category;
}
