/**
 * Sprint STEP-1 — Cooking Step Image Factory paths.
 */
import path from 'node:path';

export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  stepsDir: path.join(APP_ROOT, 'assets/recipe-steps'),
  stepRegistry: path.join(
    APP_ROOT,
    'services/images/recipeStepImageAssets.ts',
  ),
  generatedRoot: path.join(APP_ROOT, 'generated/step-image-factory'),
  manifest: path.join(
    APP_ROOT,
    'generated/step-image-factory/step-images.json',
  ),
  imageQueue: path.join(
    APP_ROOT,
    'generated/step-image-factory/image-queue.json',
  ),
  promptsDir: path.join(APP_ROOT, 'generated/step-image-factory/prompts'),
  reviewDir: path.join(APP_ROOT, 'generated/step-image-factory/review'),
  reviewIndex: path.join(
    APP_ROOT,
    'generated/step-image-factory/review/index.html',
  ),
  dashboard: path.join(APP_ROOT, 'generated/step-image-factory/dashboard.md'),
  report: path.join(APP_ROOT, 'generated/step-image-factory/STEP-1_Report.md'),
} as const;

export const STEP_IMAGE_SPEC = {
  extension: 'jpg' as const,
  width: 1280,
  height: 720,
  format: 'jpg' as const,
  aspect: '16:9' as const,
};

export const DEFAULT_BATCH_SIZE = 5;
export const DEFAULT_CONCURRENCY = 2;

/** First five-image smoke test keys. */
export const STEP1_TEST_KEYS = [
  'kimchi_stew_step_01',
  'kimchi_stew_step_02',
  'kimchi_stew_step_03',
  'kimchi_stew_step_04',
  'jaeyuk_step_01',
] as const;
