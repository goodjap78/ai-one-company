/**
 * Sprint 48-C — Convenience Combo Image Factory paths.
 */
import path from 'node:path';

export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  comboAssetsDir: path.join(APP_ROOT, 'assets/convenience-combos'),
  comboRegistry: path.join(
    APP_ROOT,
    'services/images/convenienceComboImageAssets.ts',
  ),
  generatedRoot: path.join(APP_ROOT, 'generated/combo-factory'),
  manifest: path.join(APP_ROOT, 'generated/combo-factory/combo-images.json'),
  imageQueue: path.join(APP_ROOT, 'generated/combo-factory/image-queue.json'),
  promptsDir: path.join(APP_ROOT, 'generated/combo-factory/prompts'),
  reviewDir: path.join(APP_ROOT, 'generated/combo-factory/review'),
  reviewIndex: path.join(APP_ROOT, 'generated/combo-factory/review/index.html'),
  dashboard: path.join(APP_ROOT, 'generated/combo-factory/dashboard.md'),
} as const;

/** Matches hero factory 16:9 production spec. */
export const COMBO_IMAGE_SPEC = {
  extension: 'jpg' as const,
  width: 1344,
  height: 768,
  format: 'jpg' as const,
};

export const DEFAULT_BATCH_SIZE = 3;
export const DEFAULT_CONCURRENCY = 1;
