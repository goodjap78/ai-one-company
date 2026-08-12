import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { HMIERankingResult, MealSituationSnapshot, ScoredMenuItem } from '../../../types/mealIntelligenceEngine';
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';
import { scoreMenuCandidates } from '../mealIntelligence/selectMeal';
import { pickDiverseMealTimeSet } from './mealTimeSetPicker';

export type MealTimeSlotRankingOptions = {
  targetSlot: MealTimeSlotKey;
  useClockWeights?: boolean;
  limit?: number;
  refreshGeneration?: number;
  /** Current-slot refresh penalty ids (hero + alts). */
  repeatPenaltyIds?: string[];
  /** Sprint 61-B — cross-slot session heroes to diversify away from. */
  sessionShownIds?: string[];
  excludeMenuId?: string;
};

function buildSessionExcludeIds(options: MealTimeSlotRankingOptions): string[] {
  const repeatPenaltyIds = options.repeatPenaltyIds ?? [];
  const sessionShownIds = options.sessionShownIds ?? [];
  return sessionShownIds.filter(
    (id) => id !== options.excludeMenuId && !repeatPenaltyIds.includes(id),
  );
}

/**
 * Score + diverse pick for meal-time slot recommendations (1 primary + 3 alts).
 */
export function rankMealTimeSlotSet(
  menus: MenuItem[],
  situation: MealSituationSnapshot,
  baseContext?: RecommendationContext,
  options: MealTimeSlotRankingOptions,
): HMIERankingResult {
  const limit = options.limit ?? 4;
  const repeatPenaltyIds = options.repeatPenaltyIds ?? [];
  const sessionShownIds = options.sessionShownIds ?? [];
  const context: RecommendationContext = {
    recentMeals: baseContext?.recentMeals ?? [],
    favorites: baseContext?.favorites ?? [],
    favoriteRecipeIds: baseContext?.favoriteRecipeIds ?? [],
    preferenceDNA: baseContext?.preferenceDNA ?? {
      favoriteCategories: [],
      favoriteMealTypes: [],
      favoriteTags: [],
      favoriteEmotionTags: [],
      favoriteCookingTimes: [],
      favoriteDifficulty: [],
      favoriteSeasons: [],
      totalFavorites: 0,
    },
    conversationMemory: baseContext?.conversationMemory ?? {
      mood: null,
      weather: null,
      lastGreeting: null,
      lastRecommendation: null,
      conversationCount: 0,
      updatedAt: '',
    },
    ...baseContext,
    mealTimeRanking: {
      targetSlot: options.targetSlot,
      useClockWeights: options.useClockWeights ?? false,
      repeatPenaltyIds,
      sessionShownIds,
      refreshGeneration: options.refreshGeneration ?? 0,
    },
  };

  const scored = scoreMenuCandidates(menus, situation, context);
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));

  let ranked = scored.filter((entry) => menuById.has(entry.menuId));
  if (options.excludeMenuId) {
    ranked = ranked.filter((entry) => entry.menuId !== options.excludeMenuId);
  }

  if (ranked.length === 0) {
    return {
      primary: null,
      alternatives: [],
      all: [],
      totalCandidates: 0,
      noCandidates: true,
    };
  }

  const sessionExcludeIds = buildSessionExcludeIds(options);
  const excludeIds = [
    ...(options.excludeMenuId ? [options.excludeMenuId] : []),
    ...sessionExcludeIds,
  ];

  let diverse = pickDiverseMealTimeSet(ranked, menus, {
    limit,
    excludeIds,
    seedOffset: options.refreshGeneration ?? 0,
  });

  if (diverse.length === 0 && sessionExcludeIds.length > 0) {
    diverse = pickDiverseMealTimeSet(ranked, menus, {
      limit,
      excludeIds: options.excludeMenuId ? [options.excludeMenuId] : [],
      seedOffset: options.refreshGeneration ?? 0,
    });
  }

  if (diverse.length === 0) {
    return {
      primary: null,
      alternatives: [],
      all: [],
      totalCandidates: ranked.length,
      noCandidates: true,
    };
  }

  const primary = diverse[0];
  const alternatives = diverse.slice(1);

  return {
    primary,
    alternatives,
    all: diverse,
    totalCandidates: ranked.length,
    noCandidates: false,
  };
}
