import type { GroceryListSnapshot, GroceryListStore } from '../../types/grocery';
import { readMealPlanningStore } from '../memory/mealPlanning/mealPlanningStorage';
import { getPantry } from '../pantry';
import { subtractPantryFromGrocery } from '../pantry/subtractPantryFromGrocery';
import { extractGroceryIngredients } from './extractGroceryIngredients';
import { groupGroceryByCategory, mergeGroceryIngredients } from './mergeGroceryIngredients';
import {
  buildGrocerySourceSummary,
  selectGrocerySourceMeals,
} from './resolveGrocerySources';

export async function buildGroceryListSnapshot(now = new Date()): Promise<GroceryListSnapshot> {
  const planningStore = await readMealPlanningStore(now);
  const { saved, completed } = selectGrocerySourceMeals(planningStore);
  const sources = buildGrocerySourceSummary(saved, completed);

  const lines = await extractGroceryIngredients(saved);
  const merged = mergeGroceryIngredients(lines);
  const pantry = await getPantry();
  const items = subtractPantryFromGrocery(merged, pantry);
  const groups = groupGroceryByCategory(items);

  return {
    version: 2,
    generatedAt: now.toISOString(),
    sources,
    groups,
    items,
    extensions: {
      pantry: {
        pantryItemCount: pantry.items.length,
        suppressedItemCount: merged.length - items.length,
      },
    },
  };
}

export function snapshotToStore(snapshot: GroceryListSnapshot): GroceryListStore {
  return {
    version: 2,
    generatedAt: snapshot.generatedAt,
    sources: snapshot.sources,
    groups: snapshot.groups,
    items: snapshot.items,
    extensions: snapshot.extensions,
  };
}
