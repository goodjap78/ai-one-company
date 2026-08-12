import type { ImageSourcePropType } from 'react-native';
import type { Difficulty, MealMode } from './home';
import type { MealCourseType } from './mealCourse';
import type { MealTimeSlot } from './mealTime';
import type { RecipeTagId } from '../recipes/types';

export type RecipeReturnTo = 'recommendation' | 'confirmed' | 'default';
export type RecipeFocus = 'steps' | 'none';

/** Sprint R2 — ingredient section group for Recipe Detail + future DB automation. */
export type RecipeIngredientGroup = 'main' | 'sub' | 'seasoning';

export type RecipeImage = {
  emoji: string;
  /** Production / CDN URL — takes priority over `source` when loadable */
  url?: string | null;
  /** Bundled local asset from the meal image registry */
  source?: ImageSourcePropType;
  accessibilityLabel?: string;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
  optional?: boolean;
  /** Free-form tags from content schema (주재료 / 양념 / …). */
  tags?: string[];
  /** Sprint 45.5 — IIE canonical name. */
  canonicalName?: string;
  ingredientId?: string | null;
  /**
   * Sprint R2/R5-2 — optional registry key for ingredient icons.
   * When omitted, `resolveIngredientIcon` maps from `name` via aliases.
   * Do not require() assets in UI.
   */
  iconKey?: string | null;
  /** Sprint R2 — preferred group; inferred when omitted (backward compatible). */
  group?: RecipeIngredientGroup;
};

export type RecipeStep = {
  order: number;
  guide: string;
  instruction: string;
  /** @deprecated Prefer `imageKey` for future automation. Kept for legacy gold meals. */
  imageEmoji?: string | null;
  /**
   * Sprint R2 — registry key for step photos.
   * Resolve via `resolveStepImageSource(imageKey)` — omit UI when unresolved.
   */
  imageKey?: string | null;
  /** Sprint R2 — optional tip shown under the step instruction. */
  tip?: string | null;
};

/**
 * Product Decision #002 — canonical HANKKI recipe model.
 * UI-facing screens read from this object; never hardcode recipe content in components.
 */
export type Recipe = {
  id: string;
  title: string;
  type: MealCourseType;
  mealTime: MealTimeSlot[];
  cookTime: number;
  difficulty: Difficulty;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: RecipeTagId[];
  recommendedSides?: string[];
  image: RecipeImage;
  /**
   * Sprint R2 — future hero image registry key.
   * When set, prefer resolving via meal image map; falls back to `image`.
   */
  heroImageKey?: string | null;
  aiReason: string;
  /** Runtime context — not part of PD#002 recommendation card. */
  mode: MealMode;
  servings: number;
  description: string;
  tip: string;
  /**
   * Sprint R3 — Seed line inside hero (optional).
   * Falls back to recommendationMessages / session seed tip when omitted.
   */
  heroMascotMessage?: string | null;
  /** Optional pool used when picking a Seed hero message. */
  recommendationMessages?: string[];
  slug?: string;
};

/** @deprecated Use `Recipe` */
export type RecipeDetail = Recipe;
