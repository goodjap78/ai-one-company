import type { Href } from 'expo-router';

/** Canonical home — tab shell (`app/(tabs)`). Not `app/index` (splash/onboarding bootstrap). */
export const APP_HOME_HREF = '/(tabs)' as Href;

export const CONVENIENCE_RECOMMENDATION_HREF = '/convenience-combos' as const;

export const CONVENIENCE_ALL_HREF = '/convenience-combos/all' as const;

export function convenienceComboDetailHref(comboId: string): Href {
  return {
    pathname: '/convenience-combos/[id]',
    params: { id: comboId },
  };
}
