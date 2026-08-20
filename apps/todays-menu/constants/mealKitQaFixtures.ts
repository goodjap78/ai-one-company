/**
 * Preview/dev QA list — derived from production mealKitValidatedEligibility.
 * Do not duplicate recipe rows here. Eligibility is the only source of truth.
 */
import {
  MEAL_KIT_VALIDATED_COUNT,
  MEAL_KIT_VALIDATED_ELIGIBILITY,
  type MealKitValidatedEligibilityEntry,
} from '../data/shopping/mealKitValidatedEligibility';

export type MealKitQaListItem = MealKitValidatedEligibilityEntry & {
  readonly section: 'existing' | 'expansion';
  readonly displayId: string;
};

function recipeIdSortValue(recipeId: string): number {
  const expanded = recipeId.match(/^recipe_(\d+)$/);
  if (expanded) return Number(expanded[1]);
  return Number(recipeId) || 0;
}

function isCatalogExpansion(recipeId: string): boolean {
  const expanded = recipeId.match(/^recipe_(\d+)$/);
  return Boolean(expanded && Number(expanded[1]) >= 301);
}

export function formatMealKitQaDisplayId(recipeId: string): string {
  return recipeId.replace(/^recipe_/, '');
}

/** Sorted copy of production validated eligibility for the QA screen. */
export function listMealKitQaRecipes(): MealKitQaListItem[] {
  return [...MEAL_KIT_VALIDATED_ELIGIBILITY]
    .sort((a, b) => recipeIdSortValue(a.recipeId) - recipeIdSortValue(b.recipeId))
    .map((entry) => ({
      ...entry,
      section: isCatalogExpansion(entry.recipeId) ? 'expansion' : 'existing',
      displayId: formatMealKitQaDisplayId(entry.recipeId),
    }));
}

export const MEAL_KIT_QA_MENU_COUNT = MEAL_KIT_VALIDATED_COUNT;
