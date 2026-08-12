/**
 * Production batch: generate ONLY missing review heroes (batch of 20).
 * Never regenerates approved. Review only. No auto-approve.
 */
import fs from 'node:fs';
import path from 'node:path';
import { listHankkiRecipes } from '../../../data/recipes/hankkiRecipes';
import { loadImageQueue } from '../../image-factory/buildImageQueue';
import { PATHS } from '../../image-factory/config';
import { runHeroGenerate } from '../../image-factory/runGenerate';
import { loadDashboardState } from '../../image-factory/review-dashboard/dashboardState';
import {
  archiveHeroReviewsInRange,
  getScaleProgress,
  recordBatchTiming,
} from '../scaleProgress';

const BATCH = 20;
const COST_PER = 0.04; // estimated USD per Gemini hero

function isApproved(recipeId: string, heroImageKey: string): boolean {
  const q = loadImageQueue();
  const item = q?.items.find((i) => i.recipeId === recipeId);
  const dash = loadDashboardState().recipes[recipeId];
  let metaStatus: string | undefined;
  const metaPath = path.join(PATHS.reviewDir, heroImageKey, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      metaStatus = (
        JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { status?: string }
      ).status;
    } catch {
      /* ignore */
    }
  }
  return (
    item?.status === 'approved' ||
    dash?.reviewStatus === 'approved' ||
    metaStatus === 'approved'
  );
}

function hasReview(recipeId: string, heroImageKey: string): boolean {
  return fs.existsSync(
    path.join(PATHS.reviewDir, `${recipeId}-${heroImageKey}.jpg`),
  );
}

async function main(): Promise<void> {
  const recipes = listHankkiRecipes().slice(0, 100);

  let approvedCount = 0;
  const missing: string[] = [];
  for (const r of recipes) {
    if (isApproved(r.id, r.heroImageKey)) {
      approvedCount += 1;
      continue;
    }
    if (!hasReview(r.id, r.heroImageKey)) {
      missing.push(r.id);
    }
  }

  const batchIds = missing.slice(0, BATCH);
  console.log(
    JSON.stringify(
      {
        approvedBefore: approvedCount,
        missingBefore: missing.length,
        batchIds,
      },
      null,
      2,
    ),
  );

  if (batchIds.length === 0) {
    const progress = getScaleProgress();
    console.log(
      JSON.stringify({
        written: 0,
        approvedAfter: approvedCount,
        remaining: 0,
        progress,
      }),
    );
    return;
  }

  const started = Date.now();
  const result = await runHeroGenerate({
    recipeIds: batchIds,
    force: true, // allow review write even if category production exists
    resume: true,
    skipReviewHtml: false,
  });
  const elapsed = (Date.now() - started) / 1000;
  recordBatchTiming({
    lane: 'hero',
    count: Math.max(1, result.written),
    elapsedSeconds: elapsed,
  });

  const fromId = batchIds[0];
  const toId = batchIds[batchIds.length - 1];
  archiveHeroReviewsInRange(fromId, toId);

  // recount
  let approvedAfter = 0;
  let stillMissing = 0;
  let withReview = 0;
  for (const r of listHankkiRecipes().slice(0, 100)) {
    if (isApproved(r.id, r.heroImageKey)) {
      approvedAfter += 1;
      continue;
    }
    if (hasReview(r.id, r.heroImageKey)) withReview += 1;
    else stillMissing += 1;
  }

  const progress = getScaleProgress();
  const remainingToApprove = 100 - approvedAfter;
  const remainingToGenerate = stillMissing;
  const etaSeconds = progress.heroes.etaSeconds;

  console.log('REPORT_START');
  console.log(
    JSON.stringify({
      approvedHeroImages: approvedAfter,
      generatedThisBatch: result.written,
      failed: result.failed,
      remainingGenerate: remainingToGenerate,
      remainingApprove: remainingToApprove,
      withReviewUnapproved: withReview,
      estimatedRemainingCostUsd: Number(
        (remainingToGenerate * COST_PER).toFixed(2),
      ),
      estimatedRemainingTime: progress.heroes.etaLabel,
      etaSeconds,
      batchIds,
      elapsedSeconds: Number(elapsed.toFixed(1)),
      providerStatus: result.providerStatus,
      ok: result.failed === 0 && result.written === batchIds.length,
    }),
  );
  console.log('REPORT_END');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
