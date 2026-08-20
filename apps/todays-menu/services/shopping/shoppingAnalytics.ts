/**
 * Sprint 63-D — shopping analytics hook.
 * Test listener stays local; production provider is the central analytics wrapper.
 */

export type ShoppingAnalyticsEventName =
  | 'shopping_product_impression'
  | 'shopping_product_click'
  | 'shopping_ingredient_search';

export type ShoppingAnalyticsPayload = Record<string, string | number | boolean | undefined>;

type ShoppingAnalyticsHandler = (
  name: ShoppingAnalyticsEventName,
  payload: ShoppingAnalyticsPayload,
) => void;

let listener: ShoppingAnalyticsHandler | null = null;
let provider: ShoppingAnalyticsHandler | null = null;

/** Test-only — attach a listener without console logging in production. */
export function setShoppingAnalyticsListener(fn: ShoppingAnalyticsHandler | null): void {
  listener = fn;
}

/** Production analytics wrapper — does not replace the test listener. */
export function setShoppingAnalyticsProvider(fn: ShoppingAnalyticsHandler | null): void {
  provider = fn;
}

export function trackShoppingEvent(
  name: ShoppingAnalyticsEventName,
  payload: ShoppingAnalyticsPayload = {},
): void {
  try {
    listener?.(name, payload);
  } catch {
    // ignore
  }
  try {
    provider?.(name, payload);
  } catch {
    // ignore
  }
}
