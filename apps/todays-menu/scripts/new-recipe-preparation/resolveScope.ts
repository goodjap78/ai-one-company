import { HANKKI_RECIPES, getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { PipelineArgs, PipelineScope } from './types';

/** Last known child expansion batch start — override with NEW_RECIPE_SINCE env. */
const DEFAULT_AUTO_SINCE = process.env.NEW_RECIPE_SINCE?.trim() || 'recipe_0484';

function parseRecipeNumericId(id: string): number | null {
  const m = /^recipe_(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

function parseSinceNumeric(since: string): number | null {
  const direct = parseRecipeNumericId(since);
  if (direct != null) return direct;
  const m = /^(\d+)$/.exec(since);
  return m ? Number(m[1]) : null;
}

function filterSince(since: string, label: string, mode: PipelineScope['mode']): PipelineScope {
  const floor = parseSinceNumeric(since);
  if (floor == null) {
    throw new Error(`Invalid since value: ${since}`);
  }
  const recipes = HANKKI_RECIPES.filter((r) => {
    const n = parseRecipeNumericId(r.id);
    return n != null && n >= floor;
  });
  return {
    mode,
    label,
    recipes,
    recipeIds: recipes.map((r) => r.id),
  };
}

export function resolveScope(args: PipelineArgs): PipelineScope {
  if (args.ids?.length) {
    const recipes = args.ids.map((id) => {
      const recipe = getHankkiRecipeById(id);
      if (!recipe) throw new Error(`Unknown recipe id: ${id}`);
      return recipe;
    });
    return {
      mode: 'ids',
      label: args.ids.join(','),
      recipes,
      recipeIds: recipes.map((r) => r.id),
    };
  }

  if (args.since) {
    return filterSince(args.since, `since ${args.since}`, 'since');
  }

  if (args.fullCatalog) {
    return {
      mode: 'full',
      label: 'full catalog',
      recipes: [...HANKKI_RECIPES],
      recipeIds: HANKKI_RECIPES.map((r) => r.id),
    };
  }

  // No explicit scope: auto-detect last expansion batch (safe default).
  return filterSince(DEFAULT_AUTO_SINCE, `auto (${DEFAULT_AUTO_SINCE})`, 'since');
}
