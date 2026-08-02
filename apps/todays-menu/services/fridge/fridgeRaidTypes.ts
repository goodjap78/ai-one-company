import type { ImageSourcePropType } from 'react-native';
import type { Recipe } from '../../data/recipes/types';
import type { PantrySnapshot } from '../../types/pantry';
import type { RecommendationContext } from '../../types/preference';

export type FridgeRaidGroupId = 'ready' | 'one_missing' | 'similar' | 'side_dish';

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
  score: number;
  mainMatchRatio: number;
  subMatchRatio: number;
  matchPercent: number;
  ownedMainNames: string[];
  missingMainNames: string[];
  reason: string;
};

export type FridgeRaidCandidate = FridgeRaidScoredCandidate & {
  heroImage: FridgeRaidHeroImage;
};

export type FridgeRaidScoredGroups = {
  ready: FridgeRaidScoredCandidate[];
  oneMissing: FridgeRaidScoredCandidate[];
  similar: FridgeRaidScoredCandidate[];
  sideDishes: FridgeRaidScoredCandidate[];
};

export type FridgeRaidDisplayGroups = {
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

/** Pre-normalized main/sub match keys for a recipe — built once and memoized. */
export type FridgeRecipeIndexEntry = {
  recipeId: string;
  title: string;
  cookTime: number;
  imagePath: string;
  heroImageKey: string;
  mainMatchKeys: string[];
  mainNames: string[];
  subMatchKeys: string[];
};
