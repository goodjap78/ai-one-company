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
