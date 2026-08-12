import type { RecipeIngredientGroup } from '../../types/recipe';
import type { ShoppingIngredientGroup, ShoppingIngredientItem } from '../../types/shopping';
import { parseIngredientAmount } from '../grocery/parseIngredientAmount';
import { formatGroceryDisplayLine } from '../grocery/parseIngredientAmount';

const GROUP_RANK: Record<ShoppingIngredientGroup, number> = {
  main: 0,
  sub: 1,
  seasoning: 2,
};

type MergeBucket = {
  recipeId: string;
  ingredientName: string;
  shoppingKeyword: string;
  amountTexts: string[];
  group: ShoppingIngredientGroup;
  matchKey: string;
  iconKey: string;
  isMissing?: boolean;
};

/**
 * Merge key: matchKey + shopping keyword — same fridge key but different
 * shopping intent (e.g. 설탕 vs 물엿) stay separate.
 */
export function buildShoppingMergeKey(matchKey: string, shoppingKeyword: string): string {
  return `${matchKey}::${shoppingKeyword}`;
}

function pickPrimaryGroup(groups: ShoppingIngredientGroup[]): ShoppingIngredientGroup {
  return groups.sort((a, b) => GROUP_RANK[a] - GROUP_RANK[b])[0] ?? 'sub';
}

function mergeAmountTexts(amountTexts: string[], displayName: string): string {
  if (amountTexts.length === 1) return amountTexts[0];

  const parsed = amountTexts.map((text) => parseIngredientAmount(text));
  const unit = parsed[0]!.unit;
  const sameUnit = parsed.every((entry) => entry.unit === unit);

  if (sameUnit && unit !== '적당량') {
    const total = parsed.reduce((sum, entry) => sum + entry.quantity, 0);
    return formatGroceryDisplayLine(displayName, total, unit);
  }

  return amountTexts.join(' + ');
}

/** Merge duplicate shopping lines within one recipe. */
export function mergeShoppingItems(items: ShoppingIngredientItem[]): ShoppingIngredientItem[] {
  const buckets = new Map<string, MergeBucket>();

  for (const item of items) {
    const key = buildShoppingMergeKey(item.matchKey, item.shoppingKeyword);
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        recipeId: item.recipeId,
        ingredientName: item.ingredientName,
        shoppingKeyword: item.shoppingKeyword,
        amountTexts: [item.amountText],
        group: item.group,
        matchKey: item.matchKey,
        iconKey: item.iconKey,
        isMissing: item.isMissing,
      });
      continue;
    }

    existing.amountTexts.push(item.amountText);
    existing.group = pickPrimaryGroup([existing.group, item.group]);
    existing.isMissing = existing.isMissing || item.isMissing;
  }

  return [...buckets.values()]
    .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, 'ko'))
    .map((bucket) => ({
      recipeId: bucket.recipeId,
      ingredientName: bucket.ingredientName,
      shoppingKeyword: bucket.shoppingKeyword,
      amountText: mergeAmountTexts(bucket.amountTexts, bucket.ingredientName),
      group: bucket.group,
      matchKey: bucket.matchKey,
      iconKey: bucket.iconKey,
      isMissing: bucket.isMissing,
    }));
}

export function mapRecipeGroup(group: RecipeIngredientGroup): ShoppingIngredientGroup {
  return group;
}
