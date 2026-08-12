import type { ConvenienceCombo } from '../../data/content/types/convenienceCombo';
import {
  COMBO_SITUATION_TAG,
  filterConvenienceCombos,
  listAllConvenienceCombos,
} from './convenienceComboCatalog';

export type RecommendationSituationId = keyof typeof COMBO_SITUATION_TAG;

export const RECOMMENDATION_SITUATION_ORDER: RecommendationSituationId[] = [
  'hearty',
  'budget',
  'lateNight',
  'spicy',
  'light',
  'protein',
  'dessert',
  'hangover',
];

export const DEFAULT_RECOMMENDATION_SITUATION: RecommendationSituationId = 'hearty';

const RECENT_LIMIT = 3;

/** In-memory session history — survives screen unmount, resets on app process restart. */
let sessionRecentIds: string[] = [];

export function getConvenienceComboSessionRecentIds(): string[] {
  return sessionRecentIds.slice(0, RECENT_LIMIT);
}

export function resetConvenienceComboSessionHistory(): void {
  sessionRecentIds = [];
}

export function recordConvenienceComboSessionRecommendation(id: string): void {
  if (!id.trim()) return;
  sessionRecentIds = appendRecentRecommendationId(sessionRecentIds, id);
}

/** Explainable score: HACK_COMBO and production image dominate; favorites are a small boost. */
export function scoreComboForRecommendation(
  combo: ConvenienceCombo,
  favoriteIds: Set<string>,
): number {
  let score = 0;
  if (combo.comboKind === 'hack_combo') score += 100;
  if (combo.imageKey) score += 50;
  if (favoriteIds.has(combo.id)) score += 5;
  return score;
}

export function listCandidatesForSituation(
  situationId: RecommendationSituationId,
): ConvenienceCombo[] {
  const matched = filterConvenienceCombos({ situationFilter: situationId });
  if (matched.length > 0) return matched;
  return listAllConvenienceCombos();
}

function sortCandidates(
  combos: ConvenienceCombo[],
  favoriteIds: Set<string>,
): ConvenienceCombo[] {
  return [...combos]
    .map((combo, index) => ({
      combo,
      index,
      score: scoreComboForRecommendation(combo, favoriteIds),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map((row) => row.combo);
}

export function pickPrimaryRecommendation(
  situationId: RecommendationSituationId,
  excludeIds: string[],
  favoriteIds: Set<string>,
): ConvenienceCombo | null {
  const candidates = listCandidatesForSituation(situationId);
  if (candidates.length === 0) return null;
  const sorted = sortCandidates(candidates, favoriteIds);
  const excludeSet = new Set(excludeIds);
  const picked = sorted.find((combo) => !excludeSet.has(combo.id));
  return picked ?? sorted[0]!;
}

export function pickNextRecommendation(
  situationId: RecommendationSituationId,
  currentId: string,
  recentIds: string[],
  favoriteIds: Set<string>,
): ConvenienceCombo | null {
  const candidates = listCandidatesForSituation(situationId);
  if (candidates.length === 0) return null;
  const sorted = sortCandidates(candidates, favoriteIds);
  const excludeSet = new Set([currentId, ...recentIds.slice(0, RECENT_LIMIT)]);
  const next = sorted.find((combo) => !excludeSet.has(combo.id));
  if (next) return next;
  const notCurrent = sorted.find((combo) => combo.id !== currentId);
  return notCurrent ?? sorted[0]!;
}

export function pickAlternateRecommendations(
  situationId: RecommendationSituationId,
  currentId: string,
  favoriteIds: Set<string>,
  limit = 3,
  extraExcludeIds: string[] = [],
): ConvenienceCombo[] {
  const excludeSet = new Set([currentId, ...extraExcludeIds]);
  const candidates = listCandidatesForSituation(situationId).filter(
    (combo) => !excludeSet.has(combo.id),
  );
  const sorted = sortCandidates(candidates, favoriteIds);
  if (sorted.length >= limit) return sorted.slice(0, limit);
  const fallback = listCandidatesForSituation(situationId).filter(
    (combo) => combo.id !== currentId,
  );
  return sortCandidates(fallback, favoriteIds).slice(0, limit);
}

/**
 * Screen entry pick: same eligibility/scoring, rotate away from session-recent IDs.
 * Records the chosen id in session history.
 */
export function pickEntryRecommendation(
  situationId: RecommendationSituationId,
  favoriteIds: Set<string>,
): ConvenienceCombo | null {
  const picked = pickPrimaryRecommendation(
    situationId,
    getConvenienceComboSessionRecentIds(),
    favoriteIds,
  );
  if (picked) {
    recordConvenienceComboSessionRecommendation(picked.id);
  }
  return picked;
}

export function buildRecommendationReason(situationId: RecommendationSituationId): string {
  const reasons: Record<RecommendationSituationId, string> = {
    hearty: '매콤하고 든든한 한 끼가 필요할 때 잘 어울려요.',
    budget: '5분 안에 만들 수 있는 가성비 조합이에요.',
    lateNight: '늦은 밤 부담 없이 먹기 좋은 조합이에요.',
    spicy: '매콤한 맛이 당길 때 잘 맞는 조합이에요.',
    light: '부담 없이 가볍게 먹고 싶을 때 잘 어울려요.',
    protein: '단백질을 채우고 싶을 때 좋은 조합이에요.',
    dessert: '식사 후 달콤하게 마무리하고 싶을 때 추천해요.',
    hangover: '속이 편안하게 해장하고 싶을 때 잘 맞아요.',
  };
  return reasons[situationId];
}

export function trimRecentRecommendationIds(ids: string[]): string[] {
  return ids.slice(0, RECENT_LIMIT);
}

export function appendRecentRecommendationId(recentIds: string[], id: string): string[] {
  const without = recentIds.filter((entry) => entry !== id);
  return trimRecentRecommendationIds([id, ...without]);
}
