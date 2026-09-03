/**
 * Baby batch grocery checklist — row identity + aggregation fingerprint.
 * Does not alter ingredient aggregation math.
 */
import type { BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import type {
  BabyBatchDisplayCategory,
  BabyBatchGroceryItem,
  BabyBatchGroceryResult,
  BabyBatchRecipeSelection,
} from './buildBabyBatchGroceryList';

export function buildBabyBatchGroceryRowKey(
  normalizedName: string,
  unit: string,
  displayCategory: BabyBatchDisplayCategory,
): string {
  return `${normalizedName}::${unit}::${displayCategory}`;
}

export function computeBabyBatchAggregationFingerprint(
  stage: BabyFoodFeedStage,
  selections: readonly BabyBatchRecipeSelection[],
  items: readonly BabyBatchGroceryItem[],
): string {
  const selectionKey = [...selections]
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId))
    .map((selection) => `${selection.recipeId}:${selection.portion}`)
    .join('|');
  const rowKeys = items
    .map((item) => item.rowKey)
    .sort()
    .join('|');
  return `baby-batch:${stage}:${selectionKey}#${rowKeys}`;
}

export function reconcileCheckedRowIds(
  checkedRowIds: readonly string[],
  validRowKeys: readonly string[],
  fingerprint: string,
  storedFingerprint: string | null,
): Set<string> {
  if (storedFingerprint !== fingerprint) return new Set();
  const valid = new Set(validRowKeys);
  return new Set(checkedRowIds.filter((rowId) => valid.has(rowId)));
}

export function buildBabyGroceryShareText(result: BabyBatchGroceryResult): string {
  const lines = result.items.map((item) => item.displayLine);
  if (lines.length === 0) {
    return '이번 주 이유식 준비 재료\n\n한끼에서 준비했어요.';
  }
  return `이번 주 이유식 준비 재료\n\n${lines.join('\n')}\n\n한끼에서 준비했어요.`;
}
