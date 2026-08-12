import type { PreferenceSeason } from '../../../../types/preference';
import type { MenuItem } from '../../../../types/recommendation';
import type {
  MealDNA,
  MealDnaCategory,
  MealDnaCookingTime,
  MealDnaHealth,
} from '../../../../types/mealDna';
import { getRegisteredMealDna } from '../../../../library/meal-dna/registry';
import { resolveRecipeIngredientNames } from '../../../ingredient';
import { getRecipeById } from '../../../recipe/mockRecipeDetails';
import { classifyMealArchetypes } from '../mealProfile';

function cookTimeTier(minutes: number): MealDnaCookingTime {
  if (minutes <= 20) return 'quick';
  if (minutes <= 35) return 'moderate';
  return 'slow';
}

function inferHealth(menu: MenuItem): MealDnaHealth {
  if (menu.tags.includes('healthy') || menu.mealPurpose?.includes('diet')) return 'light';
  if (menu.tags.includes('quick') && menu.cookTime <= 15) return 'indulgent';
  if (menu.mealPurpose?.includes('comfort') && menu.cookTime >= 35) return 'hearty';
  if (menu.tags.includes('spicy') && menu.mode === 'delivery') return 'indulgent';
  return 'balanced';
}

function inferCategory(menu: MenuItem): MealDnaCategory {
  if (menu.mode === 'delivery') return 'delivery';
  const archetypes = classifyMealArchetypes(menu);
  if (archetypes.includes('stew')) return 'stew';
  if (archetypes.includes('soup')) return 'soup';
  if (archetypes.includes('grill') || archetypes.includes('bbq')) return 'grill';
  if (archetypes.includes('noodle')) return 'noodle';
  if (archetypes.includes('salad') || archetypes.includes('cold_meal')) return 'salad';
  if (archetypes.includes('simple') || menu.mealStyle === 'instant') return 'instant';
  if (archetypes.includes('rice')) return 'rice';

  const id = menu.id;
  if (id.includes('gold_c_') || id.includes('core_c_') || id.includes('jajang') || id.includes('jjamppong')) {
    return 'chinese';
  }
  if (id.includes('gold_j_') || id.includes('core_j_')) return 'japanese';
  if (id.includes('gold_w_') || id.includes('core_w_') || id.includes('core_h_')) return 'western';
  return 'korean';
}

function inferSeasons(menu: MenuItem): PreferenceSeason[] {
  const seasons: PreferenceSeason[] = ['spring', 'summer', 'autumn', 'winter'];
  if (menu.weatherTags?.includes('hot')) {
    return ['spring', 'summer'];
  }
  if (menu.weatherTags?.includes('cold') || menu.weatherTags?.includes('rain')) {
    return ['autumn', 'winter', 'spring'];
  }
  return seasons;
}

function attachCanonicalIngredients(menu: MenuItem, dna: MealDNA): MealDNA {
  if (dna.canonicalIngredients?.length) return dna;

  const recipe = getRecipeById(menu.id);
  if (!recipe?.ingredients.length) return dna;

  return {
    ...dna,
    canonicalIngredients: resolveRecipeIngredientNames(
      recipe.ingredients.map((item) => item.canonicalName ?? item.name),
    ),
  };
}

/** Derive Meal DNA from catalog fields when no registry entry exists. */
export function deriveMealDna(menu: MenuItem): MealDNA {
  return {
    weather: menu.weatherTags ?? [],
    season: inferSeasons(menu),
    time: menu.mealTime,
    situation: menu.situationTags ?? ['home'],
    cookingTime: cookTimeTier(menu.cookTime),
    health: inferHealth(menu),
    category: inferCategory(menu),
  };
}

/** Resolve DNA: registry first, then derive from menu attributes. */
export function resolveMealDna(menu: MenuItem): MealDNA {
  const base = getRegisteredMealDna(menu.id) ?? deriveMealDna(menu);
  return attachCanonicalIngredients(menu, base);
}
