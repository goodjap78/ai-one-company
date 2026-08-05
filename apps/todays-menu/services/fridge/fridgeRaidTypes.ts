import type { ImageSourcePropType } from 'react-native';
import type { Recipe } from '../../data/recipes/types';
import type { PantrySnapshot } from '../../types/pantry';
import type { RecommendationContext } from '../../types/preference';
import type { FridgeRecommendationStarRating } from './fridgeRecommendationIntelligence';

/** Legacy group id — kept for side dishes and migration helpers. */
export type FridgeRaidGroupId = 'ready' | 'one_missing' | 'similar' | 'side_dish';

export type FridgeRequiredIngredient = {
  matchKey: string;
  name: string;
  group: 'main' | 'sub' | 'seasoning';
};

/** Hero image resolved at display time — supports bundled asset or remote URL. */
export type FridgeRaidHeroImage = {
  emoji: string;
  url?: string | null;
  source?: ImageSourcePropType;
  accessibilityLabel?: string;
};

export type FridgeRaidScoredCandidate = {
  recipeId: string;
  title: string;
  cookTime: number;
  group: FridgeRaidGroupId;
  starRating: FridgeRecommendationStarRating;
  tierHint: string;
  matchedIngredients: string[];
  missingIngredients: string[];
  extraSelectedIngredients: string[];
  matchedCount: number;
  missingCount: number;
  matchRatio: number;
  selectedIngredientCount: number;
  matchedSelectedIngredients: string[];
  matchedSelectedCount: number;
  selectedCoverageRatio: number;
  unusedSelectedIngredients: string[];
  matchPercent: number;
  reason: string;
  /** @deprecated Use matchedIngredients */
  ownedMainNames: string[];
  /** @deprecated Use missingIngredients */
  missingMainNames: string[];
  /** @deprecated Sprint 54 — sort tiers replace weighted score */
  score: number;
  /** @deprecated */
  mainMatchRatio: number;
  /** @deprecated */
  subMatchRatio: number;
  difficultyRank: number;
  recommendationPriority: number;
};

export type FridgeRaidCandidate = FridgeRaidScoredCandidate & {
  heroImage: FridgeRaidHeroImage;
};

export type FridgeRaidScoredGroups = {
  tier5: FridgeRaidScoredCandidate[];
  tier4: FridgeRaidScoredCandidate[];
  tier3: FridgeRaidScoredCandidate[];
  extended: FridgeRaidScoredCandidate[];
  sideDishes: FridgeRaidScoredCandidate[];
};

export type FridgeRaidDisplayGroups = {
  tier5: FridgeRaidCandidate[];
  tier4: FridgeRaidCandidate[];
  tier3: FridgeRaidCandidate[];
  extended: FridgeRaidCandidate[];
  sideDishes: FridgeRaidCandidate[];
};

/** @deprecated Sprint 54 — use tier5/tier4/tier3/extended */
export type LegacyFridgeRaidScoredGroups = {
  ready: FridgeRaidScoredCandidate[];
  oneMissing: FridgeRaidScoredCandidate[];
  similar: FridgeRaidScoredCandidate[];
  sideDishes: FridgeRaidScoredCandidate[];
};

/** @deprecated Sprint 54 */
export type LegacyFridgeRaidDisplayGroups = {
  ready: FridgeRaidCandidate[];
  oneMissing: FridgeRaidCandidate[];
  similar: FridgeRaidCandidate[];
  sideDishes: FridgeRaidCandidate[];
};

export type FridgeRaidScoreInput = {
  recipes: Recipe[];
  pantry: PantrySnapshot;
  context: RecommendationContext;
};

export type FridgeRaidDisplayInput = FridgeRaidScoreInput & {
  /** Defaults to 5 — only applied at display selection, after full scoring. */
  limitPerGroup?: number;
  /** When false, skips image resolution (Node tests). Defaults to true. */
  attachHeroImages?: boolean;
};

/** Pre-normalized required ingredients for a recipe — built once and memoized. */
export type FridgeRecipeIndexEntry = {
  recipeId: string;
  title: string;
  cookTime: number;
  difficulty: string;
  recommendationPriority: number;
  imagePath: string;
  heroImageKey: string;
  requiredIngredients: FridgeRequiredIngredient[];
  mainMatchKeys: string[];
  mainNames: string[];
  subMatchKeys: string[];
};
