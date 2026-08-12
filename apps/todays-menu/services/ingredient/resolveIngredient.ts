import {
  INGREDIENT_REGISTRY,
  INGREDIENT_REGISTRY_BY_CANONICAL,
  INGREDIENT_REGISTRY_BY_ID,
} from '../../library/ingredients/registry';
import type { Ingredient, IngredientLookupResult, ResolvedIngredient } from '../../types/ingredient';

type AliasEntry = {
  token: string;
  ingredient: Ingredient;
  alias: string;
};

function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildAliasIndex(): Map<string, Ingredient> {
  const index = new Map<string, Ingredient>();

  for (const ingredient of INGREDIENT_REGISTRY) {
    index.set(normalizeToken(ingredient.canonicalName), ingredient);
    for (const alias of ingredient.aliases) {
      index.set(normalizeToken(alias), ingredient);
    }
  }

  return index;
}

function buildLongestAliasEntries(): AliasEntry[] {
  const entries: AliasEntry[] = [];

  for (const ingredient of INGREDIENT_REGISTRY) {
    for (const alias of [ingredient.canonicalName, ...ingredient.aliases]) {
      entries.push({
        token: normalizeToken(alias),
        ingredient,
        alias,
      });
    }
  }

  return entries.sort((a, b) => b.token.length - a.token.length);
}

const ALIAS_INDEX = buildAliasIndex();
const LONGEST_ALIAS_ENTRIES = buildLongestAliasEntries();

function toResolved(
  ingredient: Ingredient,
  displayName: string,
  matchedAlias?: string,
): ResolvedIngredient {
  return {
    ingredientId: ingredient.id,
    canonicalName: ingredient.canonicalName,
    displayName,
    category: ingredient.category,
    nutritionGroup: ingredient.nutritionGroup,
    mealTags: ingredient.mealTags,
    matchedAlias,
    known: true,
  };
}

function fallbackResolved(rawName: string, token: string): ResolvedIngredient {
  return {
    ingredientId: null,
    canonicalName: rawName.trim(),
    displayName: rawName.trim(),
    category: 'others',
    nutritionGroup: 'other',
    mealTags: [],
    known: false,
  };
}

/** Resolve any alias or raw name to a canonical ingredient. */
export function resolveIngredient(rawName: string): IngredientLookupResult {
  const trimmed = rawName.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return fallbackResolved('', '');
  }

  const token = normalizeToken(trimmed);
  const exact = ALIAS_INDEX.get(token);
  if (exact) {
    return toResolved(exact, trimmed, trimmed);
  }

  for (const entry of LONGEST_ALIAS_ENTRIES) {
    if (token.includes(entry.token)) {
      return toResolved(entry.ingredient, trimmed, entry.alias);
    }
  }

  return fallbackResolved(trimmed, token);
}

export function lookupIngredientById(id: string): Ingredient | null {
  return INGREDIENT_REGISTRY_BY_ID[id] ?? null;
}

export function lookupIngredientByCanonical(canonicalName: string): Ingredient | null {
  return INGREDIENT_REGISTRY_BY_CANONICAL[canonicalName] ?? null;
}

export function searchIngredients(query: string): Ingredient[] {
  const token = normalizeToken(query);
  if (!token) return [];

  return INGREDIENT_REGISTRY.filter((ingredient) =>
    ingredient.searchableTokens.some((searchToken) => searchToken.includes(token)),
  );
}

export function resolveCanonicalName(rawName: string): string {
  return resolveIngredient(rawName).canonicalName;
}

export function resolveRecipeIngredientNames(names: string[]): string[] {
  return [...new Set(names.map((name) => resolveCanonicalName(name)))];
}
