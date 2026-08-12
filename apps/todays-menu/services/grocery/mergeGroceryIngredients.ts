import type {
  GroceryCategory,
  GroceryCategoryGroup,
  GroceryIngredientLine,
  GroceryListItem,
} from '../../types/grocery';
import { GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from '../../types/grocery';
import { normalizeIngredientLine } from './normalizeIngredient';
import {
  formatGroceryDisplayLine,
  parseIngredientAmount,
} from './parseIngredientAmount';

type MergeBucket = {
  displayName: string;
  normalizedName: string;
  category: GroceryCategory;
  quantity: number;
  unit: string;
  optional: boolean;
  sourceRecipeIds: Set<string>;
};

function bucketKey(normalizedName: string, unit: string): string {
  return `${normalizedName}::${unit}`;
}

/** Normalize → merge duplicates → attach category. */
export function mergeGroceryIngredients(lines: GroceryIngredientLine[]): GroceryListItem[] {
  const buckets = new Map<string, MergeBucket>();

  for (const line of lines) {
    const { normalizedName, displayName, category } = normalizeIngredientLine(line);
    const parsed = parseIngredientAmount(line.amount);
    const key = bucketKey(normalizedName, parsed.unit);
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        displayName,
        normalizedName,
        category,
        quantity: parsed.quantity,
        unit: parsed.unit,
        optional: Boolean(line.optional),
        sourceRecipeIds: new Set([line.recipeId]),
      });
      continue;
    }

    existing.quantity += parsed.quantity;
    existing.optional = existing.optional && Boolean(line.optional);
    existing.sourceRecipeIds.add(line.recipeId);
  }

  return [...buckets.values()]
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'))
    .map((bucket, index) => ({
      id: `grocery_${index}_${bucket.normalizedName}`,
      name: bucket.displayName,
      normalizedName: bucket.normalizedName,
      category: bucket.category,
      displayLine: formatGroceryDisplayLine(bucket.displayName, bucket.quantity, bucket.unit),
      quantity: bucket.quantity,
      unit: bucket.unit,
      optional: bucket.optional,
      sourceRecipeIds: [...bucket.sourceRecipeIds],
    }));
}

export function groupGroceryByCategory(items: GroceryListItem[]): GroceryCategoryGroup[] {
  const grouped = new Map<GroceryCategory, GroceryListItem[]>();

  for (const category of GROCERY_CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return GROCERY_CATEGORY_ORDER.map((category) => ({
    category,
    label: GROCERY_CATEGORY_LABELS[category],
    items: grouped.get(category) ?? [],
  })).filter((group) => group.items.length > 0);
}
