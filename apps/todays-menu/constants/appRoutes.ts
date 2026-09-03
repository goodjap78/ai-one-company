import type { Href } from 'expo-router';

/** Canonical home — tab shell (`app/(tabs)`). Not `app/index` (splash/onboarding bootstrap). */
export const APP_HOME_HREF = '/(tabs)' as Href;

export const ELEMENTARY_BREAKFAST_WEEK_HREF = '/elementary-breakfast-week' as const;
export const ELEMENTARY_DINNER_WEEK_HREF = '/elementary-dinner-week' as const;
export const ELEMENTARY_BROWSE_HREF = '/elementary-browse' as const;

export const TODDLER_MEALS_HREF = '/toddler-meals' as const;
export const TODDLER_MEALS_WEEKLY_HREF = '/toddler-meals-week' as const;
export const TODDLER_BREAKFAST_WEEK_HREF = '/toddler-breakfast-week' as const;
export const TODDLER_DINNER_WEEK_HREF = '/toddler-dinner-week' as const;

export const BABY_FOOD_HREF = '/baby-food' as const;
export const BABY_FOOD_WEEKLY_HREF = '/baby-food-week' as const;
export const BABY_FOOD_BATCH_HREF = '/baby-food-batch' as const;
export const BABY_FOOD_BATCH_RESULT_HREF = '/baby-food-batch-result' as const;

export const CONVENIENCE_RECOMMENDATION_HREF = '/convenience-combos' as const;

export const CONVENIENCE_ALL_HREF = '/convenience-combos/all' as const;

export function convenienceComboDetailHref(comboId: string): Href {
  return {
    pathname: '/convenience-combos/[id]',
    params: { id: comboId },
  };
}
