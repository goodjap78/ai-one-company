/**
 * Hero Queue Generator — build image-queue.json (awaiting review / assets).
 * No AI generation.
 */
import path from 'node:path';
import {
  buildImageQueue,
  writeImageQueue,
} from '../../image-factory/buildImageQueue';
import { PATHS as HERO_PATHS } from '../../image-factory/config';
import { writeReviewIndexHtml } from '../../image-factory/writeReviewHtml';

export type HeroQueueResult = {
  queuePath: string;
  totals: {
    recipes: number;
    queued: number;
    approved: number;
    completed: number;
    failed: number;
    rejected: number;
  };
  reviewHtml: string;
};

export function runHeroQueueGenerator(): HeroQueueResult {
  const queue = buildImageQueue({
    providerHint: process.env.IMAGE_PROVIDER ?? 'disabled',
  });
  const queuePath = writeImageQueue(queue);
  const reviewHtml = writeReviewIndexHtml(queue);

  return {
    queuePath,
    totals: {
      recipes: queue.totals.recipes,
      queued: queue.totals.queued,
      approved: queue.totals.approved,
      completed: queue.totals.completed,
      failed: queue.totals.failed,
      rejected: queue.totals.rejected,
    },
    reviewHtml,
  };
}

export function heroQueueAbsolute(): string {
  return HERO_PATHS.imageQueue;
}

export function relativeHeroQueue(): string {
  return path.relative(HERO_PATHS.appRoot, HERO_PATHS.imageQueue);
}
