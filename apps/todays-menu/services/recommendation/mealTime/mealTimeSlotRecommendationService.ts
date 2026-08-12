/**
 * Sprint 59 — Meal-time slot recommendation orchestration (cache + ranking).
 */
import { getHankkiRecommendationMessage } from '../../../constants/HankkiMessages';
import { getYesterdayRecipeIds } from '../../MealHistoryService';
import type { HomeRecommendationDTO, MealMode } from '../../../types/home';
import type { MealTimeSlotKey } from '../../../types/mealTimeRecommendation';
import { getLocalDateKey, getNow } from '../../../utils/dateProvider';
import { enrichRecommendationContextWithPantry } from '../../pantry';
import { filterRecommendableMenus } from '../mealCoursePolicy';
import { getFlagshipMenuCatalog } from '../goldMealCatalog';
import { resolveRecommendationCandidates } from '../buildCandidatePool';
import { loadRecommendationContext } from '../recommendationContext';
import { withSeedRecommendationMessage } from '../seedRecommendationMessage';
import { nextRefreshGeneration } from './mealTimeCachePolicy';
import {
  buildRecipeIdsFromRecommendation,
  loadMealTimeSlotCacheEntry,
  saveMealTimeSlotCacheEntry,
  type MealTimeSlotCacheEntry,
} from './mealTimeSlotCacheStorage';
import { rankMealTimeSlotSet } from './mealTimeSlotRanking';
import { mealTimeSlotToMealType } from './mealTimeSlotMapping';
import {
  buildIntelligenceReasons,
  buildMealExplanation,
  resolveMealSituation,
  scoreToConfidence,
} from '../mealIntelligence';
import { buildMealExperience } from '../mealExperience';
import type { RecommendationAlternative } from '../../../types/mealIntelligenceEngine';
import type { MenuItem } from '../../../types/recommendation';
import { getMenuById } from '../../recipe/mockRecipeDetails';

let recommendationCounter = 0;

function buildDtoFromRanking(
  ranking: ReturnType<typeof rankMealTimeSlotSet>,
  menus: MenuItem[],
  mealType: ReturnType<typeof mealTimeSlotToMealType>,
  mealMode: MealMode,
  enrichedContext: Awaited<ReturnType<typeof loadRecommendationContext>>,
): HomeRecommendationDTO {
  if (!ranking.primary) {
    recommendationCounter += 1;
    return {
      recommendationId: `rec_${String(recommendationCounter).padStart(3, '0')}`,
      mealMode,
      chefMessage: '설정에 맞는 안전한 메뉴를 찾지 못했어요.',
      reason: '제외 조건을 유지한 채 추천할 메뉴가 없어요.',
      recipe: {
        id: '',
        title: '',
        subtitle: '',
        imageUrl: null,
        cookingTimeMinutes: 0,
        difficulty: 'normal',
      },
      badges: [],
      fallbackUsed: false,
      confidence: 0,
      noCandidatesAvailable: true,
    };
  }

  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const request = {
    mealType,
    mealMode,
    context: enrichedContext,
  };
  const situation = resolveMealSituation(request);

  const primaryMenu = menuById.get(ranking.primary.menuId)!;
  recommendationCounter += 1;

  const buildAlt = (
    scored: typeof ranking.primary,
    rank: 2 | 3 | 4,
  ): RecommendationAlternative => {
    const menu = menuById.get(scored!.menuId)!;
    const reasonSignals = buildIntelligenceReasons(menu, scored!.breakdown, situation);
    const explanation = buildMealExplanation({
      menu,
      breakdown: scored!.breakdown,
      situation,
      context: enrichedContext,
      rank,
      totalCandidates: ranking.totalCandidates,
    });
    return {
      rank: rank <= 3 ? (rank as 2 | 3) : 3,
      recipe: {
        id: menu.id,
        title: menu.title,
        subtitle: menu.subtitle,
        cookingTimeMinutes: menu.cookTime,
        difficulty: menu.difficulty,
      },
      confidence: scoreToConfidence(scored!.score),
      reason: explanation.level1,
      mealExperience: buildMealExperience({ menu, request, reasonSignals }),
      explanation,
    };
  };

  const alternatives: RecommendationAlternative[] = ranking.alternatives
    .slice(0, 3)
    .map((scored, index) => buildAlt(scored, (index + 2) as 2 | 3 | 4));

  const primaryReasonSignals = buildIntelligenceReasons(
    primaryMenu,
    ranking.primary.breakdown,
    situation,
  );
  const primaryExplanation = buildMealExplanation({
    menu: primaryMenu,
    breakdown: ranking.primary.breakdown,
    situation,
    context: enrichedContext,
    rank: 1,
    totalCandidates: ranking.totalCandidates,
  });

  return {
    recommendationId: `rec_${String(recommendationCounter).padStart(3, '0')}`,
    mealMode,
    chefMessage: getHankkiRecommendationMessage(mealType, primaryMenu.title),
    reason: primaryExplanation.level1,
    recipe: {
      id: primaryMenu.id,
      title: primaryMenu.title,
      subtitle: primaryMenu.subtitle,
      imageUrl: null,
      cookingTimeMinutes: primaryMenu.cookTime,
      difficulty: primaryMenu.difficulty,
    },
    badges: primaryMenu.badges,
    fallbackUsed: false,
    confidence: scoreToConfidence(ranking.primary.score),
    honeyTip: primaryMenu.honeyTip,
    mealExperience: buildMealExperience({
      menu: primaryMenu,
      request,
      reasonSignals: primaryReasonSignals,
    }),
    explanation: primaryExplanation,
    alternatives,
  };
}

async function generateMealTimeSlotRecommendation(
  slot: MealTimeSlotKey,
  mealMode: MealMode,
  options: {
    useClockWeights?: boolean;
    refreshGeneration?: number;
    repeatPenaltyIds?: string[];
    sessionShownIds?: string[];
    excludeMenuId?: string;
  } = {},
): Promise<HomeRecommendationDTO> {
  const mealType = mealTimeSlotToMealType(slot);
  const [context, yesterdayIds] = await Promise.all([
    loadRecommendationContext(),
    getYesterdayRecipeIds(),
  ]);

  const menus = filterRecommendableMenus(getFlagshipMenuCatalog('homemade'));
  const withoutYesterday =
    yesterdayIds.length > 0
      ? menus.filter((menu) => !yesterdayIds.includes(menu.id)).length > 0
        ? menus.filter((menu) => !yesterdayIds.includes(menu.id))
        : menus
      : menus;

  const { candidates } = resolveRecommendationCandidates({
    menus: withoutYesterday,
    mealType,
    mealMode,
    excludeMenuId: options.excludeMenuId,
    recentMenuIds: options.repeatPenaltyIds ?? [],
    context,
  });

  const enrichedContext = await enrichRecommendationContextWithPantry(context, candidates);
  const request = { mealType, mealMode, context: enrichedContext };
  const situation = resolveMealSituation(request);

  const rankingOptions = {
    targetSlot: slot,
    useClockWeights: options.useClockWeights ?? false,
    limit: 4,
    refreshGeneration: options.refreshGeneration ?? 0,
    repeatPenaltyIds: options.repeatPenaltyIds ?? [],
    sessionShownIds: options.sessionShownIds ?? [],
    excludeMenuId: options.excludeMenuId,
  };

  let ranking = rankMealTimeSlotSet(candidates, situation, enrichedContext, rankingOptions);

  if (
    !ranking.primary &&
    (options.sessionShownIds?.length ?? 0) > 0 &&
    rankingOptions.sessionShownIds.length > 0
  ) {
    ranking = rankMealTimeSlotSet(candidates, situation, enrichedContext, {
      ...rankingOptions,
      sessionShownIds: [],
    });
  }

  return buildDtoFromRanking(ranking, candidates, mealType, mealMode, enrichedContext);
}

export type ResolveMealTimeSlotOptions = {
  useClockWeights?: boolean;
  forceGenerate?: boolean;
  sessionShownIds?: string[];
};

function cachedPrimaryConflictsSession(
  recommendation: HomeRecommendationDTO,
  sessionShownIds: string[],
): boolean {
  const primaryId = recommendation.recipe?.id?.trim();
  if (!primaryId || recommendation.noCandidatesAvailable) return false;
  return sessionShownIds.includes(primaryId);
}

export async function resolveMealTimeSlotRecommendation(
  slot: MealTimeSlotKey,
  mealMode: MealMode,
  options: ResolveMealTimeSlotOptions = {},
): Promise<HomeRecommendationDTO> {
  const dateKey = getLocalDateKey(getNow());
  const sessionShownIds = options.sessionShownIds ?? [];
  const cached = await loadMealTimeSlotCacheEntry(dateKey, slot);

  if (
    cached &&
    !options.forceGenerate &&
    isValidCachedEntry(cached, dateKey, slot) &&
    !cachedPrimaryConflictsSession(cached.recommendation, sessionShownIds)
  ) {
    return cached.recommendation;
  }

  const dto = await generateMealTimeSlotRecommendation(slot, mealMode, {
    useClockWeights: options.useClockWeights ?? false,
    refreshGeneration: cached?.refreshGeneration ?? 0,
    sessionShownIds,
  });

  const withSeed = await withSeedRecommendationMessage(dto, mealTimeSlotToMealType(slot));
  await persistSlotCache(dateKey, slot, cached?.refreshGeneration ?? 0, withSeed);
  return withSeed;
}

function isValidCachedEntry(
  entry: MealTimeSlotCacheEntry,
  dateKey: string,
  slot: MealTimeSlotKey,
): boolean {
  return entry.dateKey === dateKey && entry.slot === slot;
}

async function persistSlotCache(
  dateKey: string,
  slot: MealTimeSlotKey,
  refreshGeneration: number,
  recommendation: HomeRecommendationDTO,
): Promise<void> {
  await saveMealTimeSlotCacheEntry({
    dateKey,
    slot,
    recipeIds: buildRecipeIdsFromRecommendation(recommendation),
    refreshGeneration,
    createdAt: getNow().toISOString(),
    recommendation,
  });
}

export async function refreshMealTimeSlotRecommendation(
  slot: MealTimeSlotKey,
  mealMode: MealMode,
  options: {
    useClockWeights?: boolean;
    previousRecipeIds?: string[];
    sessionShownIds?: string[];
  } = {},
): Promise<HomeRecommendationDTO> {
  const dateKey = getLocalDateKey(getNow());
  const cached = await loadMealTimeSlotCacheEntry(dateKey, slot);
  const previousIds =
    options.previousRecipeIds ??
    cached?.recipeIds ??
    (cached ? buildRecipeIdsFromRecommendation(cached.recommendation) : []);

  const nextGen = nextRefreshGeneration(cached?.refreshGeneration ?? 0);
  const primaryId = previousIds[0];

  const dto = await generateMealTimeSlotRecommendation(slot, mealMode, {
    useClockWeights: options.useClockWeights ?? false,
    refreshGeneration: nextGen,
    repeatPenaltyIds: previousIds,
    sessionShownIds: options.sessionShownIds ?? [],
    excludeMenuId: primaryId,
  });

  const withSeed = await withSeedRecommendationMessage(dto, mealTimeSlotToMealType(slot));
  await persistSlotCache(dateKey, slot, nextGen, withSeed);
  return withSeed;
}

/** Swap primary with alternative without re-scoring (same as promoteAlternative). */
export function promoteMealTimeAlternative(
  current: HomeRecommendationDTO,
  alternativeId: string,
): HomeRecommendationDTO | null {
  const alt = current.alternatives?.find((item) => item.recipe.id === alternativeId);
  if (!alt) return null;

  const demoted: RecommendationAlternative = {
    rank: alt.rank,
    recipe: {
      id: current.recipe.id,
      title: current.recipe.title,
      subtitle: current.recipe.subtitle ?? '',
      cookingTimeMinutes: current.recipe.cookingTimeMinutes,
      difficulty: current.recipe.difficulty,
    },
    confidence: current.confidence,
    reason: current.reason,
    mealExperience: current.mealExperience,
    explanation: current.explanation,
  };

  const otherAlts =
    current.alternatives?.filter((item) => item.recipe.id !== alternativeId) ?? [];
  const promotedMenu = getMenuById(alt.recipe.id);

  return {
    ...current,
    reason: alt.reason,
    confidence: alt.confidence,
    badges: promotedMenu?.badges ?? current.badges,
    honeyTip: promotedMenu?.honeyTip ?? current.honeyTip,
    recipe: {
      ...current.recipe,
      id: alt.recipe.id,
      title: alt.recipe.title,
      subtitle: alt.recipe.subtitle,
      cookingTimeMinutes: alt.recipe.cookingTimeMinutes,
      difficulty: alt.recipe.difficulty,
      imageUrl: null,
    },
    mealExperience: alt.mealExperience,
    explanation: alt.explanation,
    alternatives: [...otherAlts, demoted].slice(0, 3).map((item, index) => ({
      ...item,
      rank: ((index + 2) as 2 | 3),
    })),
  };
}

export async function saveMealTimeSlotRecommendationState(
  slot: MealTimeSlotKey,
  recommendation: HomeRecommendationDTO,
  refreshGeneration?: number,
): Promise<void> {
  const dateKey = getLocalDateKey(getNow());
  const cached = await loadMealTimeSlotCacheEntry(dateKey, slot);
  await persistSlotCache(
    dateKey,
    slot,
    refreshGeneration ?? cached?.refreshGeneration ?? 0,
    recommendation,
  );
}
