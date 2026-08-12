import type { AiRecommendationReason } from '../utils/recommendationDisplayReason';
import type { MealStyle } from './mealStyle';

/**
 * Meal Experience Engine v1.0 — what HANKKI recommends.
 * Answers: "What meal should I have today?" — not "How do I cook?"
 */
export type MealExperienceMeal = {
  id: string;
  title: string;
  subtitle: string;
  mealStyle: MealStyle;
};

export type MealExperienceReason = {
  /** Primary one-line reason shown on Home */
  summary: string;
  /** Structured explainable signals (weather, preference, etc.) */
  signals: AiRecommendationReason[];
};

export type MealExperienceContext = {
  /** Human-readable experience label, e.g. "Warm family dinner" */
  label: string;
  /** Korean display copy for the experience moment */
  labelKo: string;
};

export type MealExperiencePairing = {
  name: string;
  /** Catalog menu id when paired item exists in database */
  menuId?: string;
};

export type MealExperienceRecommendation = {
  meal: MealExperienceMeal;
  reason: MealExperienceReason;
  experience: MealExperienceContext;
  suggestedPairings: MealExperiencePairing[];
};
