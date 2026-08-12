/** Sprint 34–35 — Explainable + warm meal intelligence copy. */

export type ExplanationFactorCategory = 'weather' | 'recentMeals' | 'time';

export type MealExplanationLevel2Reason = {
  category: ExplanationFactorCategory;
  emoji: string;
  label: string;
  text: string;
};

export type MealExplanationLevel3 = {
  /** Internal score band — not shown as a percentage in UI. */
  todayMatchPercent: number;
  rank: number;
  totalCandidates: number;
  /** Sprint 35 — human warmth instead of "추천도 96%" */
  warmMatchLabel: string;
};

export type MealExplanation = {
  /** Level 1 — one-sentence headline */
  level1: string;
  /** Level 2 — weather · recent meals · time */
  level2: MealExplanationLevel2Reason[];
  /** Level 3 — warm confidence (no AI metrics on Home) */
  level3: MealExplanationLevel3;
  /** Sprint 35 — warm sign-off on every recommendation */
  closing: string;
};
