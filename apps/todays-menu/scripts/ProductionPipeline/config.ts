/**
 * Sprint AUTO-1 — Production Pipeline paths (developer automation).
 */
import path from 'node:path';

export const APP_ROOT = path.resolve(__dirname, '../..');

export const PIPELINE_PATHS = {
  appRoot: APP_ROOT,
  outRoot: path.join(APP_ROOT, 'generated/production-pipeline'),
  dashboard: path.join(APP_ROOT, 'generated/production-pipeline/production-dashboard.md'),
  report: path.join(APP_ROOT, 'generated/production-pipeline/production-report.md'),
  /** Tracked copies next to the engine (generated/ is gitignored). */
  dashboardTracked: path.join(
    APP_ROOT,
    'scripts/ProductionPipeline/production-dashboard.md',
  ),
  reportTracked: path.join(
    APP_ROOT,
    'scripts/ProductionPipeline/production-report.md',
  ),
  ingredientQueue: path.join(
    APP_ROOT,
    'generated/production-pipeline/ingredient-queue.json',
  ),
  stepQueue: path.join(APP_ROOT, 'generated/production-pipeline/step-queue.json'),
  state: path.join(APP_ROOT, 'generated/production-pipeline/pipeline-state.json'),
  mealsDir: path.join(APP_ROOT, 'assets/meals'),
  ingredientsDir: path.join(APP_ROOT, 'assets/ingredients'),
  stepsDir: path.join(APP_ROOT, 'assets/recipe-steps'),
  mealRegistry: path.join(APP_ROOT, 'services/images/mealImageAssets.ts'),
  ingredientRegistry: path.join(
    APP_ROOT,
    'services/images/ingredientImageAssets.ts',
  ),
  stepRegistry: path.join(APP_ROOT, 'services/images/recipeStepImageAssets.ts'),
} as const;
