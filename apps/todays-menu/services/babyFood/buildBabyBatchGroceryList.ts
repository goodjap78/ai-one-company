/**
 * Multi-recipe baby batch grocery aggregation.
 * Scales per-recipe portions independently, then merges via IIE normalization.
 */
import {
  BABY_PORTION_UI_PRESETS,
  classifyBabyPortionScaling,
  scaleBabyIngredientAmount,
  type BabyPortionPreset,
} from '../../data/recipes/babyPortionScaling';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { isBabyWeeklyPlanEligible } from '../../data/recipes/babyWeeklyPlan';
import type { BabyFoodFeedStage } from '../../data/recipes/babyFoodFeed';
import type { GroceryCategory, GroceryIngredientLine, GroceryListItem } from '../../types/grocery';
import { mergeGroceryIngredients } from '../grocery/mergeGroceryIngredients';
import { formatBabyBatchDisplayLine } from './formatBabyBatchAmount';
import { buildBabyBatchGroceryRowKey, computeBabyBatchAggregationFingerprint } from './babyGroceryChecklist';

export type BabyBatchRecipeSelection = {
  recipeId: string;
  portion: BabyPortionPreset;
};

export type BabyBatchSelectedMenu = {
  recipeId: string;
  name: string;
  dayLabel: string;
  portion: BabyPortionPreset;
};

export type BabyBatchDisplayCategory =
  | 'grains'
  | 'protein'
  | 'produce'
  | 'other';

export type BabyBatchDisplayGroup = {
  category: BabyBatchDisplayCategory;
  label: string;
  items: BabyBatchGroceryItem[];
};

export type BabyBatchGroceryItem = {
  id: string;
  rowKey: string;
  displayCategory: BabyBatchDisplayCategory;
  name: string;
  displayLine: string;
  quantity: number;
  unit: string;
  optional: boolean;
  sourceRecipeIds: string[];
  /** Same canonical ingredient appears with another unit — no conversion applied. */
  separateUnitNote?: string;
};

export type BabyBatchGroceryResult = {
  selectedMenus: BabyBatchSelectedMenu[];
  groups: BabyBatchDisplayGroup[];
  items: BabyBatchGroceryItem[];
  fingerprint: string;
};

const BABY_BATCH_CATEGORY_ORDER: BabyBatchDisplayCategory[] = [
  'grains',
  'protein',
  'produce',
  'other',
];

const BABY_BATCH_CATEGORY_LABELS: Record<BabyBatchDisplayCategory, string> = {
  grains: '곡류',
  protein: '육류·생선',
  produce: '채소·과일',
  other: '기타',
};

function mapGroceryCategory(category: GroceryCategory): BabyBatchDisplayCategory {
  if (category === 'grains') return 'grains';
  if (category === 'meat' || category === 'seafood') return 'protein';
  if (category === 'vegetables') return 'produce';
  return 'other';
}

function resolveEffectivePortion(
  recipeId: string,
  portion: BabyPortionPreset,
): BabyPortionPreset {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return 1;
  const scaling = classifyBabyPortionScaling(recipe);
  if (scaling !== 'scalable') return 1;
  return BABY_PORTION_UI_PRESETS.includes(portion) ? portion : 1;
}

function buildIngredientLines(selections: BabyBatchRecipeSelection[]): GroceryIngredientLine[] {
  const lines: GroceryIngredientLine[] = [];

  for (const selection of selections) {
    const recipe = getHankkiRecipeById(selection.recipeId);
    if (!recipe) continue;

    const scaling = classifyBabyPortionScaling(recipe);
    const portion = resolveEffectivePortion(selection.recipeId, selection.portion);

    for (const ing of recipe.ingredients) {
      lines.push({
        name: ing.name,
        amount: scaleBabyIngredientAmount(ing.amount, portion, scaling),
        optional: ing.optional,
        recipeId: recipe.id,
      });
    }
  }

  return lines;
}

function attachSeparateUnitNotes(items: BabyBatchGroceryItem[]): BabyBatchGroceryItem[] {
  const unitsByName = new Map<string, Set<string>>();

  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    const units = unitsByName.get(key) ?? new Set<string>();
    units.add(item.unit);
    unitsByName.set(key, units);
  }

  return items.map((item) => {
    const key = item.name.trim().toLowerCase();
    const units = unitsByName.get(key);
    if (!units || units.size <= 1) return item;
    return {
      ...item,
      separateUnitNote: '단위가 달라 따로 표시해요.',
    };
  });
}

function toBatchItem(item: GroceryListItem): BabyBatchGroceryItem {
  const displayCategory = mapGroceryCategory(item.category);
  const rowKey = buildBabyBatchGroceryRowKey(item.normalizedName, item.unit, displayCategory);
  return {
    id: rowKey,
    rowKey,
    displayCategory,
    name: item.name,
    displayLine: formatBabyBatchDisplayLine(item.name, item.quantity, item.unit),
    quantity: item.quantity,
    unit: item.unit,
    optional: item.optional,
    sourceRecipeIds: item.sourceRecipeIds,
  };
}

function groupBabyBatchItems(items: BabyBatchGroceryItem[]): BabyBatchDisplayGroup[] {
  const grouped = new Map<BabyBatchDisplayCategory, BabyBatchGroceryItem[]>();
  for (const category of BABY_BATCH_CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const item of items) {
    const list = grouped.get(item.displayCategory) ?? [];
    list.push(item);
    grouped.set(item.displayCategory, list);
  }

  return BABY_BATCH_CATEGORY_ORDER.map((category) => ({
    category,
    label: BABY_BATCH_CATEGORY_LABELS[category],
    items: grouped.get(category) ?? [],
  })).filter((group) => group.items.length > 0);
}

export function buildBabyBatchGroceryList(
  selections: BabyBatchRecipeSelection[],
  menus: BabyBatchSelectedMenu[],
  stage: BabyFoodFeedStage,
): BabyBatchGroceryResult {
  const lines = buildIngredientLines(selections);
  const merged = mergeGroceryIngredients(lines).map(toBatchItem);
  const items = attachSeparateUnitNotes(merged);
  const fingerprint = computeBabyBatchAggregationFingerprint(stage, selections, items);

  return {
    selectedMenus: menus,
    items,
    groups: groupBabyBatchItems(items),
    fingerprint,
  };
}

export function validateBabyBatchSelections(
  selections: BabyBatchRecipeSelection[],
  stage: BabyFoodFeedStage,
): boolean {
  if (selections.length === 0) return false;
  return selections.every((selection) => {
    const recipe = getHankkiRecipeById(selection.recipeId);
    return Boolean(recipe && isBabyWeeklyPlanEligible(recipe, stage));
  });
}
