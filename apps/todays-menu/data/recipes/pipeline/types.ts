/**
 * Sprint R7 / R8 — Compact recipe specs for the production pipeline.
 * Expanded to HankkiRecipeInput via scaffoldRecipe.ts
 */
import type { RecipeDecisionInput } from '../decisionTypes';

export type PipelineCuisine =
  | 'korean'
  | 'chinese'
  | 'japanese'
  | 'western'
  | 'snack'
  | 'healthy'
  | 'quick';

export type PipelineIngredientSpec = {
  name: string;
  amount: string;
  iconKey: string;
};

export type RecipeSpec = {
  id: string;
  name: string;
  heroImageKey: string;
  cuisine: PipelineCuisine;
  category: string[];
  mealType: string[];
  time: number;
  difficulty: '쉬움' | '보통' | '어려움';
  serving: number;
  calories: number;
  protein?: number;
  carbohydrate?: number;
  fat?: number;
  mains: PipelineIngredientSpec[];
  subs: PipelineIngredientSpec[];
  seasonings: PipelineIngredientSpec[];
  stepTitles: readonly [string, string, string, string] | readonly [string, string, string, string, string];
  tags: string[];
  situation: string[];
  aiTags: string[];
  /** Optional override; otherwise auto-built from name/tags. */
  recommendationMessages?: string[];
} & RecipeDecisionInput;

export type BatchMeta = {
  batchId: string;
  label: string;
  cuisineFocus: string;
  idStart: number;
  idEnd: number;
  liveInProduction: boolean;
};
