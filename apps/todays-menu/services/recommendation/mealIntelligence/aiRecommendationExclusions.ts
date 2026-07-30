import type { StandardAllergyTag } from '../../../data/recipes/recipeStandardMetadataTypes';
import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { AiRecommendationSettings } from '../../../types/aiRecommendationSettings';
import { resolveMenuAiRecipeContext } from './resolveMenuStandardMetadata';
import {
  buildAvoidedTokens,
  buildFavoriteTokens,
  findConflictingFavoriteAvoidTokens,
  findFavoriteIngredientMatches,
  tokensConflict,
} from './aiRecommendationIngredientMatch';

const SEAFOOD_ICON_KEYS = new Set([
  'fish',
  'fish_generic',
  'tuna',
  'salmon',
  'mackerel',
  'anchovy',
  'fish_cake',
  'squid',
  'octopus',
]);

const SEAFOOD_NAME_PATTERN = /새우|게|조개|홍합|멸치|오징어|문어|전복|굴|해산|어묵|북어|고등어|갈치|꽁치|삼치|낙지|문어|조개|바지락/;
const MUSHROOM_NAME_PATTERN = /버섯|표고|느타리|새송이/;
const MEAT_ALLERGY_BY_TOKEN: Record<string, StandardAllergyTag> = {
  돼지: 'pork',
  돼지고기: 'pork',
  삼겹: 'pork',
  목살: 'pork',
  소고기: 'beef',
  쇠고기: 'beef',
  닭: 'chicken',
  닭고기: 'chicken',
  계란: 'egg',
  달걀: 'egg',
  우유: 'milk',
  치즈: 'milk',
  땅콩: 'peanut',
  견과: 'nuts',
  밀: 'wheat',
  밀가루: 'wheat',
  빵: 'wheat',
  두부: 'soy',
  간장: 'soy',
};

export type AiRecommendationExclusionResult = {
  excluded: boolean;
  reasons: string[];
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function ingredientNames(recipe: NonNullable<ReturnType<typeof resolveMenuAiRecipeContext>['recipe']>): string[] {
  return recipe.ingredients.map((item) => normalizeToken(item.name));
}

function ingredientIconKeys(
  recipe: NonNullable<ReturnType<typeof resolveMenuAiRecipeContext>['recipe']>,
): string[] {
  return recipe.ingredients.map((item) => item.iconKey?.trim() ?? '');
}

function matchesAvoidedTokens(name: string, tokens: string[]): boolean {
  return tokens.some((token) => token.length > 0 && (name.includes(token) || token.includes(name)));
}

function excludesForAvoidedFoods(
  menu: MenuItem,
  settings: AiRecommendationSettings,
  recipe: ReturnType<typeof resolveMenuAiRecipeContext>['recipe'],
  metadata: ReturnType<typeof resolveMenuAiRecipeContext>['metadata'],
): string[] {
  const reasons: string[] = [];
  const tokens = buildAvoidedTokens(settings);
  if (tokens.length === 0 || !recipe) return reasons;

  const names = ingredientNames(recipe);
  const icons = ingredientIconKeys(recipe);
  const allergyTags = metadata?.allergyTags ?? [];

  for (const token of tokens) {
    if (names.some((name) => matchesAvoidedTokens(name, [token]))) {
      reasons.push(`avoided_ingredient:${token}`);
    }
  }

  if (settings.avoidedFoods.includes('seafood')) {
    const seafoodByName = names.some((name) => SEAFOOD_NAME_PATTERN.test(name));
    const seafoodByIcon = icons.some((key) => SEAFOOD_ICON_KEYS.has(key));
    const seafoodByTag = allergyTags.some((tag) => tag === 'fish' || tag === 'shellfish');
    if (seafoodByName || seafoodByIcon || seafoodByTag) {
      reasons.push('avoided_food:seafood');
    }
  }

  if (settings.avoidedFoods.includes('mushroom')) {
    const mushroomByName = names.some((name) => MUSHROOM_NAME_PATTERN.test(name));
    const mushroomByIcon = icons.includes('mushroom');
    if (mushroomByName || mushroomByIcon) {
      reasons.push('avoided_food:mushroom');
    }
  }

  for (const token of tokens) {
    const allergy = MEAT_ALLERGY_BY_TOKEN[token];
    if (!allergy) continue;
    if (allergyTags.includes(allergy)) {
      reasons.push(`avoided_allergy:${allergy}`);
    }
    if (icons.includes(allergy === 'pork' ? 'ham' : allergy)) {
      reasons.push(`avoided_allergy_icon:${allergy}`);
    }
  }

  return [...new Set(reasons)];
}

function excludesForSpicyTolerance(
  settings: AiRecommendationSettings,
  metadata: ReturnType<typeof resolveMenuAiRecipeContext>['metadata'],
  recipe: ReturnType<typeof resolveMenuAiRecipeContext>['recipe'],
): string[] {
  if (settings.spicyLevel !== 'dislike') return [];

  const reasons: string[] = [];
  const spice = metadata?.spiceLevel;
  if (spice === 'spicy' || spice === 'medium') {
    reasons.push(`spicy_tolerance:${spice}`);
  }

  const decisionSpicy = recipe?.decisionTags?.spicyLevel;
  if (typeof decisionSpicy === 'number' && decisionSpicy >= 2) {
    reasons.push('spicy_tolerance:decision_spicy');
  }

  const blob = [...(recipe?.aiTags ?? []), ...(recipe?.tags ?? [])].join(' ').toLowerCase();
  if (/spicy|매콤|매운|고추장|고춧가루/.test(blob) && !reasons.length) {
    reasons.push('spicy_tolerance:tag_spicy');
  }

  return reasons;
}

function excludesForFavoriteAvoidConflict(
  settings: AiRecommendationSettings,
  recipe: ReturnType<typeof resolveMenuAiRecipeContext>['recipe'],
  metadata: ReturnType<typeof resolveMenuAiRecipeContext>['metadata'],
): string[] {
  const conflicts = findConflictingFavoriteAvoidTokens(settings);
  if (conflicts.length === 0 || !recipe || !metadata) return [];

  const reasons: string[] = [];
  const favoriteTokens = buildFavoriteTokens(settings);

  for (const token of conflicts) {
    const match = findFavoriteIngredientMatches(recipe, metadata, [token]);
    if (match.length > 0) {
      reasons.push(`favorite_avoid_conflict:${token}`);
    }
  }

  if (favoriteTokens.length === 0) return [...new Set(reasons)];

  const avoided = buildAvoidedTokens(settings);
  for (const favorite of favoriteTokens) {
    if (!avoided.some((avoidedToken) => tokensConflict(favorite, avoidedToken))) continue;
    const match = findFavoriteIngredientMatches(recipe, metadata, [favorite]);
    if (match.length > 0) {
      reasons.push(`favorite_avoid_overlap:${favorite}`);
    }
  }

  return [...new Set(reasons)];
}

/** Hard exclusion rules — stronger than score penalties. */
export function evaluateAiRecommendationExclusions(
  menu: MenuItem,
  context?: RecommendationContext,
): AiRecommendationExclusionResult {
  const settings = context?.aiRecommendationSettings;
  if (!settings) {
    return { excluded: false, reasons: [] };
  }

  const { recipe, metadata } = resolveMenuAiRecipeContext(menu);
  const reasons = [
    ...excludesForAvoidedFoods(menu, settings, recipe, metadata),
    ...excludesForSpicyTolerance(settings, metadata, recipe),
    ...excludesForFavoriteAvoidConflict(settings, recipe, metadata),
  ];

  return {
    excluded: reasons.length > 0,
    reasons: [...new Set(reasons)],
  };
}

export function menuPassesAiRecommendationExclusions(
  menu: MenuItem,
  context?: RecommendationContext,
): boolean {
  return !evaluateAiRecommendationExclusions(menu, context).excluded;
}
