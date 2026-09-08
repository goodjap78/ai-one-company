import { isInternalQaEnabled } from './isInternalQaEnabled';

type MealImageLoadErrorInfo = {
  recipeId?: string;
  screen?: string;
  sourceKind: 'url' | 'source';
  url?: string | null;
  message?: string;
};

/** Preview/QA only. Never render this in production UI. */
export function logMealImageLoadError(info: MealImageLoadErrorInfo): void {
  if (!isInternalQaEnabled()) return;
  console.warn('[MealImage QA] onError', {
    recipeId: info.recipeId ?? '(unknown)',
    screen: info.screen ?? '(unknown)',
    sourceKind: info.sourceKind,
    url: info.url ?? null,
    message: info.message ?? '',
  });
}

export function mealImageErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error ?? '');
  const native = (error as { nativeEvent?: { error?: string } }).nativeEvent;
  if (native?.error) return String(native.error);
  if (error instanceof Error) return error.message;
  return String(error);
}
