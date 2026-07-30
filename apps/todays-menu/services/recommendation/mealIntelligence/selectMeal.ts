import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';
import type { HMIERankingResult, MealSituationSnapshot, ScoredMenuItem } from '../../../types/mealIntelligenceEngine';
import { HMIE_TOP_N } from './hmieWeights';
import { scoreMeal } from './scoreMeal';
import { storeRecommendationScoreDebug } from './recommendationScoreDebug';
import { buildMetadataPersonalizationReason } from './aiRecommendationReasonCopy';

/** First daily pick — deterministic band among top scorers. */
const TOP_PICK_POOL_INITIAL = 3;

function buildDailyPickSalt(refreshSalt: number): number {
  const today = new Date();
  return (
    refreshSalt +
    today.getFullYear() * 10_000 +
    (today.getMonth() + 1) * 100 +
    today.getDate()
  );
}

/**
 * Sprint H3-11 — pick primary from `pool` using salt.
 * On refresh, `pool` is the full eligible list so all dinner/lunch menus can rotate.
 */
function pickPrimaryFromPool(pool: ScoredMenuItem[], salt: number): ScoredMenuItem {
  if (pool.length === 0) {
    throw new Error('pickPrimaryFromPool requires a non-empty pool');
  }
  if (pool.length === 1) return pool[0];

  const seed =
    salt +
    pool.reduce(
      (sum, entry) => sum + entry.menuId.split('').reduce((s, c) => s + c.charCodeAt(0), 0),
      0,
    );
  const index = ((seed % pool.length) + pool.length) % pool.length;
  return pool[index];
}

export function scoreMenuCandidates(
  menus: MenuItem[],
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
): ScoredMenuItem[] {
  return menus
    .map((menu) => {
      const breakdown = scoreMeal(menu, situation, context);
      return {
        menuId: menu.id,
        score: breakdown.excluded ? -1 : breakdown.total,
        breakdown,
      };
    })
    .filter((entry) => !entry.breakdown.excluded)
    .sort((a, b) => b.score - a.score || a.menuId.localeCompare(b.menuId));
}

/**
 * Sprint H3-11 — score all, sort.
 * Initial load: date-stable pick among top 3.
 * Refresh (`expandPickPool`): pick among all eligible so rotation exceeds 3 recipes.
 */
export function rankTopMeals(
  menus: MenuItem[],
  situation: MealSituationSnapshot,
  context?: RecommendationContext,
  options: {
    excludeMenuId?: string;
    limit?: number;
    refreshSalt?: number;
    /** When true (다른 메뉴 추천), pick from full eligible pool — not only top 3. */
    expandPickPool?: boolean;
  } = {},
): HMIERankingResult {
  const limit = options.limit ?? HMIE_TOP_N;
  const scored = scoreMenuCandidates(menus, situation, context);
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));

  let ranked = scored.filter((entry) => menuById.has(entry.menuId));
  if (ranked.length === 0) {
    return {
      primary: null,
      alternatives: [],
      all: [],
      totalCandidates: 0,
      noCandidates: true,
    };
  }

  const filtered = options.excludeMenuId
    ? ranked.filter((entry) => entry.menuId !== options.excludeMenuId)
    : ranked;

  if (filtered.length === 0) {
    return {
      primary: null,
      alternatives: [],
      all: [],
      totalCandidates: 0,
      noCandidates: true,
    };
  }

  const pickSalt = buildDailyPickSalt(options.refreshSalt ?? 0);
  const pickPoolSize = options.expandPickPool
    ? Math.max(filtered.length, 1)
    : Math.min(TOP_PICK_POOL_INITIAL, Math.max(filtered.length, 1));
  const pickPool = filtered.slice(0, pickPoolSize);
  const primary =
    pickPool.length > 0
      ? pickPrimaryFromPool(pickPool, pickSalt)
      : filtered[0];

  const pickPoolIds = new Set(pickPool.map((entry) => entry.menuId));
  const alternativesFromPool = pickPool.filter((entry) => entry.menuId !== primary.menuId);
  const remaining = filtered.filter((entry) => !pickPoolIds.has(entry.menuId));
  const alternatives = [...alternativesFromPool, ...remaining].slice(0, limit - 1);

  const top = [primary, ...alternatives];

  storeRecommendationScoreDebug({
    timestamp: new Date().toISOString(),
    mealType: situation.mealType,
    mealMode: situation.mealMode,
    entries: filtered.map((entry) => ({
      menuId: entry.menuId,
      title: menuById.get(entry.menuId)?.title ?? entry.menuId,
      score: entry.score,
      baseScore: entry.breakdown.baseScore,
      factors: entry.breakdown.factors,
      notes: entry.breakdown.notes,
      excluded: Boolean(entry.breakdown.excluded),
      exclusionReasons: entry.breakdown.exclusionReasons ?? [],
      metadataHits: (entry.breakdown.metadataHits ?? []).map((hit) => ({
        key: hit.key,
        points: hit.points,
        label: hit.label,
      })),
      selectedReason: buildMetadataPersonalizationReason(
        entry.breakdown.metadataHits ?? [],
        entry.menuId,
      ),
      usedSettings: entry.breakdown.metadataDebug?.usedSettings,
      usedMetadata: entry.breakdown.metadataDebug?.usedMetadata,
    })),
    selectedMenuId: primary.menuId,
    pickPoolMenuIds: pickPool.map((entry) => entry.menuId),
  });

  return { primary, alternatives, all: top, totalCandidates: filtered.length };
}

/** @deprecated Use rankTopMeals */
export function selectBestMeal(
  scored: ScoredMenuItem[],
  menus: MenuItem[],
  excludeMenuId?: string,
) {
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const ranked = scored.filter((entry) => menuById.has(entry.menuId));
  const primary = ranked.find((entry) => entry.menuId !== excludeMenuId) ?? ranked[0];
  const menu = menuById.get(primary.menuId)!;
  return {
    menu,
    breakdown: primary.breakdown,
    fallbackUsed: Boolean(excludeMenuId && primary.menuId === excludeMenuId),
  };
}
