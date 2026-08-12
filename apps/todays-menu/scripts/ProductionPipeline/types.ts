/**
 * Sprint AUTO-1 — Production pipeline shared types.
 */

export type QueueStatus = 'queued' | 'ready' | 'missing' | 'registered';

export type IngredientQueueItem = {
  iconKey: string;
  filename: string;
  names: string[];
  usedByRecipeIds: string[];
  status: QueueStatus;
  relativePath: string;
};

export type StepQueueItem = {
  recipeId: string;
  recipeName: string;
  order: number;
  imageKey: string;
  filename: string;
  title: string;
  status: QueueStatus;
  relativePath: string;
};

export type PipelineStats = {
  recipes: number;
  heroPresent: number;
  heroMissing: number;
  ingredientPresent: number;
  ingredientMissing: number;
  stepPresent: number;
  stepMissing: number;
  readyRecipes: number;
  progressPercent: number;
};

export type PipelineValidation = {
  ok: boolean;
  duplicateIds: string[];
  duplicateNames: string[];
  duplicateHeroKeys: string[];
  duplicateIngredientKeys: string[];
  duplicateStepKeys: string[];
  missingHeroImages: string[];
  missingIngredientIcons: string[];
  missingStepImages: string[];
  brokenRegistryKeys: string[];
  brokenReferences: string[];
  recipeIssues: number;
  issues: string[];
};

export type PipelineState = {
  generatedAt: string;
  sprint: 'AUTO-1';
  stats: PipelineStats;
  validation: PipelineValidation;
  lastModules: {
    recipe?: string;
    hero?: string;
    ingredients?: string;
    steps?: string;
    registry?: string;
    validate?: string;
  };
};
