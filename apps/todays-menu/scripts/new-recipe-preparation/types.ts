import type { Recipe } from '../../data/recipes/types';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ConsistencyFinding = {
  recipeId: string;
  recipeName: string;
  code: string;
  severity: Severity;
  issue: string;
};

export type PipelineArgs = {
  dryRun: boolean;
  since: string | null;
  ids: string[] | null;
  fullCatalog: boolean;
};

export type ScopeMode = 'ids' | 'since' | 'full';

export type PipelineScope = {
  mode: ScopeMode;
  label: string;
  recipes: Recipe[];
  recipeIds: string[];
};

export type HeroAuditRow = {
  recipeId: string;
  heroImageKey: string;
  fileExists: boolean;
  inRegistry: boolean;
  magic: 'jpeg' | 'png' | 'other';
  width: number | null;
  height: number | null;
  bytes: number;
  needsOptimize: boolean;
  missing: boolean;
};

export type StepAuditRow = {
  recipeId: string;
  imageKey: string;
  fileExists: boolean;
  inRegistry: boolean;
  registryRequiresFile: boolean;
  magic: 'jpeg' | 'png' | 'other' | 'none';
  width: number | null;
  height: number | null;
  bytes: number;
  needsOptimize: boolean;
  missing: boolean;
};

export type ImageChangePlan = {
  path: string;
  kind: 'hero' | 'step';
  action: 'skip_ok' | 'normalize' | 'missing';
  beforeBytes: number;
  afterBytes?: number;
};

export type TestResult = {
  name: string;
  script: string;
  exitCode: number;
  passed: boolean;
};

export type PreparationReport = {
  generatedAt: string;
  dryRun: boolean;
  scope: {
    mode: ScopeMode;
    label: string;
    recipesChecked: number;
  };
  consistency: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    findings: ConsistencyFinding[];
  };
  audience: {
    babyChecked: number;
    toddlerChecked: number;
    elementaryChecked: number;
    blockers: string[];
  };
  hero: {
    found: number;
    optimized: number;
    missing: number;
    planned: ImageChangePlan[];
  };
  step: {
    found: number;
    optimized: number;
    missing: number;
    planned: ImageChangePlan[];
  };
  registrySync: {
    mealsUpdated: boolean;
    stepsUpdated: boolean;
    dryRun: boolean;
  };
  imageSize: {
    mealsBefore: number;
    mealsAfter: number;
    stepsBefore: number;
    stepsAfter: number;
    savedBytes: number;
    scopedHeroAvgBefore: number | null;
    scopedHeroAvgAfter: number | null;
    scopedStepAvgBefore: number | null;
    scopedStepAvgAfter: number | null;
  };
  tests: TestResult[];
  warnings: string[];
  blockers: string[];
  pipelineResult: 'PASS' | 'FAIL';
};
