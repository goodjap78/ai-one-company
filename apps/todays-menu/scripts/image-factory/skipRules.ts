/**
 * Sprint IMG-3 — skip rules for hero generation (001–050 batch).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { ImageQueueItem } from './queueTypes';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';

export type SkipDecision =
  | { skip: false }
  | { skip: true; reason: string };

function productionExists(heroImageKey: string): boolean {
  const abs = path.join(PATHS.mealAssetsDir, `${heroImageKey}.jpg`);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

/**
 * Skip approved / valid existing production / completed (awaiting review).
 * Resume keeps processing queued + failed (+ stuck processing).
 *
 * `allowReviewRegen` — targeted `--recipe=` runs may write a new *review*
 * candidate even when production already exists (never touches assets until approve).
 */
export function shouldSkipHeroGenerate(
  item: ImageQueueItem,
  options: {
    force?: boolean;
    resume?: boolean;
    allowReviewRegen?: boolean;
  } = {},
): SkipDecision {
  if (options.force) return { skip: false };

  if (item.status === 'completed') {
    return { skip: true, reason: 'awaiting review (completed)' };
  }
  if (item.status === 'rejected') {
    return { skip: true, reason: 'rejected (use regenerate)' };
  }

  if (options.allowReviewRegen) {
    if (item.status === 'processing' && !options.resume) {
      return { skip: true, reason: 'processing (use --resume)' };
    }
    return { skip: false };
  }

  if (item.status === 'approved') {
    return { skip: true, reason: 'approved' };
  }

  // Valid existing production + registry = treat as already shipped
  if (productionExists(item.heroImageKey)) {
    try {
      const registered = new Set(parseRegisteredMealKeys());
      if (registered.has(item.heroImageKey)) {
        return { skip: true, reason: 'existing production + registry' };
      }
    } catch {
      // ignore parse errors — still skip bare production file without force
      return { skip: true, reason: 'existing production file' };
    }
    return { skip: true, reason: 'existing production file' };
  }

  if (item.status === 'queued' || item.status === 'failed') {
    return { skip: false };
  }
  if (item.status === 'processing' && options.resume) {
    return { skip: false };
  }
  if (item.status === 'processing') {
    return { skip: true, reason: 'processing (use --resume)' };
  }

  return { skip: true, reason: `status=${item.status}` };
}
