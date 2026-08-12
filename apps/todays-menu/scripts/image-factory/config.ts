/**
 * Sprint IMG-1 / IMG-2 — paths for Hero Image Factory (developer automation).
 */
import path from 'node:path';

/** App root = apps/todays-menu */
export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  envFile: path.join(APP_ROOT, '.env'),
  mealAssetsDir: path.join(APP_ROOT, 'assets/meals'),
  mealRegistry: path.join(APP_ROOT, 'services/images/mealImageAssets.ts'),
  mealTypes: path.join(APP_ROOT, 'services/images/mealImageTypes.ts'),
  generatedRoot: path.join(APP_ROOT, 'generated/image-factory'),
  promptsDir: path.join(APP_ROOT, 'generated/image-factory/prompts'),
  heroManifest: path.join(APP_ROOT, 'generated/image-factory/hero-images.json'),
  imageQueue: path.join(APP_ROOT, 'generated/image-factory/image-queue.json'),
  reviewDir: path.join(APP_ROOT, 'generated/image-factory/review'),
  reviewIndex: path.join(APP_ROOT, 'generated/image-factory/review/index.html'),
  dashboard: path.join(APP_ROOT, 'generated/image-factory/dashboard.md'),
  /** Pre-overwrite production backups for hero:rollback (IMG-4). */
  backupsDir: path.join(APP_ROOT, 'generated/image-factory/backups'),
} as const;

export const HERO_IMAGE_EXTENSION = 'jpg' as const;

/** Production heroes must meet this after real generation (mock may fail size checks). */
export const HERO_SIZE_EXPECT = {
  width: 1344,
  height: 768,
  minWidth: 1344,
  minHeight: 768,
  aspectHint: '16:9' as const,
};
