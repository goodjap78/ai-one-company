import type { ShoppingListMode } from '../../constants/shoppingConfig';
import { setShoppingAnalyticsProvider } from '../shopping/shoppingAnalytics';
import {
  getShoppingAnalyticsContext,
} from './analyticsContext';
import {
  ANALYTICS_EVENTS,
  FORBIDDEN_ANALYTICS_PARAM_KEYS,
  type AnalyticsEventName,
  type AnalyticsShoppingMode,
  type ConvenienceComboOpenParams,
  type ElementaryWeeklyPlanImageSaveParams,
  type ElementaryWeeklyPlanRecipeClickParams,
  type ElementaryWeeklyPlanRefreshParams,
  type ElementaryWeeklyPlanShareParams,
  type ElementaryWeeklyPlanViewParams,
  type ToddlerMealFeedViewParams,
  type ToddlerMealRecipeClickParams,
  type ToddlerMealRefreshParams,
  type BabyFoodFeedViewParams,
  type BabyFoodRecipeClickParams,
  type BabyFoodStageChangeParams,
  type BabyFoodTransitionViewParams,
  type BabyPortionChangeParams,
  type BabyWeeklyPlanRecipeClickParams,
  type BabyWeeklyPlanRefreshParams,
  type BabyWeeklyPlanSaveParams,
  type BabyWeeklyPlanShareParams,
  type BabyWeeklyPlanStageChangeParams,
  type BabyWeeklyPlanViewParams,
  type BabyBatchCookingOpenParams,
  type BabyBatchRecipeToggleParams,
  type BabyBatchPortionChangeParams,
  type BabyBatchIngredientViewParams,
  type BabyGroceryChecklistViewParams,
  type BabyGroceryChecklistItemToggleParams,
  type BabyGroceryChecklistResetParams,
  type BabyGroceryChecklistShareParams,
  type ToddlerWeeklyPlanViewParams,
  type ToddlerWeeklyPlanMealChangeParams,
  type ToddlerWeeklyPlanRefreshParams,
  type ToddlerWeeklyPlanRecipeClickParams,
  type ToddlerWeeklyPlanSaveParams,
  type ToddlerWeeklyPlanShareParams,
  type ChildFilterChangeParams,
  type ChildSearchParams,
  type ChildSearchRecipeClickParams,
  type ChildRecipeDetailViewParams,
  type FavoriteChangeParams,
  type FridgeResultParams,
  type MealKitCtaClickParams,
  type RecipeImpressionParams,
  type RecipeOpenParams,
  type RecommendationRefreshParams,
  type ShoppingCtaClickParams,
  type ShoppingProductClickParams,
  type ShoppingScreenViewParams,
} from './analyticsEvents';
import { isFirebaseAnalyticsNativeAvailable, logFirebaseAnalyticsEvent } from './firebaseNative';

const MAX_PARAM_VALUE_LENGTH = 100;
const VIEW_DEDUPE_MS = 2000;

const VIEW_EVENTS = new Set<AnalyticsEventName>([
  ANALYTICS_EVENTS.recipeImpression,
  ANALYTICS_EVENTS.recipeOpen,
  ANALYTICS_EVENTS.shoppingScreenView,
  ANALYTICS_EVENTS.fridgeOpen,
  ANALYTICS_EVENTS.fridgeResult,
  ANALYTICS_EVENTS.convenienceOpen,
  ANALYTICS_EVENTS.convenienceComboOpen,
  ANALYTICS_EVENTS.elementaryWeeklyPlanView,
  ANALYTICS_EVENTS.toddlerMealFeedView,
  ANALYTICS_EVENTS.babyFoodFeedView,
  ANALYTICS_EVENTS.babyFoodTransitionView,
  ANALYTICS_EVENTS.babyWeeklyPlanView,
  ANALYTICS_EVENTS.toddlerWeeklyPlanView,
  ANALYTICS_EVENTS.childRecipeDetailView,
]);

const FORBIDDEN_PARAM_SET = new Set<string>(FORBIDDEN_ANALYTICS_PARAM_KEYS);

export type AnalyticsPrimitive = string | number | boolean | undefined | null;

export type AnalyticsListener = (
  name: AnalyticsEventName,
  params: Record<string, string | number>,
) => void;

let testListener: AnalyticsListener | null = null;
let shoppingBridgeAttached = false;
const lastViewSentAt = new Map<string, number>();

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function isForbiddenParamKey(key: string): boolean {
  return FORBIDDEN_PARAM_SET.has(key);
}

export function sanitizeAnalyticsParams(
  params: Record<string, AnalyticsPrimitive> | undefined,
): Record<string, string | number> {
  if (!params) return {};

  const out: Record<string, string | number> = {};

  for (const [rawKey, rawValue] of Object.entries(params)) {
    const key = rawKey.trim();
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) continue;
    if (isForbiddenParamKey(key)) continue;
    if (rawValue == null) continue;

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      out[key] = rawValue;
      continue;
    }

    if (typeof rawValue === 'boolean') {
      out[key] = rawValue ? 'true' : 'false';
      continue;
    }

    if (typeof rawValue === 'string') {
      const value = rawValue.trim().slice(0, MAX_PARAM_VALUE_LENGTH);
      if (value) out[key] = value;
    }
  }

  return out;
}

function viewDedupeKey(
  name: AnalyticsEventName,
  params: Record<string, string | number>,
): string {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${name}:${serialized}`;
}

function shouldSkipDuplicateView(
  name: AnalyticsEventName,
  params: Record<string, string | number>,
): boolean {
  if (!VIEW_EVENTS.has(name)) return false;
  const key = viewDedupeKey(name, params);
  const now = Date.now();
  const previous = lastViewSentAt.get(key);
  if (previous != null && now - previous < VIEW_DEDUPE_MS) return true;
  lastViewSentAt.set(key, now);
  return false;
}

export function setAnalyticsTestListener(listener: AnalyticsListener | null): void {
  testListener = listener;
}

export function toAnalyticsShoppingMode(mode: ShoppingListMode): AnalyticsShoppingMode {
  if (mode === 'meal-kit') return 'meal_kit';
  return mode;
}

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, AnalyticsPrimitive>,
): void {
  try {
    const sanitized = sanitizeAnalyticsParams(params);
    if (shouldSkipDuplicateView(name, sanitized)) return;

    if (isDev()) {
      console.log('[analytics]', name, sanitized);
    }

    testListener?.(name, sanitized);

    void logFirebaseAnalyticsEvent(name, sanitized);
  } catch {
    // Analytics must never break product flows.
  }
}

export function trackRecipeImpression(params: RecipeImpressionParams): void {
  trackEvent(ANALYTICS_EVENTS.recipeImpression, params);
}

export function trackRecipeOpen(params: RecipeOpenParams): void {
  trackEvent(ANALYTICS_EVENTS.recipeOpen, params);
}

export function trackFavoriteChange(params: FavoriteChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.favoriteChange, params);
}

export function trackRecommendationRefresh(params: RecommendationRefreshParams): void {
  trackEvent(ANALYTICS_EVENTS.recommendationRefresh, params);
}

export function trackFridgeOpen(): void {
  trackEvent(ANALYTICS_EVENTS.fridgeOpen);
}

export function trackFridgeResult(params: FridgeResultParams): void {
  trackEvent(ANALYTICS_EVENTS.fridgeResult, {
    result_count: Math.max(0, Math.floor(params.result_count)),
  });
}

export function trackShoppingCtaClick(params: ShoppingCtaClickParams): void {
  trackEvent(ANALYTICS_EVENTS.shoppingCtaClick, params);
}

export function trackMealKitCtaClick(params: MealKitCtaClickParams): void {
  trackEvent(ANALYTICS_EVENTS.mealKitCtaClick, params);
}

export function trackShoppingScreenView(params: ShoppingScreenViewParams): void {
  trackEvent(ANALYTICS_EVENTS.shoppingScreenView, params);
}

export function trackShoppingProductClick(params: ShoppingProductClickParams): void {
  trackEvent(ANALYTICS_EVENTS.shoppingProductClick, {
    recipe_id: params.recipe_id,
    mode: params.mode,
    merchant: params.merchant,
    is_affiliate: params.is_affiliate,
  });
}

export function trackConvenienceOpen(): void {
  trackEvent(ANALYTICS_EVENTS.convenienceOpen);
}

export function trackConvenienceComboOpen(params: ConvenienceComboOpenParams): void {
  trackEvent(ANALYTICS_EVENTS.convenienceComboOpen, params);
}

export function trackElementaryWeeklyPlanView(params: ElementaryWeeklyPlanViewParams): void {
  trackEvent(ANALYTICS_EVENTS.elementaryWeeklyPlanView, {
    mode: params.mode,
    seed: params.seed,
  });
}

export function trackElementaryWeeklyPlanRefresh(
  params: ElementaryWeeklyPlanRefreshParams,
): void {
  trackEvent(ANALYTICS_EVENTS.elementaryWeeklyPlanRefresh, {
    mode: params.mode,
    seed: params.seed,
  });
}

export function trackElementaryWeeklyPlanRecipeClick(
  params: ElementaryWeeklyPlanRecipeClickParams,
): void {
  trackEvent(ANALYTICS_EVENTS.elementaryWeeklyPlanRecipeClick, {
    mode: params.mode,
    recipe_id: params.recipe_id,
    seed: params.seed,
  });
}

export function trackElementaryWeeklyPlanImageSave(
  params: ElementaryWeeklyPlanImageSaveParams,
): void {
  trackEvent(ANALYTICS_EVENTS.elementaryWeeklyPlanImageSave, {
    mode: params.mode,
    seed: params.seed,
  });
}

export function trackElementaryWeeklyPlanShare(
  params: ElementaryWeeklyPlanShareParams,
): void {
  trackEvent(ANALYTICS_EVENTS.elementaryWeeklyPlanShare, {
    mode: params.mode,
    seed: params.seed,
  });
}

export function trackToddlerMealFeedView(params: ToddlerMealFeedViewParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerMealFeedView, { meal_type: params.meal_type });
}

export function trackToddlerMealRefresh(params: ToddlerMealRefreshParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerMealRefresh, { meal_type: params.meal_type });
}

export function trackToddlerMealRecipeClick(params: ToddlerMealRecipeClickParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerMealRecipeClick, {
    recipe_id: params.recipe_id,
    meal_type: params.meal_type,
  });
}

export function trackBabyFoodFeedView(params: BabyFoodFeedViewParams): void {
  trackEvent(ANALYTICS_EVENTS.babyFoodFeedView, { stage: params.stage });
}

export function trackBabyFoodStageChange(params: BabyFoodStageChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.babyFoodStageChange, { stage: params.stage });
}

export function trackBabyFoodRecipeClick(params: BabyFoodRecipeClickParams): void {
  trackEvent(ANALYTICS_EVENTS.babyFoodRecipeClick, {
    recipe_id: params.recipe_id,
    stage: params.stage,
  });
}

export function trackBabyFoodTransitionView(params: BabyFoodTransitionViewParams): void {
  trackEvent(ANALYTICS_EVENTS.babyFoodTransitionView, { stage: params.stage });
}

export function trackChildRecipeDetailView(params: ChildRecipeDetailViewParams): void {
  trackEvent(ANALYTICS_EVENTS.childRecipeDetailView, {
    recipe_id: params.recipe_id,
    audience: params.audience,
    ...(params.stage ? { stage: params.stage } : {}),
  });
}

export function trackBabyPortionChange(params: BabyPortionChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.babyPortionChange, {
    recipe_id: params.recipe_id,
    audience: params.audience,
    portion: params.portion,
  });
}

export function trackChildSearch(params: ChildSearchParams): void {
  trackEvent(ANALYTICS_EVENTS.childSearch, {
    audience: params.audience,
    query_length: params.query_length,
    filter_types: params.filter_types,
    result_count: params.result_count,
  });
}

export function trackChildFilterChange(params: ChildFilterChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.childFilterChange, {
    audience: params.audience,
    filter_types: params.filter_types,
    result_count: params.result_count,
  });
}

export function trackChildSearchRecipeClick(params: ChildSearchRecipeClickParams): void {
  trackEvent(ANALYTICS_EVENTS.childSearchRecipeClick, {
    recipe_id: params.recipe_id,
    audience: params.audience,
  });
}

export function trackBabyWeeklyPlanView(params: BabyWeeklyPlanViewParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanView, {
    stage: params.stage,
    seed: params.seed,
  });
}

export function trackBabyWeeklyPlanStageChange(params: BabyWeeklyPlanStageChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanStageChange, {
    stage: params.stage,
  });
}

export function trackBabyWeeklyPlanRefresh(params: BabyWeeklyPlanRefreshParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanRefresh, {
    stage: params.stage,
    seed: params.seed,
  });
}

export function trackBabyWeeklyPlanRecipeClick(params: BabyWeeklyPlanRecipeClickParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanRecipeClick, {
    stage: params.stage,
    recipe_id: params.recipe_id,
    seed: params.seed,
  });
}

export function trackBabyWeeklyPlanShare(params: BabyWeeklyPlanShareParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanShare, {
    stage: params.stage,
    seed: params.seed,
  });
}

export function trackBabyWeeklyPlanSave(params: BabyWeeklyPlanSaveParams): void {
  trackEvent(ANALYTICS_EVENTS.babyWeeklyPlanSave, {
    stage: params.stage,
    seed: params.seed,
  });
}

export function trackBabyBatchCookingOpen(params: BabyBatchCookingOpenParams): void {
  trackEvent(ANALYTICS_EVENTS.babyBatchCookingOpen, {
    stage: params.stage,
    selected_count: params.selected_count,
  });
}

export function trackBabyBatchRecipeToggle(params: BabyBatchRecipeToggleParams): void {
  trackEvent(ANALYTICS_EVENTS.babyBatchRecipeToggle, {
    stage: params.stage,
    recipe_id: params.recipe_id,
    selected_count: params.selected_count,
  });
}

export function trackBabyBatchPortionChange(params: BabyBatchPortionChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.babyBatchPortionChange, {
    stage: params.stage,
    recipe_id: params.recipe_id,
    portion: params.portion,
  });
}

export function trackBabyBatchIngredientView(params: BabyBatchIngredientViewParams): void {
  trackEvent(ANALYTICS_EVENTS.babyBatchIngredientView, {
    stage: params.stage,
    selected_count: params.selected_count,
  });
}

export function trackBabyGroceryChecklistView(params: BabyGroceryChecklistViewParams): void {
  trackEvent(ANALYTICS_EVENTS.babyGroceryChecklistView, {
    stage: params.stage,
    item_count: params.item_count,
    checked_count: params.checked_count,
  });
}

export function trackBabyGroceryChecklistItemToggle(
  params: BabyGroceryChecklistItemToggleParams,
): void {
  trackEvent(ANALYTICS_EVENTS.babyGroceryItemToggle, {
    stage: params.stage,
    item_count: params.item_count,
    checked_count: params.checked_count,
  });
}

export function trackBabyGroceryChecklistReset(params: BabyGroceryChecklistResetParams): void {
  trackEvent(ANALYTICS_EVENTS.babyGroceryChecklistReset, {
    stage: params.stage,
    item_count: params.item_count,
    checked_count: params.checked_count,
  });
}

export function trackBabyGroceryChecklistShare(params: BabyGroceryChecklistShareParams): void {
  trackEvent(ANALYTICS_EVENTS.babyGroceryChecklistShare, {
    stage: params.stage,
    item_count: params.item_count,
    checked_count: params.checked_count,
  });
}

export function trackToddlerWeeklyPlanView(params: ToddlerWeeklyPlanViewParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanView, {
    meal_type: params.meal_type,
    seed: params.seed,
  });
}

export function trackToddlerWeeklyPlanMealChange(params: ToddlerWeeklyPlanMealChangeParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanMealChange, {
    meal_type: params.meal_type,
  });
}

export function trackToddlerWeeklyPlanRefresh(params: ToddlerWeeklyPlanRefreshParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanRefresh, {
    meal_type: params.meal_type,
    seed: params.seed,
  });
}

export function trackToddlerWeeklyPlanRecipeClick(params: ToddlerWeeklyPlanRecipeClickParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanRecipeClick, {
    meal_type: params.meal_type,
    recipe_id: params.recipe_id,
    seed: params.seed,
  });
}

export function trackToddlerWeeklyPlanSave(params: ToddlerWeeklyPlanSaveParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanSave, {
    meal_type: params.meal_type,
    seed: params.seed,
  });
}

export function trackToddlerWeeklyPlanShare(params: ToddlerWeeklyPlanShareParams): void {
  trackEvent(ANALYTICS_EVENTS.toddlerWeeklyPlanShare, {
    meal_type: params.meal_type,
    seed: params.seed,
  });
}

function attachShoppingAnalyticsBridge(): void {
  if (shoppingBridgeAttached) return;
  shoppingBridgeAttached = true;

  setShoppingAnalyticsProvider((name, payload) => {
    if (name !== 'shopping_product_click') return;

    const context = getShoppingAnalyticsContext();
    const merchant =
      typeof payload.merchant === 'string' && payload.merchant.trim()
        ? payload.merchant.trim()
        : 'unknown';

    trackShoppingProductClick({
      recipe_id: context?.recipeId ?? 'unknown',
      mode: context?.mode ?? 'all',
      merchant,
      is_affiliate: payload.isAffiliate === true,
    });
  });
}

export function initAnalytics(): void {
  try {
    attachShoppingAnalyticsBridge();
    if (isDev()) {
      console.log(
        isFirebaseAnalyticsNativeAvailable()
          ? '[analytics] native firebase ready'
          : '[analytics] no-op until google-services config + EAS native build',
      );
    }
  } catch {
    // ignore
  }
}

export function resetAnalyticsForTests(): void {
  testListener = null;
  shoppingBridgeAttached = false;
  lastViewSentAt.clear();
  setShoppingAnalyticsProvider(null);
}
