import { getMenuById } from '../recipe/mockRecipeDetails';
import { getHankkiRecommendationMessage } from '../../constants/HankkiMessages';
import { getYesterdayRecipeIds } from '../MealHistoryService';
import type { HomeRecommendationDTO, MealType } from '../../types/home';
import type { RecommendationAlternative } from '../../types/mealIntelligenceEngine';
import type { MenuItem, RecommendationRequest } from '../../types/recommendation';
import { loadRecommendationContext } from './recommendationContext';
import { enrichRecommendationContextWithPantry } from '../pantry';
import { getDeliveryMenuCatalog } from './deliveryMealCatalog';
import { getFlagshipMenuCatalog } from './goldMealCatalog';
import { filterRecommendableMenus } from './mealCoursePolicy';
import { buildMealExperience } from './mealExperience';
import {
  buildIntelligenceReasons,
  buildMealExplanation,
  resolveMealSituation,
  scoreToConfidence,
} from './mealIntelligence';
import { rankTopMeals } from './mealIntelligence/selectMeal';
import type { MealMode } from '../../types/home';
import type { ScoredMenuItem } from '../../types/mealIntelligenceEngine';
import { resolveRecommendationCandidates } from './buildCandidatePool';
import {
  getRecentShownMenuIds,
  loadRecentShownMenus,
  noteRecommendedMenu,
} from './recommendationRefreshHistory';
import { getRecommendationRandom } from './recommendationRng';

let recommendationCounter = 0;

function resolveCandidatePool(
  menus: MenuItem[],
  request: RecommendationRequest,
  options: { isRefresh?: boolean; recentMenuIds?: string[] } = {},
) {
  // Refresh: exclude last 3 shown. Initial load: empty (deterministic first pick).
  const recentMenuIds = options.isRefresh
    ? (options.recentMenuIds ?? getRecentShownMenuIds())
    : [];

  return resolveRecommendationCandidates({
    menus,
    mealType: request.mealType,
    mealMode: request.mealMode,
    excludeMenuId: request.excludeMenuId,
    recentMenuIds,
    context: request.context,
  });
}

async function withPantryEnrichedContext(
  request: Omit<RecommendationRequest, 'context'>,
  context: Awaited<ReturnType<typeof loadRecommendationContext>>,
): Promise<RecommendationRequest> {
  const menus = filterRecommendableMenus(getMenuCatalogForMode(request.mealMode));
  const { candidates } = resolveCandidatePool(menus, request);
  const enrichedContext = await enrichRecommendationContextWithPantry(context, candidates);
  return { ...request, context: enrichedContext };
}

function getMenuCatalogForMode(mealMode: MealMode): MenuItem[] {
  if (mealMode === 'delivery') {
    return getDeliveryMenuCatalog();
  }
  return getFlagshipMenuCatalog('homemade');
}

function buildDtoFromScored(
  menu: MenuItem,
  scored: ScoredMenuItem,
  mealType: MealType,
  request: RecommendationRequest,
  situation: ReturnType<typeof resolveMealSituation>,
  options: { fallbackUsed?: boolean; rank?: number; totalCandidates?: number } = {},
): HomeRecommendationDTO {
  recommendationCounter += 1;
  const reasonSignals = buildIntelligenceReasons(menu, scored.breakdown, situation);
  const confidence = scoreToConfidence(scored.score);
  const rank = options.rank ?? 1;
  const totalCandidates = options.totalCandidates ?? 1;
  const explanation = buildMealExplanation({
    menu,
    breakdown: scored.breakdown,
    situation,
    context: request.context,
    rank,
    totalCandidates,
  });

  return {
    recommendationId: `rec_${String(recommendationCounter).padStart(3, '0')}`,
    mealMode: menu.mode,
    chefMessage: getHankkiRecommendationMessage(mealType, menu.title),
    reason: explanation.level1,
    recipe: {
      id: menu.id,
      title: menu.title,
      subtitle: menu.subtitle,
      imageUrl: null,
      cookingTimeMinutes: menu.cookTime,
      difficulty: menu.difficulty,
    },
    badges: menu.badges,
    fallbackUsed: options.fallbackUsed ?? false,
    confidence,
    honeyTip: menu.honeyTip,
    mealExperience: buildMealExperience({ menu, request, reasonSignals }),
    explanation,
  };
}

function buildAlternative(
  menu: MenuItem,
  scored: ScoredMenuItem,
  rank: 2 | 3,
  request: RecommendationRequest,
  situation: ReturnType<typeof resolveMealSituation>,
  totalCandidates: number,
): RecommendationAlternative {
  const reasonSignals = buildIntelligenceReasons(menu, scored.breakdown, situation);
  const explanation = buildMealExplanation({
    menu,
    breakdown: scored.breakdown,
    situation,
    context: request.context,
    rank,
    totalCandidates,
  });

  return {
    rank,
    recipe: {
      id: menu.id,
      title: menu.title,
      subtitle: menu.subtitle,
      cookingTimeMinutes: menu.cookTime,
      difficulty: menu.difficulty,
    },
    confidence: scoreToConfidence(scored.score),
    reason: explanation.level1,
    mealExperience: buildMealExperience({ menu, request, reasonSignals }),
    explanation,
  };
}

function filterYesterdayRecipes(menus: MenuItem[], yesterdayIds: string[]): MenuItem[] {
  if (yesterdayIds.length === 0) return menus;
  const filtered = menus.filter((menu) => !yesterdayIds.includes(menu.id));
  return filtered.length > 0 ? filtered : menus;
}

function buildNoCandidatesRecommendation(request: RecommendationRequest): HomeRecommendationDTO {
  recommendationCounter += 1;
  return {
    recommendationId: `rec_${String(recommendationCounter).padStart(3, '0')}`,
    mealMode: request.mealMode,
    chefMessage: '설정에 맞는 안전한 메뉴를 찾지 못했어요.',
    reason: '제외 조건을 유지한 채 추천할 메뉴가 없어요. 설정을 조정해 보세요.',
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

function recommendFromCatalog(
  request: RecommendationRequest,
  yesterdayIds: string[] = [],
  options: { isRefresh?: boolean; recentMenuIds?: string[] } = {},
): HomeRecommendationDTO {
  const menus = filterRecommendableMenus(getMenuCatalogForMode(request.mealMode));
  const withoutYesterday = filterYesterdayRecipes(menus, yesterdayIds);
  const { candidates, relaxation } = resolveCandidatePool(withoutYesterday, request, options);

  if (candidates.length === 0) {
    return buildNoCandidatesRecommendation(request);
  }

  return recommendFromCatalogWithPool(
    candidates,
    request,
    yesterdayIds,
    options,
    relaxation !== 'none',
  );
}

function recommendFromCatalogWithPool(
  candidates: MenuItem[],
  request: RecommendationRequest,
  _yesterdayIds: string[] = [],
  options: { isRefresh?: boolean; recentMenuIds?: string[] } = {},
  exclusionFallbackUsed = false,
): HomeRecommendationDTO {
  const situation = resolveMealSituation(request);
  const menuById = new Map(candidates.map((menu) => [menu.id, menu]));

  const ranking = rankTopMeals(candidates, situation, request.context, {
    excludeMenuId: request.excludeMenuId,
    limit: 3,
    refreshSalt: options.isRefresh
      ? Math.floor(getRecommendationRandom() * 1_000_000_000) + recommendationCounter * 31
      : 0,
    expandPickPool: Boolean(options.isRefresh),
  });

  if (!ranking.primary) {
    return buildNoCandidatesRecommendation(request);
  }

  const primaryMenu = menuById.get(ranking.primary.menuId)!;

  const alternatives: RecommendationAlternative[] = ranking.alternatives
    .slice(0, 2)
    .map((scored, index) => {
      const menu = menuById.get(scored.menuId)!;
      return buildAlternative(
        menu,
        scored,
        (index + 2) as 2 | 3,
        request,
        situation,
        ranking.totalCandidates,
      );
    });

  const dto = buildDtoFromScored(
    primaryMenu,
    ranking.primary,
    request.mealType,
    request,
    situation,
    {
      fallbackUsed:
        exclusionFallbackUsed ||
        (Boolean(request.excludeMenuId) && ranking.primary.menuId === request.excludeMenuId),
      rank: 1,
      totalCandidates: ranking.totalCandidates,
    },
  );

  noteRecommendedMenu(dto.recipe.id);

  return { ...dto, alternatives };
}

/** HMIE v1.0 — HANKKI Meal Intelligence Engine */
export const mealIntelligenceEngine = {
  recommend: recommendFromCatalog,
};

export const flagshipRecommendationEngine = mealIntelligenceEngine;

/** @deprecated Use `mealIntelligenceEngine` */
export const mockRecommendationEngine = mealIntelligenceEngine;

export function recommendMenu(request: RecommendationRequest): HomeRecommendationDTO {
  return mealIntelligenceEngine.recommend(request);
}

export async function recommendMenuWithContext(
  request: Omit<RecommendationRequest, 'context'>,
  options: { dailyExcludeRecipeId?: string } = {},
): Promise<HomeRecommendationDTO> {
  const [context, yesterdayIds] = await Promise.all([
    loadRecommendationContext(),
    getYesterdayRecipeIds(),
  ]);
  await loadRecentShownMenus();
  const excludeMenuId =
    request.excludeMenuId ?? options.dailyExcludeRecipeId ?? undefined;
  const enriched = await withPantryEnrichedContext(
    { ...request, excludeMenuId },
    context,
  );
  return recommendFromCatalog(enriched, yesterdayIds);
}

/** @deprecated Use `recommendMenuWithContext`. */
export async function recommendMenuWithPreferences(
  request: Omit<RecommendationRequest, 'context'>,
): Promise<HomeRecommendationDTO> {
  return recommendMenuWithContext(request);
}

export async function refreshMenu(
  mealType: MealType,
  mealMode: RecommendationRequest['mealMode'],
  previousMenuId: string,
): Promise<HomeRecommendationDTO> {
  const [context, yesterdayIds, recentMenuIds] = await Promise.all([
    loadRecommendationContext(),
    getYesterdayRecipeIds(),
    loadRecentShownMenus(),
  ]);
  const enriched = await withPantryEnrichedContext(
    { mealType, mealMode, excludeMenuId: previousMenuId },
    context,
  );
  return recommendFromCatalog(enriched, yesterdayIds, {
    isRefresh: true,
    // Include previous even if not yet in recent list.
    recentMenuIds: [
      previousMenuId,
      ...recentMenuIds.filter((id) => id !== previousMenuId),
    ].slice(0, 3),
  });
}

/** Swap primary with a stored alternative (no re-scoring). */
export function promoteAlternative(
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
    alternatives: [...otherAlts, demoted]
      .slice(0, 2)
      .map((item, index) => {
        const rank = (index + 2) as 2 | 3;
        return {
          ...item,
          rank,
          explanation: item.explanation
            ? {
                ...item.explanation,
                ...(item.explanation.level3
                  ? { level3: { ...item.explanation.level3, rank } }
                  : {}),
              }
            : undefined,
        };
      }),
  };
}
