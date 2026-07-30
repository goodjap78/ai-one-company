import { AVOIDED_FOOD_LABELS } from '../../../constants/aiRecommendationSettingsCopy';
import type { RecipeStandardMetadata } from '../../../data/recipes/recipeStandardMetadataTypes';
import type { Recipe, RecipeIngredient } from '../../../data/recipes/types';
import type { AiRecommendationSettings, AvoidedFoodPreset } from '../../../types/aiRecommendationSettings';

/** Max favorite-ingredient score hits per menu (prevents one ingredient dominating). */
export const MAX_FAVORITE_INGREDIENT_HITS = 1;

const TOKEN_ALIASES: Record<string, string[]> = {
  egg: ['egg', '계란', '달걀'],
  chicken: ['chicken', '닭', '닭고기', '치킨'],
  beef: ['beef', '소고기', '쇠고기'],
  pork: ['pork', '돼지', '돼지고기', '삼겹', '목살', '햄'],
  tofu: ['tofu', '두부'],
  kimchi: ['kimchi', '김치'],
  rice: ['rice', '밥'],
  potato: ['potato', '감자'],
  mushroom: ['mushroom', '버섯'],
  cheese: ['cheese', '치즈'],
  fish: ['fish', 'fish_generic', '생선', '고등어', '갈치'],
  shrimp: ['shrimp', '새우'],
};

const ICON_KEY_LABELS: Record<string, string> = {
  egg: '계란',
  chicken: '닭고기',
  beef: '소고기',
  pork: '돼지고기',
  tofu: '두부',
  kimchi: '김치',
  rice: '밥',
  potato: '감자',
  mushroom: '버섯',
  cheese: '치즈',
  fish: '생선',
  fish_generic: '생선',
  tuna: '참치',
  salmon: '연어',
  ham: '햄',
};

export function normalizeIngredientToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function parseIngredientTokens(raw: string): string[] {
  return [...new Set(
    raw
      .split(/[,，\s]+/)
      .map((token) => normalizeIngredientToken(token))
      .filter(Boolean),
  )];
}

function expandTokenAliases(token: string): string[] {
  const normalized = normalizeIngredientToken(token);
  const keys = new Set<string>([normalized]);

  for (const [iconKey, aliases] of Object.entries(TOKEN_ALIASES)) {
    const aliasNorms = aliases.map((alias) => normalizeIngredientToken(alias));
    if (aliasNorms.includes(normalized)) {
      keys.add(iconKey);
      for (const alias of aliasNorms) keys.add(alias);
    }
  }

  return [...keys];
}

function ingredientNames(ingredients: RecipeIngredient[]): string[] {
  return ingredients.map((item) => normalizeIngredientToken(item.name));
}

function ingredientIconKeys(ingredients: RecipeIngredient[]): string[] {
  return ingredients.map((item) => item.iconKey?.trim() ?? '').filter(Boolean);
}

function tokensOverlap(left: string, right: string): boolean {
  const a = normalizeIngredientToken(left);
  const b = normalizeIngredientToken(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function tokensConflict(left: string, right: string): boolean {
  const leftKeys = expandTokenAliases(left);
  const rightKeys = expandTokenAliases(right);
  return leftKeys.some((l) => rightKeys.some((r) => tokensOverlap(l, r)));
}

export function buildAvoidedTokens(settings: AiRecommendationSettings): string[] {
  return [
    ...settings.avoidedFoods.map((key) => normalizeIngredientToken(AVOIDED_FOOD_LABELS[key])),
    ...parseIngredientTokens(settings.customAvoidedFood),
  ];
}

export function buildFavoriteTokens(settings: AiRecommendationSettings): string[] {
  return parseIngredientTokens(settings.customFavoriteFood);
}

export function findConflictingFavoriteAvoidTokens(settings: AiRecommendationSettings): string[] {
  const favorites = buildFavoriteTokens(settings);
  const avoided = buildAvoidedTokens(settings);
  if (favorites.length === 0 || avoided.length === 0) return [];

  const conflicts: string[] = [];
  for (const favorite of favorites) {
    if (avoided.some((avoidedToken) => tokensConflict(favorite, avoidedToken))) {
      conflicts.push(favorite);
    }
  }

  for (const preset of settings.avoidedFoods) {
    const label = normalizeIngredientToken(AVOIDED_FOOD_LABELS[preset]);
    if (favorites.some((favorite) => tokensConflict(favorite, label))) {
      conflicts.push(label);
    }
  }

  return [...new Set(conflicts)];
}

export type FavoriteIngredientMatch = {
  token: string;
  iconKey: string;
  label: string;
};

function resolveIconKeyLabel(iconKey: string): string {
  return ICON_KEY_LABELS[iconKey] ?? iconKey.replace(/_/g, ' ');
}

function matchTokenInRecipe(
  token: string,
  recipe: Recipe,
  metadata: RecipeStandardMetadata,
): FavoriteIngredientMatch | null {
  const aliases = expandTokenAliases(token);
  const names = ingredientNames(recipe.ingredients);
  const icons = ingredientIconKeys(recipe.ingredients);
  const mainIngredients = metadata.mainIngredients;

  for (const alias of aliases) {
    if (mainIngredients.includes(alias)) {
      return { token, iconKey: alias, label: resolveIconKeyLabel(alias) };
    }
    if (icons.includes(alias)) {
      return { token, iconKey: alias, label: resolveIconKeyLabel(alias) };
    }
    if (names.some((name) => tokensOverlap(name, alias))) {
      const iconKey = icons.find((key) => key === alias) ?? alias;
      return { token, iconKey, label: resolveIconKeyLabel(iconKey) };
    }
  }

  for (const iconKey of mainIngredients) {
    if (aliases.some((alias) => tokensOverlap(alias, iconKey))) {
      return { token, iconKey, label: resolveIconKeyLabel(iconKey) };
    }
  }

  for (const iconKey of icons) {
    if (aliases.some((alias) => tokensOverlap(alias, iconKey))) {
      return { token, iconKey, label: resolveIconKeyLabel(iconKey) };
    }
  }

  for (const name of names) {
    if (aliases.some((alias) => tokensOverlap(name, alias))) {
      return { token, iconKey: name, label: name };
    }
  }

  return null;
}

export function findFavoriteIngredientMatches(
  recipe: Recipe,
  metadata: RecipeStandardMetadata,
  favoriteTokens: string[],
): FavoriteIngredientMatch[] {
  if (favoriteTokens.length === 0) return [];

  const matches: FavoriteIngredientMatch[] = [];
  for (const token of favoriteTokens) {
    const match = matchTokenInRecipe(token, recipe, metadata);
    if (match) matches.push(match);
  }

  return matches
    .sort((a, b) => a.iconKey.localeCompare(b.iconKey) || a.token.localeCompare(b.token))
    .slice(0, MAX_FAVORITE_INGREDIENT_HITS);
}

export function buildFavoriteIngredientReason(match: FavoriteIngredientMatch): string {
  if (match.iconKey === 'chicken') {
    return '선호하는 닭고기 메뉴로 골라봤어요.';
  }
  return `좋아하는 ${match.label}이 들어간 메뉴예요.`;
}

export function presetAvoidsToken(preset: AvoidedFoodPreset, token: string): boolean {
  const label = normalizeIngredientToken(AVOIDED_FOOD_LABELS[preset]);
  return tokensConflict(label, token);
}
