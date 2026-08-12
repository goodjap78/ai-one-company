import type { MealPlanningEntry } from '../../types/mealPlanning';
import type { GroceryIngredientLine } from '../../types/grocery';
import { resolveGroceryIngredientLines } from './resolveGrocerySources';

/** Step 1 — Ingredient Extraction from Meal Planning saved meals. */
export async function extractGroceryIngredients(
  savedMeals: MealPlanningEntry[],
): Promise<GroceryIngredientLine[]> {
  return resolveGroceryIngredientLines(savedMeals);
}
