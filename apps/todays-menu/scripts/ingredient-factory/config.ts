/**
 * Sprint ING-1 — Ingredient Image Factory paths.
 */
import path from 'node:path';

export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  ingredientsDir: path.join(APP_ROOT, 'assets/ingredients'),
  ingredientRegistry: path.join(
    APP_ROOT,
    'services/images/ingredientImageAssets.ts',
  ),
  generatedRoot: path.join(APP_ROOT, 'generated/ingredient-factory'),
  manifest: path.join(
    APP_ROOT,
    'generated/ingredient-factory/ingredient-images.json',
  ),
  imageQueue: path.join(
    APP_ROOT,
    'generated/ingredient-factory/image-queue.json',
  ),
  promptsDir: path.join(APP_ROOT, 'generated/ingredient-factory/prompts'),
  reviewDir: path.join(APP_ROOT, 'generated/ingredient-factory/review'),
  reviewIndex: path.join(
    APP_ROOT,
    'generated/ingredient-factory/review/index.html',
  ),
  dashboard: path.join(APP_ROOT, 'generated/ingredient-factory/dashboard.md'),
  report: path.join(APP_ROOT, 'generated/ingredient-factory/ING-1_Report.md'),
} as const;

export const INGREDIENT_IMAGE_SPEC = {
  extension: 'png' as const,
  width: 1024,
  height: 1024,
  format: 'png' as const,
};

/** Five-item smoke test before full resume. */
export const ING1_TEST_KEYS = [
  'onion',
  'green_onion',
  'garlic',
  'pork',
  'egg',
] as const;

export const DEFAULT_BATCH_SIZE = 10;
export const DEFAULT_CONCURRENCY = 2;
