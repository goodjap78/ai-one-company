/**
 * Sprint A1 — Recipe asset automation types (developer tool only).
 */

export type AssetKind = 'ingredient' | 'step';

export type CliMode = 'check' | 'dry' | 'generate' | 'validate';

export type CliOptions = {
  mode: CliMode;
  recipeIds: string[] | null;
  /** When set (e.g. `02`), filters to that batch's recipe ids. */
  batch: string | null;
  force: boolean;
};

export type RecipeIngredientRef = {
  name: string;
  iconKey: string;
  group: 'main' | 'sub' | 'seasoning' | 'unknown';
};

export type RecipeStepRef = {
  order: number;
  title: string;
  instruction: string;
  imageKey: string;
  tip?: string;
};

export type ScannedRecipe = {
  id: string;
  name: string;
  heroImagePath: string;
  heroImageKey: string;
  /** Unique by iconKey */
  ingredients: RecipeIngredientRef[];
  steps: RecipeStepRef[];
};

export type IngredientAssetEntry = {
  kind: 'ingredient';
  iconKey: string;
  names: string[];
  group: RecipeIngredientRef['group'];
  filename: string;
  relativePath: string;
  absolutePath: string;
  fileExists: boolean;
  registryHasKey: boolean;
  prompt: string;
  usedByRecipeIds: string[];
};

export type StepAssetEntry = {
  kind: 'step';
  imageKey: string;
  recipeId: string;
  recipeName: string;
  order: number;
  title: string;
  instruction: string;
  filename: string;
  relativePath: string;
  absolutePath: string;
  fileExists: boolean;
  registryHasKey: boolean;
  prompt: string;
  visibleIngredients: string[];
  notYetIngredients: string[];
};

export type AssetManifest = {
  generatedAt: string;
  recipeIds: string[];
  ingredients: IngredientAssetEntry[];
  steps: StepAssetEntry[];
  duplicates: string[];
  invalidKeys: string[];
  summary: {
    ingredientTotal: number;
    ingredientExisting: number;
    ingredientMissing: number;
    stepTotal: number;
    stepExisting: number;
    stepMissing: number;
  };
};

export type ImageGenerateRequest = {
  prompt: string;
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'jpeg';
  outputPath: string;
};

export type ImageGenerateResult = {
  status: 'created' | 'skipped' | 'failed' | 'disabled';
  outputPath?: string;
  error?: string;
};

export type ValidationVerdict = 'PASS' | 'FAIL';

export type AssetValidationRow = {
  kind: AssetKind;
  key: string;
  recipeId?: string;
  checks: {
    name: string;
    verdict: ValidationVerdict;
    detail?: string;
  }[];
  verdict: ValidationVerdict;
};

export type RunReport = {
  mode: CliMode;
  createdFiles: string[];
  skippedFiles: string[];
  missingAssets: string[];
  updatedMappingFiles: string[];
  errors: string[];
  providerStatus: string;
  validation?: AssetValidationRow[];
};
