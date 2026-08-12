import type { MealPlanningEntry, MealPlanningStore } from '../../types/mealPlanning';
import type { GroceryIngredientLine, GrocerySourceSummary } from '../../types/grocery';
import { fetchRecipe } from '../recipe/recipeService';

export function selectGrocerySourceMeals(store: MealPlanningStore): {
  saved: MealPlanningEntry[];
  completed: MealPlanningEntry[];
} {
  const saved = store.entries.filter((entry) => entry.status === 'saved');
  const completed = store.entries.filter((entry) => entry.status === 'completed');
  return { saved, completed };
}

export function buildGrocerySourceSummary(
  saved: MealPlanningEntry[],
  completed: MealPlanningEntry[],
): GrocerySourceSummary {
  return {
    savedMealIds: saved.map((entry) => entry.recipeId),
    completedMealIds: completed.map((entry) => entry.recipeId),
  };
}

/** Saved meals drive the list; completed meals are tracked for future deduction logic. */
export async function resolveGroceryIngredientLines(
  savedMeals: MealPlanningEntry[],
): Promise<GroceryIngredientLine[]> {
  const lines: GroceryIngredientLine[] = [];
  const seenRecipes = new Set<string>();

  for (const meal of savedMeals) {
    if (meal.mealMode === 'delivery') continue;
    if (seenRecipes.has(meal.recipeId)) continue;
    seenRecipes.add(meal.recipeId);

    const recipe = await fetchRecipe(meal.recipeId);
    if (!recipe || recipe.mode === 'delivery') continue;

    for (const ingredient of recipe.ingredients) {
      lines.push({
        name: ingredient.name,
        amount: ingredient.amount,
        optional: ingredient.optional,
        recipeId: meal.recipeId,
      });
    }
  }

  return lines;
}
