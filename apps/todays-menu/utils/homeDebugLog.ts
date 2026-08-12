const DEBUG_PREFIX = '[HANKKI Home]';

export function logHomeRootMount(count: number): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  console.log(DEBUG_PREFIX, 'root mount count:', count);
}

export function logHomeRootUnmount(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  console.log(DEBUG_PREFIX, 'root unmount');
}

export function logHomeRecommendationChange(recipeId: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  console.log(DEBUG_PREFIX, 'recommendation changed, card content update only:', recipeId);
}
