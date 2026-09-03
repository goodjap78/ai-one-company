/**
 * Sprint 10 — promote existing non-egg toddler snack recipes into the breakfast pool.
 * Keeps recipeId / images; adds `breakfast` to standardMetadata.mealTypes via derive merge.
 * Does not invent nutrition. Snack eligibility is preserved.
 */
import type { RecipeStandardMetadataOverride } from './recipeStandardMetadataTypes';

/** Soft, quick, non-egg snacks that are also realistic toddler breakfasts. */
export const TODDLER_BREAKFAST_MEAL_TYPE_PROMOTIONS: Record<string, RecipeStandardMetadataOverride> =
  {
    /** 바나나요거트 — 오트/과일 · 요거트 */
    recipe_0332: { mealTypes: ['snack', 'breakfast'] },
    /** 찐고구마 — 감자/고구마 */
    recipe_0333: { mealTypes: ['snack', 'breakfast'] },
    /** 우유오트밀 — 오트 */
    recipe_0335: { mealTypes: ['snack', 'breakfast'] },
    /** 고구마요거트 — 감자/고구마 · 요거트 */
    recipe_0434: { mealTypes: ['snack', 'breakfast'] },
    /** 찐단호박 — 단호박 */
    recipe_0495: { mealTypes: ['snack', 'breakfast'] },
    /** 바나나오트밀볼 — 오트/과일 */
    recipe_0499: { mealTypes: ['snack', 'breakfast'] },
  };

export const TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS = Object.keys(
  TODDLER_BREAKFAST_MEAL_TYPE_PROMOTIONS,
) as (keyof typeof TODDLER_BREAKFAST_MEAL_TYPE_PROMOTIONS)[];
