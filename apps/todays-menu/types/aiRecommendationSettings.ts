export type SpicyTolerance = 'mild' | 'like' | 'normal' | 'dislike';

export type PreferredCuisine =
  | 'korean'
  | 'western'
  | 'chinese'
  | 'japanese'
  | 'snack'
  | 'asian'
  | 'fusion'
  /** @deprecated UI removed — kept for stored data backward compatibility */
  | 'healthy';

export type PreferredDishType =
  | 'rice'
  | 'rice_bowl'
  | 'noodle'
  | 'soup'
  | 'stew'
  | 'stir_fry'
  | 'grilled'
  | 'fried'
  | 'salad'
  | 'sandwich';

export type PreferredSituation =
  | 'solo_meal'
  | 'family_meal'
  | 'kids_meal'
  | 'quick_meal'
  | 'comfort_food'
  | 'light_meal';

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
  preferredDishTypes: PreferredDishType[];
  preferredSituations: PreferredSituation[];
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
  preferredDishTypes: [],
  preferredSituations: [],
  avoidedFoods: [],
  customAvoidedFood: '',
  customFavoriteFood: '',
  householdSize: null,
  maxCookTime: null,
  updatedAt: new Date(0).toISOString(),
};

/** Returns a fresh copy of the official AI recommendation settings defaults. */
export function createDefaultAiRecommendationSettings(): AiRecommendationSettings {
  return {
    ...DEFAULT_AI_RECOMMENDATION_SETTINGS,
    preferredCuisines: [],
    preferredDishTypes: [],
    preferredSituations: [],
    avoidedFoods: [],
  };
}
