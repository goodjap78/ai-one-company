/**
 * Sprint v1.1 #3 — promote existing elementary lunch browse recipes into the dinner weekly pool.
 * Does not add catalog IDs; adds `dinner` to standardMetadata.mealTypes via derive merge.
 */
import type { RecipeStandardMetadataOverride } from './recipeStandardMetadataTypes';

/** Lunch-first elementary recipes that are also realistic family dinners. */
export const ELEMENTARY_DINNER_MEAL_TYPE_PROMOTIONS: Record<string, RecipeStandardMetadataOverride> =
  {
    /** 떡갈비주먹밥 */
    recipe_0436: { mealTypes: ['breakfast', 'lunch', 'dinner'] },
    /** 닭고기김가루주먹밥 */
    recipe_0437: { mealTypes: ['breakfast', 'lunch', 'dinner'] },
    /** 치즈참치주먹밥 */
    recipe_0438: { mealTypes: ['breakfast', 'lunch', 'dinner'] },
    /** 닭고기또띠아랩 */
    recipe_0444: { mealTypes: ['lunch', 'dinner'] },
    /** 애호박계란국밥 */
    recipe_0405: { mealTypes: ['lunch', 'dinner'] },
    /** 야채볶음우동 */
    recipe_0406: { mealTypes: ['lunch', 'dinner'] },
    /** 햄계란김밥 */
    recipe_0475: { mealTypes: ['lunch', 'dinner'] },
    /** 불고기또띠아랩 */
    recipe_0476: { mealTypes: ['lunch', 'dinner'] },
    /** 참치치즈덮밥 */
    recipe_0482: { mealTypes: ['lunch', 'dinner'] },
    /** 고구마치즈구이 + 밥 */
    recipe_0447: { mealTypes: ['lunch', 'dinner'] },
  };

export const ELEMENTARY_DINNER_PROMOTED_RECIPE_IDS = Object.keys(
  ELEMENTARY_DINNER_MEAL_TYPE_PROMOTIONS,
) as (keyof typeof ELEMENTARY_DINNER_MEAL_TYPE_PROMOTIONS)[];
