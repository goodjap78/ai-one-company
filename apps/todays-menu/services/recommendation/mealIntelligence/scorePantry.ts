import type { MenuItem } from '../../../types/recommendation';
import type { RecommendationContext } from '../../../types/preference';

export const PANTRY_MATCH_MAX_BONUS = 18;
export const PANTRY_MEMORY_WEIGHT = 0.7;

export type PantryScoreResult = {
  rawDelta: number;
  notes: string[];
};

function emptyResult(): PantryScoreResult {
  return { rawDelta: 0, notes: [] };
}

/** Sprint 45 — prefer meals that use ingredients already in the pantry. */
export function scorePantry(menu: MenuItem, context?: RecommendationContext): PantryScoreResult {
  const match = context?.pantryMatchByMenuId?.[menu.id];
  if (!match || match.requiredCount === 0 || match.matchedCount === 0) {
    return emptyResult();
  }

  const rawBonus = Math.round(match.overlapRatio * PANTRY_MATCH_MAX_BONUS * PANTRY_MEMORY_WEIGHT);
  if (rawBonus <= 0) return emptyResult();

  const notes = ['pantry_ingredient_match'];
  if (match.overlapRatio >= 0.75) notes.push('pantry_high_overlap');
  if (match.overlapRatio >= 1) notes.push('pantry_full_match');

  return {
    rawDelta: rawBonus,
    notes,
  };
}
