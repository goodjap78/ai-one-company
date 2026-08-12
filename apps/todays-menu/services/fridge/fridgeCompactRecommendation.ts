import { FRIDGE_COMPACT_WINDOW_SIZE } from '../../constants/fridgeCompactLayout';
import type { FridgeRaidCandidate, FridgeRaidDisplayGroups } from './fridgeRaidTypes';

export const FRIDGE_RECENT_RECOMMENDATION_LIMIT = 6;

export function fridgeCompactTierBadge(starRating: number): string {
  if (starRating >= 5) return '바로 가능';
  if (starRating === 4) return '하나만 더';
  return '두 개만 더';
}

export function formatFridgeCompactUtilizedLabel(matchedSelectedIngredients: string[]): string {
  if (matchedSelectedIngredients.length === 0) return '—';
  return matchedSelectedIngredients.slice(0, 3).join(' · ');
}

export function formatFridgeCompactMissingLabel(candidate: FridgeRaidCandidate): string {
  if (candidate.missingCount === 0) return '없음';
  if (candidate.missingCount === 1 && candidate.missingIngredients[0]) {
    return `${candidate.missingIngredients[0]} 1개`;
  }
  return `${candidate.missingCount}개`;
}

export function flattenPrimaryFridgeCandidates(groups: FridgeRaidDisplayGroups): FridgeRaidCandidate[] {
  return [...groups.tier5, ...groups.tier4, ...groups.tier3];
}

export function sliceFridgeRecommendationWindow(
  candidates: FridgeRaidCandidate[],
  offset: number,
  windowSize = FRIDGE_COMPACT_WINDOW_SIZE,
): FridgeRaidCandidate[] {
  if (candidates.length === 0) return [];
  const size = Math.min(windowSize, candidates.length);
  return Array.from({ length: size }, (_, index) => candidates[(offset + index) % candidates.length]!);
}

export function advanceFridgeRecommendationOffset(
  candidates: FridgeRaidCandidate[],
  currentOffset: number,
  windowSize = FRIDGE_COMPACT_WINDOW_SIZE,
): number {
  if (candidates.length === 0) return 0;
  if (candidates.length <= windowSize) {
    return (currentOffset + 1) % candidates.length;
  }
  return (currentOffset + windowSize) % candidates.length;
}

export function windowsShareSameRecipeIds(
  candidates: FridgeRaidCandidate[],
  offsetA: number,
  offsetB: number,
  windowSize = FRIDGE_COMPACT_WINDOW_SIZE,
): boolean {
  const windowA = sliceFridgeRecommendationWindow(candidates, offsetA, windowSize);
  const windowB = sliceFridgeRecommendationWindow(candidates, offsetB, windowSize);
  if (windowA.length !== windowB.length) return false;
  return windowA.every((item, index) => item.recipeId === windowB[index]!.recipeId);
}

export function trimFridgeRecentRecommendationIds(ids: string[]): string[] {
  return ids.slice(0, FRIDGE_RECENT_RECOMMENDATION_LIMIT);
}

export function pickNextFridgeRecommendationWindow(
  candidates: FridgeRaidCandidate[],
  currentOffset: number,
  recentIds: string[],
  windowSize = FRIDGE_COMPACT_WINDOW_SIZE,
): { offset: number; recentIds: string[] } {
  if (candidates.length === 0) {
    return { offset: 0, recentIds };
  }

  const currentWindow = sliceFridgeRecommendationWindow(candidates, currentOffset, windowSize);
  const currentIds = currentWindow.map((candidate) => candidate.recipeId);

  let nextOffset = advanceFridgeRecommendationOffset(candidates, currentOffset, windowSize);
  let attempts = 0;

  while (
    attempts < candidates.length &&
    windowsShareSameRecipeIds(candidates, currentOffset, nextOffset, windowSize)
  ) {
    nextOffset = advanceFridgeRecommendationOffset(candidates, nextOffset, windowSize);
    attempts += 1;
  }

  return {
    offset: nextOffset,
    recentIds: trimFridgeRecentRecommendationIds([...currentIds, ...recentIds]),
  };
}

export function canRotateFridgeRecommendationWindow(
  candidates: FridgeRaidCandidate[],
  windowSize = FRIDGE_COMPACT_WINDOW_SIZE,
): boolean {
  return candidates.length > 1;
}
