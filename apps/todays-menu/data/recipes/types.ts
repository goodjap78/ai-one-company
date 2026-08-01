/**
 * Sprint H3-3 / R3 / R6-1 / R8 — scalable HANKKI recipe content schema.
 *
 * Content / catalog shape for recipe data under `data/recipes/`.
 * Compatible with CoreRecipe / UI Recipe via adapters.
 */

import type { RecipeDecisionTags } from './decisionTypes';
import type { RecipeStandardMetadata } from './recipeStandardMetadataTypes';
import type { CollectionId } from '../content/types/contentBase';

export type {
  DecisionBudget,
  DecisionDifficulty,
  DecisionMealTime,
  DecisionMood,
  DecisionSeason,
  DecisionSituation,
  DecisionTimeRequired,
  DecisionWeather,
  RecipeDecisionInput,
  RecipeDecisionTags,
} from './decisionTypes';

/** Ingredient line with classification tags (protein, veg, seasoning, …). */
export interface RecipeIngredient {
  name: string;
  amount: string;
  tags: string[];
  /** Sprint R3/R6 — static icon registry key (`ingredientImageAssets`). Required in production. */
  iconKey: string;
  /** Sprint R3/R6 — section group. Required in production. */
  group: 'main' | 'sub' | 'seasoning';
}

/** Estimated nutrition per serving. */
export interface RecipeNutrition {
  calorie: number;
  protein: number;
  carbohydrate: number;
  fat: number;
}

/**
 * Sprint R6-1 — rich cooking step (production).
 * Legacy string steps are no longer accepted in HANKKI production DB.
 */
export type RecipeStepContent = {
  /** Step title shown above instruction. */
  title: string;
  instruction: string;
  imageKey: string;
  tip: string;
  /**
   * @deprecated Prefer `title`. Kept temporarily for transitional adapters.
   */
  guide?: string;
};

/** Nested cooking body. */
export interface RecipeBody {
  steps: RecipeStepContent[];
}

/**
 * Scalable HANKKI recipe record (content schema) — Sprint R6-1 / R8.
 *
 * Field mapping (Batch 01 brief → this interface):
 * - title → `name`
 * - cookingTime → `time`
 * - servings → `serving`
 * - calories → `nutrition.calorie`
 * - recommendation tags → `tags`
 * - situation tags → `situation` (legacy Korean free-form; keep for Home)
 * - AI tags → `aiTags`
 * - Sprint R8 decision layer → `decisionTags`, `recommendationReasons`,
 *   `searchTags`, `recommendationPriority`
 */
export interface Recipe {
  id: string;
  /** Display title (Batch 01: title). */
  name: string;
  category: string[];
  mealType: string[];
  /** Cook time in minutes (Batch 01: cookingTime). */
  time: number;
  difficulty: string;
  /** Number of servings (Batch 01: servings). */
  serving: number;
  ingredients: RecipeIngredient[];
  /** Includes calories via `nutrition.calorie`. */
  nutrition: RecipeNutrition;
  /** Recommendation / product tags. */
  tags: string[];
  /**
   * Legacy Korean situation lines (Home confidence copy).
   * Structured decision situations live under `decisionTags.situation`.
   */
  situation: string[];
  /** AI recommendation tags. */
  aiTags: string[];
  /** Image path (e.g. `assets/meals/bibimbap.jpg`). */
  image: string;
  /** Meal hero key (filename without extension). */
  heroImageKey: string;
  /** Seed tip lines — production requires at least 4 (Batch 01 uses 5). */
  recommendationMessages: string[];
  /**
   * Optional fixed Seed hero line for Recipe Detail.
   * When omitted, a message is picked from recommendationMessages.
   */
  heroMascotMessage?: string;
  recipe: RecipeBody;

  // ——— Sprint R8 — Decision Recipe Database ———
  /** Structured tags for meal-decision matching. */
  decisionTags: RecipeDecisionTags;
  /** Exactly 3 AI-facing recommendation reasons. */
  recommendationReasons: string[];
  /** Korean search / filter tags. */
  searchTags: string[];
  /** 1–100; higher = recommend more often (data layer only). */
  recommendationPriority: number;

  // ——— Sprint 25 — Standardized recommendation metadata ———
  /**
   * Structured tags for AI filtering / scoring (parallel to legacy free-form fields).
   * Attached via `createHankkiRecipe` — do not hand-author in batch files.
   */
  standardMetadata: RecipeStandardMetadata;

  // ——— Sprint 46-B — Content catalog ———
  contentType: 'recipe';
  collectionIds: CollectionId[];
}
