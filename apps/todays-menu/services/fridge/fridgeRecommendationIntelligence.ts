export type FridgeRecommendationStarRating = 5 | 4 | 3 | 2;

export function starRatingFromMissingCount(missingCount: number): FridgeRecommendationStarRating {
  if (missingCount <= 0) return 5;
  if (missingCount === 1) return 4;
  if (missingCount === 2) return 3;
  return 2;
}

export function formatIngredientList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]}과 ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}과 ${names.at(-1)!}`;
}

export function buildFridgeTierHint(
  starRating: FridgeRecommendationStarRating,
  missingIngredients: string[],
): string {
  if (starRating === 5) return '바로 만들 수 있어요';
  if (starRating === 4 && missingIngredients[0]) {
    return `${missingIngredients[0]} 하나만 있으면 됩니다`;
  }
  if (starRating === 3 && missingIngredients.length >= 2) {
    return `${formatIngredientList(missingIngredients.slice(0, 2))} 두 가지만 더 있으면 됩니다`;
  }
  if (missingIngredients.length > 0) {
    return `${formatIngredientList(missingIngredients.slice(0, 3))}이 더 필요해요`;
  }
  return '비슷한 재료로 만들 수 있어요';
}

export function buildFridgeRecommendationReason(
  matchedIngredients: string[],
  missingIngredients: string[],
  starRating: FridgeRecommendationStarRating,
): string {
  if (starRating === 5) {
    return '선택한 재료로 바로 만들 수 있어요.';
  }
  if (starRating === 4 && missingIngredients[0]) {
    if (matchedIngredients.length >= 2) {
      return `${formatIngredientList(matchedIngredients.slice(0, 2))}이 있어 ${missingIngredients[0]}만 추가하면 됩니다.`;
    }
    return `${missingIngredients[0]}만 더 있으면 만들 수 있어요.`;
  }
  if (starRating === 3) {
    return '오늘 선택한 재료 대부분으로 만들 수 있습니다.';
  }
  if (matchedIngredients.length > 0) {
    return '선택한 재료와 비슷한 메뉴예요.';
  }
  return '재료가 많이 맞아요.';
}

export function difficultyRank(difficulty: string): number {
  const normalized = difficulty.trim();
  if (normalized === '쉬움' || normalized.toLowerCase() === 'easy') return 0;
  if (normalized === '어려움' || normalized.toLowerCase() === 'hard') return 2;
  return 1;
}

export function isPrimaryFridgeRecommendation(missingCount: number): boolean {
  return missingCount < 3;
}

export type FridgeRecommendationSortable = {
  matchedSelectedCount: number;
  selectedCoverageRatio: number;
  missingCount: number;
  matchRatio: number;
  difficultyRank: number;
  cookTime: number;
  recommendationPriority: number;
};

export function compareFridgeRecommendations(
  a: FridgeRecommendationSortable,
  b: FridgeRecommendationSortable,
): number {
  if (a.matchedSelectedCount !== b.matchedSelectedCount) {
    return b.matchedSelectedCount - a.matchedSelectedCount;
  }
  if (a.selectedCoverageRatio !== b.selectedCoverageRatio) {
    return b.selectedCoverageRatio - a.selectedCoverageRatio;
  }
  if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
  if (a.matchRatio !== b.matchRatio) return b.matchRatio - a.matchRatio;
  if (a.difficultyRank !== b.difficultyRank) return a.difficultyRank - b.difficultyRank;
  if (a.cookTime !== b.cookTime) return a.cookTime - b.cookTime;
  return b.recommendationPriority - a.recommendationPriority;
}

export type FridgeUtilizationSortable = FridgeRecommendationSortable & {
  matchedSelectedCount: number;
};

/** When ≥2 selected, 1-use menus sink below 2+ use menus if any 2+ candidates exist. */
export function applyMinimumUtilizationOrder<T extends FridgeUtilizationSortable>(
  candidates: T[],
  selectedIngredientCount: number,
): T[] {
  const sorted = [...candidates].sort(compareFridgeRecommendations);
  if (selectedIngredientCount < 2) return sorted;

  if (selectedIngredientCount >= 3) {
    const bands: T[] = [];
    const used = new Set<T>();
    const takeBand = (predicate: (item: T) => boolean) => {
      for (const item of sorted) {
        if (used.has(item) || !predicate(item)) continue;
        bands.push(item);
        used.add(item);
      }
    };
    takeBand((item) => item.matchedSelectedCount >= 3);
    takeBand((item) => item.matchedSelectedCount === 2);
    takeBand((item) => item.matchedSelectedCount === 1);
    for (const item of sorted) {
      if (!used.has(item)) bands.push(item);
    }
    return bands;
  }

  const multiUse = sorted.filter((item) => item.matchedSelectedCount >= 2);
  const singleUse = sorted.filter((item) => item.matchedSelectedCount === 1);
  if (multiUse.length > 0) return [...multiUse, ...singleUse];
  return sorted;
}

export function buildMatchedSelectedSummary(names: string[]): string {
  if (names.length === 0) return '';
  return names.join(' · ');
}

export function buildUnusedSelectedHint(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]}은 다른 추천에서 활용 가능`;
  return `${formatIngredientList(names)}은 다른 추천에서 활용 가능`;
}

export function buildSelectedCoverageLine(
  selectedCount: number,
  matchedSelectedCount: number,
): string {
  if (selectedCount <= 0 || matchedSelectedCount <= 0) return '';
  if (matchedSelectedCount >= selectedCount) {
    return `선택한 재료 ${selectedCount}개 모두 활용해요`;
  }
  return `선택한 재료 ${selectedCount}개 중 ${matchedSelectedCount}개를 활용해요`;
}