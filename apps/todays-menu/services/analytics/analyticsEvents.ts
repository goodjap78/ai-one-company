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
  elementaryWeeklyPlanView: 'elementary_weekly_plan_view',
  elementaryWeeklyPlanRefresh: 'elementary_weekly_plan_refresh',
  elementaryWeeklyPlanRecipeClick: 'elementary_weekly_plan_recipe_click',
  elementaryWeeklyPlanImageSave: 'elementary_weekly_plan_image_save',
  elementaryWeeklyPlanShare: 'elementary_weekly_plan_share',
  toddlerMealFeedView: 'toddler_meal_feed_view',
  toddlerMealRefresh: 'toddler_meal_refresh',
  toddlerMealRecipeClick: 'toddler_meal_recipe_click',
  babyFoodFeedView: 'baby_food_feed_view',
  babyFoodStageChange: 'baby_food_stage_change',
  babyFoodRecipeClick: 'baby_food_recipe_click',
  babyFoodTransitionView: 'baby_food_transition_view',
  childRecipeDetailView: 'child_recipe_detail_view',
  babyPortionChange: 'baby_portion_change',
  childSearch: 'child_search',
  childFilterChange: 'child_filter_change',
  childSearchRecipeClick: 'child_search_recipe_click',
  babyWeeklyPlanView: 'baby_weekly_plan_view',
  babyWeeklyPlanStageChange: 'baby_weekly_plan_stage_change',
  babyWeeklyPlanRefresh: 'baby_weekly_plan_refresh',
  babyWeeklyPlanRecipeClick: 'baby_weekly_plan_recipe_click',
  babyWeeklyPlanShare: 'baby_weekly_plan_share',
  babyWeeklyPlanSave: 'baby_weekly_plan_save',
  babyBatchCookingOpen: 'baby_batch_cooking_open',
  babyBatchRecipeToggle: 'baby_batch_recipe_toggle',
  babyBatchPortionChange: 'baby_batch_portion_change',
  babyBatchIngredientView: 'baby_batch_ingredient_view',
  babyGroceryChecklistView: 'baby_grocery_checklist_view',
  babyGroceryItemToggle: 'baby_grocery_item_toggle',
  babyGroceryChecklistReset: 'baby_grocery_checklist_reset',
  babyGroceryChecklistShare: 'baby_grocery_checklist_share',
  toddlerWeeklyPlanView: 'toddler_weekly_plan_view',
  toddlerWeeklyPlanMealChange: 'toddler_weekly_plan_meal_change',
  toddlerWeeklyPlanRefresh: 'toddler_weekly_plan_refresh',
  toddlerWeeklyPlanRecipeClick: 'toddler_weekly_plan_recipe_click',
  toddlerWeeklyPlanSave: 'toddler_weekly_plan_save',
  toddlerWeeklyPlanShare: 'toddler_weekly_plan_share',
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
  | 'kids_weekly_plan'
  | 'toddler_meal_feed'
  | 'baby_food_feed'
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

export type AnalyticsElementaryWeeklyPlanMode = 'breakfast' | 'dinner';

export type ElementaryWeeklyPlanViewParams = {
  mode: AnalyticsElementaryWeeklyPlanMode;
  seed: string;
};

export type ElementaryWeeklyPlanRefreshParams = {
  mode: AnalyticsElementaryWeeklyPlanMode;
  seed: string;
};

export type ElementaryWeeklyPlanRecipeClickParams = {
  mode: AnalyticsElementaryWeeklyPlanMode;
  recipe_id: string;
  seed: string;
};

export type ElementaryWeeklyPlanImageSaveParams = {
  mode: AnalyticsElementaryWeeklyPlanMode;
  seed: string;
};

export type ElementaryWeeklyPlanShareParams = {
  mode: AnalyticsElementaryWeeklyPlanMode;
  seed: string;
};

export type AnalyticsToddlerMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ToddlerMealFeedViewParams = {
  meal_type: AnalyticsToddlerMealType;
};

export type ToddlerMealRefreshParams = {
  meal_type: AnalyticsToddlerMealType;
};

export type ToddlerMealRecipeClickParams = {
  recipe_id: string;
  meal_type: AnalyticsToddlerMealType;
};

export type AnalyticsBabyFoodStage = 'early' | 'middle' | 'late' | 'completion';

export type AnalyticsChildAudience = 'baby' | 'toddler' | 'elementary';

export type BabyFoodFeedViewParams = {
  stage: AnalyticsBabyFoodStage;
};

export type BabyFoodStageChangeParams = {
  stage: AnalyticsBabyFoodStage;
};

export type BabyFoodRecipeClickParams = {
  recipe_id: string;
  stage: AnalyticsBabyFoodStage;
};

export type BabyFoodTransitionViewParams = {
  stage: 'completion';
};

export type ChildRecipeDetailViewParams = {
  recipe_id: string;
  audience: AnalyticsChildAudience;
  stage?: AnalyticsBabyFoodStage;
};

export type BabyPortionChangeParams = {
  recipe_id: string;
  audience: 'baby';
  portion: 1 | 3 | 6;
};

export type ChildSearchParams = {
  audience: AnalyticsChildAudience;
  query_length: number;
  filter_types: string;
  result_count: number;
};

export type ChildFilterChangeParams = {
  audience: AnalyticsChildAudience;
  filter_types: string;
  result_count: number;
};

export type ChildSearchRecipeClickParams = {
  recipe_id: string;
  audience: AnalyticsChildAudience;
};

export type BabyWeeklyPlanViewParams = {
  stage: AnalyticsBabyFoodStage;
  seed: string;
};

export type BabyWeeklyPlanStageChangeParams = {
  stage: AnalyticsBabyFoodStage;
};

export type BabyWeeklyPlanRefreshParams = {
  stage: AnalyticsBabyFoodStage;
  seed: string;
};

export type BabyWeeklyPlanRecipeClickParams = {
  stage: AnalyticsBabyFoodStage;
  recipe_id: string;
  seed: string;
};

export type BabyWeeklyPlanShareParams = {
  stage: AnalyticsBabyFoodStage;
  seed: string;
};

export type BabyWeeklyPlanSaveParams = {
  stage: AnalyticsBabyFoodStage;
  seed: string;
};

export type BabyBatchCookingOpenParams = {
  stage: AnalyticsBabyFoodStage;
  selected_count: number;
};

export type BabyBatchRecipeToggleParams = {
  stage: AnalyticsBabyFoodStage;
  recipe_id: string;
  selected_count: number;
};

export type BabyBatchPortionChangeParams = {
  stage: AnalyticsBabyFoodStage;
  recipe_id: string;
  portion: number;
};

export type BabyBatchIngredientViewParams = {
  stage: AnalyticsBabyFoodStage;
  selected_count: number;
};

export type BabyGroceryChecklistViewParams = {
  stage: AnalyticsBabyFoodStage;
  item_count: number;
  checked_count: number;
};

export type BabyGroceryChecklistItemToggleParams = {
  stage: AnalyticsBabyFoodStage;
  item_count: number;
  checked_count: number;
};

export type BabyGroceryChecklistResetParams = {
  stage: AnalyticsBabyFoodStage;
  item_count: number;
  checked_count: number;
};

export type BabyGroceryChecklistShareParams = {
  stage: AnalyticsBabyFoodStage;
  item_count: number;
  checked_count: number;
};

export type ToddlerWeeklyPlanViewParams = {
  meal_type: AnalyticsToddlerMealType;
  seed: string;
};

export type ToddlerWeeklyPlanMealChangeParams = {
  meal_type: AnalyticsToddlerMealType;
};

export type ToddlerWeeklyPlanRefreshParams = {
  meal_type: AnalyticsToddlerMealType;
  seed: string;
};

export type ToddlerWeeklyPlanRecipeClickParams = {
  meal_type: AnalyticsToddlerMealType;
  recipe_id: string;
  seed: string;
};

export type ToddlerWeeklyPlanSaveParams = {
  meal_type: AnalyticsToddlerMealType;
  seed: string;
};

export type ToddlerWeeklyPlanShareParams = {
  meal_type: AnalyticsToddlerMealType;
  seed: string;
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
  ANALYTICS_EVENTS.elementaryWeeklyPlanView,
  ANALYTICS_EVENTS.elementaryWeeklyPlanRefresh,
  ANALYTICS_EVENTS.elementaryWeeklyPlanRecipeClick,
  ANALYTICS_EVENTS.elementaryWeeklyPlanImageSave,
  ANALYTICS_EVENTS.elementaryWeeklyPlanShare,
  ANALYTICS_EVENTS.toddlerMealFeedView,
  ANALYTICS_EVENTS.toddlerMealRefresh,
  ANALYTICS_EVENTS.toddlerMealRecipeClick,
  ANALYTICS_EVENTS.babyFoodFeedView,
  ANALYTICS_EVENTS.babyFoodStageChange,
  ANALYTICS_EVENTS.babyFoodRecipeClick,
  ANALYTICS_EVENTS.babyFoodTransitionView,
  ANALYTICS_EVENTS.childRecipeDetailView,
  ANALYTICS_EVENTS.babyPortionChange,
  ANALYTICS_EVENTS.childSearch,
  ANALYTICS_EVENTS.childFilterChange,
  ANALYTICS_EVENTS.childSearchRecipeClick,
  ANALYTICS_EVENTS.babyWeeklyPlanView,
  ANALYTICS_EVENTS.babyWeeklyPlanStageChange,
  ANALYTICS_EVENTS.babyWeeklyPlanRefresh,
  ANALYTICS_EVENTS.babyWeeklyPlanRecipeClick,
  ANALYTICS_EVENTS.babyWeeklyPlanShare,
  ANALYTICS_EVENTS.babyWeeklyPlanSave,
  ANALYTICS_EVENTS.babyBatchCookingOpen,
  ANALYTICS_EVENTS.babyBatchRecipeToggle,
  ANALYTICS_EVENTS.babyBatchPortionChange,
  ANALYTICS_EVENTS.babyBatchIngredientView,
  ANALYTICS_EVENTS.babyGroceryChecklistView,
  ANALYTICS_EVENTS.babyGroceryItemToggle,
  ANALYTICS_EVENTS.babyGroceryChecklistReset,
  ANALYTICS_EVENTS.babyGroceryChecklistShare,
  ANALYTICS_EVENTS.toddlerWeeklyPlanView,
  ANALYTICS_EVENTS.toddlerWeeklyPlanMealChange,
  ANALYTICS_EVENTS.toddlerWeeklyPlanRefresh,
  ANALYTICS_EVENTS.toddlerWeeklyPlanRecipeClick,
  ANALYTICS_EVENTS.toddlerWeeklyPlanSave,
  ANALYTICS_EVENTS.toddlerWeeklyPlanShare,
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
