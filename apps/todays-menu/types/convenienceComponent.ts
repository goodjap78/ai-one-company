/**
 * Convenience store combo component catalog types.
 */
import type { ConvenienceIllustrationIconKey } from './convenienceIllustrationIcon';

export const CONVENIENCE_COMPONENT_CATEGORIES = [
  'beverage',
  'snack',
  'rice_dish',
  'noodle',
  'protein',
  'dairy',
  'fruit',
  'vegetable',
  'sauce',
  'dessert',
  'soup',
  'other',
] as const;

export type ConvenienceComponentCategory =
  (typeof CONVENIENCE_COMPONENT_CATEGORIES)[number];

export type ConvenienceComponentEntry = {
  /** Canonical key for catalog entry. */
  key: string;
  /** Default Korean display label. */
  label: string;
  /** Raw combo item names that resolve to this key. */
  aliases: string[];
  category: ConvenienceComponentCategory;
  /**
   * Ingredient icon key when semantically exact (legacy metadata).
   */
  reuseIngredientKey?: string;
  /** Production convenience illustration icon (Phase 1 — 10 masters). */
  illustrationIconKey?: ConvenienceIllustrationIconKey;
};
