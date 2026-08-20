import type { AnalyticsRecipeSource, AnalyticsShoppingMode } from './analyticsEvents';

let recipeOpenSource: AnalyticsRecipeSource = 'other';

let shoppingContext: { recipeId: string; mode: AnalyticsShoppingMode } | null = null;

export function setRecipeOpenSource(source: AnalyticsRecipeSource): void {
  recipeOpenSource = source;
}

export function consumeRecipeOpenSource(): AnalyticsRecipeSource {
  const source = recipeOpenSource;
  recipeOpenSource = 'other';
  return source;
}

export function setShoppingAnalyticsContext(
  recipeId: string,
  mode: AnalyticsShoppingMode,
): void {
  const id = recipeId.trim();
  shoppingContext = id ? { recipeId: id, mode } : null;
}

export function getShoppingAnalyticsContext(): {
  recipeId: string;
  mode: AnalyticsShoppingMode;
} | null {
  return shoppingContext;
}

export function resetAnalyticsContextForTests(): void {
  recipeOpenSource = 'other';
  shoppingContext = null;
}
