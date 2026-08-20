/**
 * HANKKI Analytics V1 — event names and typed payloads.
 * Keep this list small; do not add PII fields.
 */

export const ANALYTICS_EVENTS = {
  recipeImpression: 'recipe_impression',
  recipeOpen: 'recipe_open',
  favoriteChange: 'favorite_change',
  recommendationRefresh: 'recommendation_refresh',
  fridgeOpen: 'fridge_open',
  fridgeResult: 'fridge_result',
  shoppingCtaClick: 'shopping_cta_click',
  mealKitCtaClick: 'meal_kit_cta_click',
  shoppingScreenView: 'shopping_screen_view',
  shoppingProductClick: 'shopping_product_click',
  convenienceOpen: 'convenience_open',
  convenienceComboOpen: 'convenience_combo_open',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsMealTime = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export type AnalyticsRecipeSource =
  | 'home'
  | 'alternative'
  | 'fridge'
  | 'favorite'
  | 'history'
  | 'search'
  | 'qa'
  | 'delivery'
  | 'other';

export type AnalyticsShoppingMode = 'all' | 'missing' | 'meal_kit';

export type AnalyticsFavoriteAction = 'add' | 'remove';

export type RecipeImpressionParams = {
  recipe_id: string;
  meal_time: AnalyticsMealTime;
  source: AnalyticsRecipeSource;
};

export type RecipeOpenParams = {
  recipe_id: string;
  source: AnalyticsRecipeSource;
};

export type FavoriteChangeParams = {
  recipe_id: string;
  action: AnalyticsFavoriteAction;
};

export type RecommendationRefreshParams = {
  meal_time: AnalyticsMealTime;
};

export type FridgeResultParams = {
  result_count: number;
};

export type ShoppingCtaClickParams = {
  recipe_id: string;
  mode: 'all' | 'missing';
};

export type MealKitCtaClickParams = {
  recipe_id: string;
};

export type ShoppingScreenViewParams = {
  recipe_id: string;
  mode: AnalyticsShoppingMode;
};

export type ShoppingProductClickParams = {
  recipe_id: string;
  mode: AnalyticsShoppingMode;
  merchant: string;
  is_affiliate: boolean;
};

export type ConvenienceComboOpenParams = {
  combo_id: string;
};

export const ANALYTICS_EVENT_NAMES: readonly AnalyticsEventName[] = [
  ANALYTICS_EVENTS.recipeImpression,
  ANALYTICS_EVENTS.recipeOpen,
  ANALYTICS_EVENTS.favoriteChange,
  ANALYTICS_EVENTS.recommendationRefresh,
  ANALYTICS_EVENTS.fridgeOpen,
  ANALYTICS_EVENTS.fridgeResult,
  ANALYTICS_EVENTS.shoppingCtaClick,
  ANALYTICS_EVENTS.mealKitCtaClick,
  ANALYTICS_EVENTS.shoppingScreenView,
  ANALYTICS_EVENTS.shoppingProductClick,
  ANALYTICS_EVENTS.convenienceOpen,
  ANALYTICS_EVENTS.convenienceComboOpen,
];

export const FORBIDDEN_ANALYTICS_PARAM_KEYS = [
  'nickname',
  'name',
  'email',
  'phone',
  'pantry',
  'keyword',
  'query',
  'title',
  'product_title',
  'advertising_id',
  'idfa',
  'gaid',
  'ip',
] as const;
