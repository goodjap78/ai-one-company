import { getHankkiRecipeById } from '../../../data/recipes/hankkiRecipes';
import { getRecipeMealTimeMetadata } from '../../../data/recommendation/recipeMealTimeMetadata';
import type { MenuItem } from '../../../types/recommendation';
import type { ScoredMenuItem } from '../../../types/mealIntelligenceEngine';

const MAX_SAME_FOOD_TYPE = 2;
const DEFAULT_LIMIT = 4;

type DiversityCounts = {
  foodType: Map<string, number>;
  dishType: Map<string, number>;
  ingredient: Map<string, number>;
};

function primaryIngredientKey(recipeId: string): string | null {
  const recipe = getHankkiRecipeById(recipeId);
  const ingredient = recipe?.ingredients.find((item) => !item.optional) ?? recipe?.ingredients[0];
  if (!ingredient) return null;
  return (ingredient.canonicalName ?? ingredient.name).trim().toLowerCase();
}

function dishTypeKey(recipeId: string): string | null {
  const recipe = getHankkiRecipeById(recipeId);
  return recipe?.standardMetadata?.dishType ?? null;
}

function foodTypeKeys(recipeId: string): string[] {
  const meta = getRecipeMealTimeMetadata(recipeId);
  if (meta?.foodTypes?.length) return meta.foodTypes;
  return ['unknown'];
}

function canAddToSet(recipeId: string, counts: DiversityCounts): boolean {
  const foodTypes = foodTypeKeys(recipeId);
  for (const ft of foodTypes) {
    if ((counts.foodType.get(ft) ?? 0) >= MAX_SAME_FOOD_TYPE) return false;
  }

  const dish = dishTypeKey(recipeId);
  if (dish && (counts.dishType.get(dish) ?? 0) >= MAX_SAME_FOOD_TYPE) return false;

  const ingredient = primaryIngredientKey(recipeId);
  if (ingredient && (counts.ingredient.get(ingredient) ?? 0) >= MAX_SAME_FOOD_TYPE) return false;

  return true;
}

function recordInSet(recipeId: string, counts: DiversityCounts): void {
  for (const ft of foodTypeKeys(recipeId)) {
    counts.foodType.set(ft, (counts.foodType.get(ft) ?? 0) + 1);
  }
  const dish = dishTypeKey(recipeId);
  if (dish) counts.dishType.set(dish, (counts.dishType.get(dish) ?? 0) + 1);
  const ingredient = primaryIngredientKey(recipeId);
  if (ingredient) counts.ingredient.set(ingredient, (counts.ingredient.get(ingredient) ?? 0) + 1);
}

/**
 * Greedy diverse pick from pre-sorted scored candidates.
 * Max 2 per foodType / dishType / primary ingredient within one set.
 */
export function pickDiverseMealTimeSet(
  scored: ScoredMenuItem[],
  menus: MenuItem[],
  options: {
    limit?: number;
    excludeIds?: string[];
    seedOffset?: number;
  } = {},
): ScoredMenuItem[] {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const exclude = new Set(options.excludeIds ?? []);
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const counts: DiversityCounts = {
    foodType: new Map(),
    dishType: new Map(),
    ingredient: new Map(),
  };

  const eligible = scored.filter(
    (entry) => menuById.has(entry.menuId) && !exclude.has(entry.menuId),
  );

  const picked: ScoredMenuItem[] = [];
  const pickedIds = new Set<string>();

  for (const entry of eligible) {
    if (picked.length >= limit) break;
    if (!canAddToSet(entry.menuId, counts)) continue;
    picked.push(entry);
    pickedIds.add(entry.menuId);
    recordInSet(entry.menuId, counts);
  }

  if (picked.length < limit) {
    for (const entry of eligible) {
      if (picked.length >= limit) break;
      if (pickedIds.has(entry.menuId)) continue;
      picked.push(entry);
      pickedIds.add(entry.menuId);
    }
  }

  const seedOffset = options.seedOffset ?? 0;
  if (seedOffset > 0 && picked.length > 1) {
    const rotateBy = seedOffset % picked.length;
    return [...picked.slice(rotateBy), ...picked.slice(0, rotateBy)];
  }

  return picked;
}
