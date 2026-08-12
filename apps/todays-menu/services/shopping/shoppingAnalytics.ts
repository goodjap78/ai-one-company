/**
 * Sprint 63-D — analytics hook surface (no-op until provider is wired).
 */

export type ShoppingAnalyticsEventName =
  | 'shopping_product_impression'
  | 'shopping_product_click'
  | 'shopping_ingredient_search';

export type ShoppingAnalyticsPayload = Record<string, string | number | boolean | undefined>;

let listener: ((name: ShoppingAnalyticsEventName, payload: ShoppingAnalyticsPayload) => void) | null =
  null;

/** Test-only — attach a listener without console logging in production. */
export function setShoppingAnalyticsListener(
  fn: ((name: ShoppingAnalyticsEventName, payload: ShoppingAnalyticsPayload) => void) | null,
): void {
  listener = fn;
}

export function trackShoppingEvent(
  name: ShoppingAnalyticsEventName,
  payload: ShoppingAnalyticsPayload = {},
): void {
  if (listener) listener(name, payload);
}
