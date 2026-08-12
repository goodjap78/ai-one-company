import type { MenuItem } from '../../../types/recommendation';
import type { FoodMemoryCategory, FoodMemoryCuisine } from '../../../types/foodMemory';
import { getMenuById } from '../../recipe/mockRecipeDetails';
import { resolveRecipeTitle } from '../recipeTitleResolver';
import { classifyMealArchetypes, getPrimaryArchetype, menuCuisineFromId } from '../../recommendation/mealIntelligence/mealProfile';

function cuisineFromId(mealId: string): FoodMemoryCuisine {
  const raw = menuCuisineFromId(mealId);
  if (raw === 'korean' || raw === 'japanese' || raw === 'chinese' || raw === 'western') {
    return raw;
  }
  return 'catalog';
}

function categoryFromMenu(menu: MenuItem | null, mealId: string): FoodMemoryCategory {
  if (!menu) {
    return inferCategoryFromId(mealId);
  }

  const primary = getPrimaryArchetype(menu);
  return archetypeToCategory(primary);
}

function archetypeToCategory(archetype: ReturnType<typeof getPrimaryArchetype>): FoodMemoryCategory {
  switch (archetype) {
    case 'noodle':
    case 'pasta':
      return 'noodle';
    case 'soup':
      return 'soup';
    case 'stew':
    case 'hotpot':
      return 'stew';
    case 'grill':
    case 'bbq':
      return 'meat';
    case 'rice':
      return 'rice';
    case 'salad':
    case 'cold_meal':
      return 'salad';
    case 'delivery':
      return 'delivery';
    default:
      return 'other';
  }
}

function inferCategoryFromId(mealId: string): FoodMemoryCategory {
  if (mealId.includes('jjapaghetti') || mealId.includes('jajang') || mealId.includes('jjamppong')) {
    return 'noodle';
  }
  if (mealId.includes('jjigae') || mealId.includes('tang')) return 'stew';
  if (mealId.includes('samgyeopsal') || mealId.includes('bulgogi')) return 'meat';
  if (mealId.includes('bibimbap') || mealId.includes('bokkeumbap')) return 'rice';
  if (mealId.startsWith('gold_c_') || mealId.startsWith('core_c_')) return 'delivery';
  return 'other';
}

/** Resolve denormalized Food Memory fields from a catalog meal id. */
export function resolveMealFoodMeta(mealId: string): {
  mealId: string;
  mealName: string;
  category: FoodMemoryCategory;
  cuisine: FoodMemoryCuisine;
} {
  const menu = getMenuById(mealId);
  const mealName = menu?.title ?? resolveRecipeTitle(mealId);
  const category = menu ? categoryFromMenu(menu, mealId) : inferCategoryFromId(mealId);
  const cuisine = cuisineFromId(mealId);

  return { mealId, mealName, category, cuisine };
}

/** Map a live menu candidate to its Food Memory category. */
export function menuToFoodMemoryCategory(menu: MenuItem): FoodMemoryCategory {
  const archetypes = classifyMealArchetypes(menu);
  const primary = getPrimaryArchetype(menu);
  if (archetypes.includes('noodle')) return 'noodle';
  if (archetypes.includes('soup') && !archetypes.includes('stew')) return 'soup';
  return archetypeToCategory(primary);
}
