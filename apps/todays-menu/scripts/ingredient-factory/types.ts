/**
 * Sprint ING-1 / ING-2 — shared types.
 */

export type IngredientAssetStatus =
  | 'approved'
  | 'existing_unregistered'
  | 'queued'
  | 'missing'
  | 'failed'
  | 'completed'
  | 'rejected'
  | 'processing';

export type IngredientManifestEntry = {
  iconKey: string;
  koreanName: string;
  aliases: string[];
  usedByRecipeIds: string[];
  outputFilename: string;
  promptFile: string;
  status: IngredientAssetStatus;
  fileExists: boolean;
  registryHasKey: boolean;
};

export type IngredientManifest = {
  generatedAt: string;
  sprint: 'ING-1' | 'ING-2';
  fromId: string;
  toId: string;
  recipeCount: number;
  totalUnique: number;
  reusedCount: number;
  /** Names that had no alias and no explicit iconKey (normalized fallback used). */
  unresolvedAliases: string[];
  items: IngredientManifestEntry[];
};

export type IngredientQueueItem = {
  iconKey: string;
  koreanName: string;
  aliases: string[];
  usedByRecipeIds: string[];
  outputFilename: string;
  promptFile: string;
  status: IngredientAssetStatus;
  updatedAt: string;
  error?: string;
  candidateFile?: string;
};

export type IngredientQueueFile = {
  generatedAt: string;
  sprint: 'ING-1' | 'ING-2';
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
  items: IngredientQueueItem[];
};
