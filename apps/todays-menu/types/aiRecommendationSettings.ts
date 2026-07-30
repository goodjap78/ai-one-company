export type SpicyTolerance = 'like' | 'normal' | 'dislike';

export type PreferredCuisine =
  | 'korean'
  | 'western'
  | 'chinese'
  | 'japanese'
  | 'snack'
  | 'healthy';

export type AvoidedFoodPreset =
  | 'cucumber'
  | 'eggplant'
  | 'cilantro'
  | 'seafood'
  | 'mushroom';

export type HouseholdSize = 'solo' | 'two' | 'three_four' | 'family';

export type MaxCookTimePreference = '10' | '20' | '30' | 'any';

export type AiRecommendationSettings = {
  spicyLevel: SpicyTolerance | null;
  preferredCuisines: PreferredCuisine[];
  avoidedFoods: AvoidedFoodPreset[];
  customAvoidedFood: string;
  /** Comma-separated favorite ingredients (e.g. "계란, 닭고기"). */
  customFavoriteFood: string;
  householdSize: HouseholdSize | null;
  maxCookTime: MaxCookTimePreference | null;
  updatedAt: string;
};

export const DEFAULT_AI_RECOMMENDATION_SETTINGS: AiRecommendationSettings = {
  spicyLevel: null,
  preferredCuisines: [],
  avoidedFoods: [],
  customAvoidedFood: '',
  customFavoriteFood: '',
  householdSize: null,
  maxCookTime: null,
  updatedAt: new Date(0).toISOString(),
};
