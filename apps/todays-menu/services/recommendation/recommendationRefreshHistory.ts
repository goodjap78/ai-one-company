import {
  getRecentRecommendationIds,
  noteRecentRecommendation,
  resetRecentRecommendationsForTests,
  RECENT_RECOMMENDATIONS_MAX,
} from './recentRecommendationsStorage';

/**
 * Sprint H3-11 — recent shown menus for refresh exclusion.
 * Backed by AsyncStorage (`@todays_menu/recent_recommendations`).
 */

/** Sync snapshot after async load/note — used inside sync ranking path. */
let recentShownMenuIds: string[] = [];

export function hydrateRecentShownMenus(ids: string[]): void {
  recentShownMenuIds = ids.slice(0, RECENT_RECOMMENDATIONS_MAX);
}

export function noteRecommendedMenu(menuId: string): void {
  recentShownMenuIds = [menuId, ...recentShownMenuIds.filter((id) => id !== menuId)].slice(
    0,
    RECENT_RECOMMENDATIONS_MAX,
  );
  void noteRecentRecommendation(menuId);
}

export function getRecentShownMenuIds(): string[] {
  return [...recentShownMenuIds];
}

export async function loadRecentShownMenus(): Promise<string[]> {
  const ids = await getRecentRecommendationIds();
  hydrateRecentShownMenus(ids);
  return getRecentShownMenuIds();
}

/** @internal Test helper */
export function resetRecentShownMenusForTests(): void {
  recentShownMenuIds = [];
  void resetRecentRecommendationsForTests();
}
