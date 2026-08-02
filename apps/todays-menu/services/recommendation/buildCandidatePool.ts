import type { MealMode, MealType } from '../../types/home';
import type { MenuItem } from '../../types/recommendation';
import type { RecommendationContext } from '../../types/preference';
import {
  MIN_CANDIDATE_POOL_SIZE,
  menuMatchesMealType,
} from '../../data/recipes/constants';
import {
  hasExplicitCookTimePreference,
  menuPassesCookTimeHardFilter,
} from './cookTimePreference';
import { menuPassesAiRecommendationExclusions } from './mealIntelligence/aiRecommendationExclusions';
import { isSideDishRecipeId } from '../../data/recipes/sideDishRecipeIds';

const DEBUG_PREFIX = '[HANKKI candidates]';

export type CandidatePoolDebug = {
  totalRecipes: number;
  afterMealTypeFilter: number;
  afterModeFilter: number;
  afterCookTimeFilter: number;
  afterAiExclusionFilter: number;
  afterExclusions: number;
  finalCount: number;
  finalNames: string[];
  mealType: MealType;
  mealMode: MealMode;
  usedMealTypeFallback: boolean;
  usedCookTimeFilter: boolean;
  usedAiExclusionFilter: boolean;
  aiExcludedIds: string[];
};

export function logCandidatePoolDebug(debug: CandidatePoolDebug): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;

  console.log(DEBUG_PREFIX, {
    totalRecipes: debug.totalRecipes,
    afterMealTypeFilter: debug.afterMealTypeFilter,
    afterModeFilter: debug.afterModeFilter,
    afterCookTimeFilter: debug.afterCookTimeFilter,
    afterAiExclusionFilter: debug.afterAiExclusionFilter,
    afterExclusions: debug.afterExclusions,
    finalCount: debug.finalCount,
    mealType: debug.mealType,
    mealMode: debug.mealMode,
    usedMealTypeFallback: debug.usedMealTypeFallback,
    usedCookTimeFilter: debug.usedCookTimeFilter,
    usedAiExclusionFilter: debug.usedAiExclusionFilter,
    finalNames: debug.finalNames,
  });
}

function filterByMode(menus: MenuItem[], mealMode: MealMode): MenuItem[] {
  return menus.filter((menu) => menu.mode === mealMode);
}

function filterHomeMealCandidates(menus: MenuItem[]): MenuItem[] {
  return menus.filter((menu) => !isSideDishRecipeId(menu.id));
}

export type CandidatePoolRelaxation =
  | 'none'
  | 'preferences'
  | 'cook_time'
  | 'recent_exclusions'
  | 'exhausted';

export type CandidatePoolBuildOptions = {
  /** Skip hard cook-time filter (preference only). */
  skipCookTimeFilter?: boolean;
  /** Skip meal-type narrowing (keep mode filter). */
  skipMealTypeFilter?: boolean;
  /** Skip refresh/recent menu exclusions. */
  skipRecentExclusions?: boolean;
};

function filterByMealType(
  menus: MenuItem[],
  mealType: MealType,
  options: CandidatePoolBuildOptions = {},
): { pool: MenuItem[]; usedFallback: boolean } {
  if (options.skipMealTypeFilter) {
    return { pool: menus, usedFallback: true };
  }

  const matched = menus.filter((menu) => menuMatchesMealType(menu.mealTime, mealType));

  if (matched.length >= MIN_CANDIDATE_POOL_SIZE) {
    return { pool: matched, usedFallback: false };
  }

  if (menus.length <= MIN_CANDIDATE_POOL_SIZE) {
    return { pool: matched.length > 0 ? matched : menus, usedFallback: matched.length === 0 };
  }

  return { pool: menus, usedFallback: true };
}

function filterByCookTime(
  menus: MenuItem[],
  context?: RecommendationContext,
  options: CandidatePoolBuildOptions = {},
): { pool: MenuItem[]; applied: boolean } {
  if (options.skipCookTimeFilter || !hasExplicitCookTimePreference(context)) {
    return { pool: menus, applied: false };
  }

  const filtered = menus.filter((menu) => menuPassesCookTimeHardFilter(menu, context));
  return { pool: filtered, applied: true };
}

/**
 * Sprint H3-11 — exclude current + recent ids when enough alternatives remain.
 * Soften by allowing the oldest recent id back until at least one candidate exists.
 */
export function applyExclusions(
  menus: MenuItem[],
  excludeIds: string[],
  primaryExclude?: string,
): MenuItem[] {
  if (excludeIds.length === 0) return menus;

  const primary = primaryExclude;
  const recentNewestFirst = excludeIds.filter((id) => id !== primary);

  const without = (blocked: string[]) => {
    const block = new Set(blocked);
    return menus.filter((menu) => !block.has(menu.id));
  };

  // Strict: current + all recent
  const blockedStrict = primary ? [primary, ...recentNewestFirst] : [...recentNewestFirst];
  let pool = without(blockedStrict);
  if (pool.length > 0) return pool;

  // Soften: re-admit oldest recent first (end of newest-first list)
  const softRecent = [...recentNewestFirst];
  while (softRecent.length > 0) {
    softRecent.pop();
    const blocked = primary ? [primary, ...softRecent] : [...softRecent];
    pool = without(blocked);
    if (pool.length > 0) return pool;
  }

  // Last resort: only exclude current
  if (primary) {
    pool = without([primary]);
    if (pool.length > 0) return pool;
  }

  return menus;
}

function filterByAiExclusions(
  menus: MenuItem[],
  context?: RecommendationContext,
): { pool: MenuItem[]; applied: boolean; excludedIds: string[] } {
  const settings = context?.aiRecommendationSettings;
  const hasAvoidance =
    (settings?.avoidedFoods.length ?? 0) > 0 ||
    Boolean(settings?.customAvoidedFood.trim()) ||
    settings?.spicyLevel === 'dislike';

  if (!hasAvoidance) {
    return { pool: menus, applied: false, excludedIds: [] };
  }

  const excludedIds: string[] = [];
  const pool = menus.filter((menu) => {
    const pass = menuPassesAiRecommendationExclusions(menu, context);
    if (!pass) excludedIds.push(menu.id);
    return pass;
  });

  return { pool, applied: true, excludedIds };
}

export function buildRecommendationCandidatePool(input: {
  menus: MenuItem[];
  mealType: MealType;
  mealMode: MealMode;
  excludeMenuId?: string;
  recentMenuIds?: string[];
  context?: RecommendationContext;
  poolOptions?: CandidatePoolBuildOptions;
}): { candidates: MenuItem[]; debug: CandidatePoolDebug } {
  const {
    menus,
    mealType,
    mealMode,
    excludeMenuId,
    recentMenuIds = [],
    context,
    poolOptions = {},
  } = input;

  const afterMode = filterByMode(menus, mealMode);
  const afterHomeMeal = filterHomeMealCandidates(afterMode);
  const { pool: afterMealType, usedFallback } = filterByMealType(
    afterHomeMeal,
    mealType,
    poolOptions,
  );
  const { pool: afterCookTime, applied: usedCookTimeFilter } = filterByCookTime(
    afterMealType,
    context,
    poolOptions,
  );

  const {
    pool: afterAiExclusions,
    applied: usedAiExclusionFilter,
    excludedIds: aiExcludedIds,
  } = filterByAiExclusions(afterCookTime, context);

  const excludeIds = poolOptions.skipRecentExclusions
    ? [...(excludeMenuId ? [excludeMenuId] : [])]
    : [
        ...(excludeMenuId ? [excludeMenuId] : []),
        ...recentMenuIds.filter((id) => id !== excludeMenuId),
      ];

  const afterExclusions = applyExclusions(afterAiExclusions, excludeIds, excludeMenuId);

  const debug: CandidatePoolDebug = {
    totalRecipes: menus.length,
    afterMealTypeFilter: afterMealType.length,
    afterModeFilter: afterMode.length,
    afterCookTimeFilter: afterCookTime.length,
    afterAiExclusionFilter: afterAiExclusions.length,
    afterExclusions: afterExclusions.length,
    finalCount: afterExclusions.length,
    finalNames: afterExclusions.map((menu) => menu.title),
    mealType,
    mealMode,
    usedMealTypeFallback: usedFallback,
    usedCookTimeFilter,
    usedAiExclusionFilter,
    aiExcludedIds,
  };

  logCandidatePoolDebug(debug);

  return { candidates: afterExclusions, debug };
}

const RELAXATION_STEPS: Array<{
  level: CandidatePoolRelaxation;
  options: CandidatePoolBuildOptions;
}> = [
  { level: 'none', options: {} },
  { level: 'preferences', options: { skipCookTimeFilter: true } },
  {
    level: 'cook_time',
    options: { skipCookTimeFilter: true, skipMealTypeFilter: true },
  },
  {
    level: 'recent_exclusions',
    options: {
      skipCookTimeFilter: true,
      skipMealTypeFilter: true,
      skipRecentExclusions: true,
    },
  },
];

/**
 * Try progressively softer preference filters while keeping AI safety exclusions.
 * Never falls back to the full catalog without exclusions.
 */
export function resolveRecommendationCandidates(input: {
  menus: MenuItem[];
  mealType: MealType;
  mealMode: MealMode;
  excludeMenuId?: string;
  recentMenuIds?: string[];
  context?: RecommendationContext;
}): {
  candidates: MenuItem[];
  debug: CandidatePoolDebug;
  relaxation: CandidatePoolRelaxation;
} {
  let lastDebug = buildRecommendationCandidatePool({ ...input }).debug;

  for (const step of RELAXATION_STEPS) {
    const result = buildRecommendationCandidatePool({
      ...input,
      poolOptions: step.options,
    });
    lastDebug = result.debug;
    if (result.candidates.length > 0) {
      return {
        candidates: result.candidates,
        debug: result.debug,
        relaxation: step.level,
      };
    }
  }

  return {
    candidates: [],
    debug: lastDebug,
    relaxation: 'exhausted',
  };
}
