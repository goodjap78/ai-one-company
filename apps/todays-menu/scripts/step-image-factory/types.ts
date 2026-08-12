/**
 * Sprint STEP-1 — shared types.
 */

export type StepAssetStatus =
  | 'approved'
  | 'existing_unregistered'
  | 'queued'
  | 'missing'
  | 'failed'
  | 'completed'
  | 'rejected'
  | 'processing';

export type StepManifestEntry = {
  recipeId: string;
  recipeName: string;
  stepOrder: number;
  stepTitle: string;
  stepInstruction: string;
  imageKey: string;
  outputFilename: string;
  promptFile: string;
  status: StepAssetStatus;
  visibleIngredients: string[];
  notYetIngredients: string[];
  fileExists: boolean;
  registryHasKey: boolean;
};

export type StepManifest = {
  generatedAt: string;
  sprint: 'STEP-1';
  fromId: string;
  toId: string;
  recipeCount: number;
  totalSteps: number;
  items: StepManifestEntry[];
};

export type StepQueueItem = {
  recipeId: string;
  recipeName: string;
  stepOrder: number;
  stepTitle: string;
  stepInstruction: string;
  imageKey: string;
  outputFilename: string;
  promptFile: string;
  status: StepAssetStatus;
  visibleIngredients: string[];
  notYetIngredients: string[];
  updatedAt: string;
  error?: string;
  candidateFile?: string;
};

export type StepQueueFile = {
  generatedAt: string;
  sprint: 'STEP-1';
  fromId: string;
  toId: string;
  providerHint: string;
  missingOnly?: boolean;
  totals: {
    total: number;
    approved: number;
    existing_unregistered: number;
    queued: number;
    missing: number;
    completed: number;
    failed: number;
    rejected: number;
    processing: number;
  };
  items: StepQueueItem[];
};
