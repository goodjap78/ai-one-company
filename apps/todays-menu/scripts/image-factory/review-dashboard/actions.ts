/**
 * Sprint REVIEW-1 — dashboard actions (approve / reject / regenerate / score).
 * Does NOT touch consumer app UI. Wraps existing hero:approve + hero:generate.
 */
import fs from 'node:fs';
import {
  buildImageQueue,
  loadImageQueue,
  writeImageQueue,
} from '../buildImageQueue';
import { HANKKI_HERO_STYLE_VERSION } from '../engine/buildHeroPrompt';
import { inspectImageFile } from '../engine';
import { runHeroApprove } from '../runApprove';
import { runHeroGenerate } from '../runGenerate';
import { buildHeroFeedbackPromptAppend } from '../heroRegenFeedback';
import { resolveCandidatePath } from '../reviewStore';
import {
  loadDashboardState,
  upsertRecipeState,
  type DashboardReviewStatus,
  type RecipeDashboardState,
} from './dashboardState';
import {
  archiveBytesAsNextVersion,
  archiveCurrentCandidateIfNeeded,
  HISTORY_DIR,
  listVersions,
  promoteVersionToCurrentCandidate,
  type ReviewVersion,
} from './historyStore';

export type DashboardCard = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  reviewStatus: DashboardReviewStatus;
  queueStatus: string;
  generationDate: string | null;
  promptVersion: string;
  resolution: string | null;
  estimatedCostUsd: number | null;
  starScore: number | null;
  pointScore: number | null;
  selectedVersion: number | null;
  approvedVersion: number | null;
  previewUrl: string | null;
  versions: Array<{
    version: number;
    filename: string;
    createdAt: string;
    bytes: number;
    url: string;
  }>;
  inApprovalQueue: boolean;
};

function ensureSeedHistory(
  recipeId: string,
  heroImageKey: string,
): ReviewVersion[] {
  archiveCurrentCandidateIfNeeded(recipeId, heroImageKey);
  return listVersions(recipeId, heroImageKey);
}

export function listDashboardCards(options?: {
  includeRejected?: boolean;
}): DashboardCard[] {
  const includeRejected = options?.includeRejected === true;
  const queue = loadImageQueue() ?? buildImageQueue();
  if (!loadImageQueue()) writeImageQueue(queue);
  const state = loadDashboardState();
  const cards: DashboardCard[] = [];

  for (const item of queue.items) {
    const recipeState = state.recipes[item.recipeId];
    const reviewStatus: DashboardReviewStatus =
      recipeState?.reviewStatus ??
      (item.status === 'approved'
        ? 'approved'
        : item.status === 'rejected'
          ? 'rejected'
          : 'pending_review');

    if (!includeRejected && reviewStatus === 'rejected') continue;

    const versions = ensureSeedHistory(item.recipeId, item.heroImageKey);
    const candidate = resolveCandidatePath(item.recipeId, item.heroImageKey);
    const hasCandidate = fs.existsSync(candidate);
    if (!hasCandidate && versions.length === 0) continue;

    const selectedVersion =
      recipeState?.selectedVersion ??
      (versions.length > 0 ? versions[versions.length - 1].version : null);

    let previewAbs: string | null = null;
    if (selectedVersion != null) {
      const v = versions.find((x) => x.version === selectedVersion);
      if (v && fs.existsSync(v.absolutePath)) previewAbs = v.absolutePath;
    }
    if (!previewAbs && hasCandidate) previewAbs = candidate;

    let resolution: string | null = null;
    let generationDate: string | null = null;
    if (previewAbs) {
      const check = inspectImageFile(previewAbs, {});
      if (check.width && check.height) {
        resolution = `${check.width}×${check.height}`;
      }
      generationDate = fs.statSync(previewAbs).mtime.toISOString();
    }

    cards.push({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      reviewStatus,
      queueStatus: item.status,
      generationDate,
      promptVersion: state.promptVersion || HANKKI_HERO_STYLE_VERSION,
      resolution,
      estimatedCostUsd:
        versions.length > 0 || hasCandidate
          ? state.estimatedCostUsdPerImage
          : null,
      starScore: recipeState?.starScore ?? null,
      pointScore: recipeState?.pointScore ?? null,
      selectedVersion,
      approvedVersion: recipeState?.approvedVersion ?? null,
      previewUrl: previewAbs
        ? selectedVersion != null
          ? `/api/history/${item.recipeId}/${selectedVersion}`
          : `/api/candidate/${item.recipeId}`
        : null,
      versions: versions.map((v) => ({
        version: v.version,
        filename: v.filename,
        createdAt: v.createdAt,
        bytes: v.bytes,
        url: `/api/history/${item.recipeId}/${v.version}`,
      })),
      inApprovalQueue: reviewStatus === 'pending_review',
    });
  }

  return cards.sort((a, b) => a.recipeId.localeCompare(b.recipeId));
}

export function setQualityScore(
  recipeId: string,
  scores: { starScore?: number; pointScore?: number },
): RecipeDashboardState {
  const patch: Partial<RecipeDashboardState> = {};
  if (scores.starScore != null) {
    if (scores.starScore < 1 || scores.starScore > 5) {
      throw new Error('starScore must be 1–5');
    }
    patch.starScore = Math.round(scores.starScore);
  }
  if (scores.pointScore != null) {
    if (scores.pointScore < 0 || scores.pointScore > 100) {
      throw new Error('pointScore must be 0–100');
    }
    patch.pointScore = Math.round(scores.pointScore);
  }
  return upsertRecipeState(recipeId, patch);
}

export function selectVersion(
  recipeId: string,
  version: number,
  heroImageKey?: string,
): RecipeDashboardState {
  const versions = listVersions(recipeId, heroImageKey);
  if (!versions.some((v) => v.version === version)) {
    throw new Error(`Version ${version} not found for ${recipeId}`);
  }
  return upsertRecipeState(recipeId, { selectedVersion: version });
}

export function approveRecipe(
  recipeId: string,
  version?: number,
): {
  ok: boolean;
  message: string;
  promotions: ReturnType<typeof runHeroApprove>['promotions'];
} {
  const queue = loadImageQueue() ?? buildImageQueue();
  const item = queue.items.find((i) => i.recipeId === recipeId);
  if (!item) throw new Error(`Recipe not found: ${recipeId}`);

  const versions = ensureSeedHistory(recipeId, item.heroImageKey);
  const targetVersion =
    version ??
    loadDashboardState().recipes[recipeId]?.selectedVersion ??
    (versions.length > 0 ? versions[versions.length - 1].version : null);

  if (targetVersion == null) {
    throw new Error(`No review image/version for ${recipeId}`);
  }

  promoteVersionToCurrentCandidate(
    recipeId,
    item.heroImageKey,
    targetVersion,
  );

  const result = runHeroApprove({
    decision: 'approve',
    recipeId,
    force: true,
  });

  if (result.failed.includes(recipeId) || result.promoted.length === 0) {
    return {
      ok: false,
      message: `Approve failed for ${recipeId}`,
      promotions: result.promotions,
    };
  }

  upsertRecipeState(recipeId, {
    reviewStatus: 'approved',
    selectedVersion: targetVersion,
    approvedVersion: targetVersion,
  });

  return {
    ok: true,
    message: `Approved ${recipeId} v${targetVersion} → production`,
    promotions: result.promotions,
  };
}

export function rejectRecipe(recipeId: string): {
  ok: boolean;
  message: string;
} {
  const queue = loadImageQueue() ?? buildImageQueue();
  const item = queue.items.find((i) => i.recipeId === recipeId);
  if (!item) throw new Error(`Recipe not found: ${recipeId}`);

  // Keep history — never delete
  ensureSeedHistory(recipeId, item.heroImageKey);

  runHeroApprove({
    decision: 'reject',
    recipeId,
  });

  upsertRecipeState(recipeId, {
    reviewStatus: 'rejected',
  });

  return {
    ok: true,
    message: `Rejected ${recipeId} (history retained, hidden from approval queue)`,
  };
}

/**
 * Generate ONE new hero into history as next version.
 * Does not overwrite older history files.
 * Flat candidate is updated to the new version for pipeline compatibility.
 * Sprint REVIEW-2: optional visual feedback is appended to the official v1.1 prompt.
 */
export async function regenerateRecipe(
  recipeId: string,
  options: {
    feedbackIds?: string[];
    otherText?: string;
  } = {},
): Promise<{
  ok: boolean;
  message: string;
  newVersion: ReviewVersion | null;
  feedbackAppend: string;
  generate: Awaited<ReturnType<typeof runHeroGenerate>>;
}> {
  const queue = loadImageQueue() ?? buildImageQueue();
  const item = queue.items.find((i) => i.recipeId === recipeId);
  if (!item) throw new Error(`Recipe not found: ${recipeId}`);

  const feedbackAppend = buildHeroFeedbackPromptAppend({
    selectedIds: options.feedbackIds ?? [],
    otherText: options.otherText,
  });

  // Preserve current candidate into history before overwrite
  archiveCurrentCandidateIfNeeded(recipeId, item.heroImageKey);

  const generate = await runHeroGenerate({
    recipeIds: [recipeId],
    force: true,
    skipReviewHtml: true,
    feedbackAppend: feedbackAppend || undefined,
  });

  if (generate.disabled || generate.written === 0) {
    return {
      ok: false,
      message:
        generate.providerStatus === 'ok'
          ? `Regenerate wrote 0 images for ${recipeId}`
          : `Provider not ready: ${generate.providerStatus}`,
      newVersion: null,
      feedbackAppend,
      generate,
    };
  }

  const candidate = resolveCandidatePath(recipeId, item.heroImageKey);
  if (!fs.existsSync(candidate)) {
    return {
      ok: false,
      message: `Generate succeeded but candidate missing for ${recipeId}`,
      newVersion: null,
      feedbackAppend,
      generate,
    };
  }

  const bytes = fs.readFileSync(candidate);
  const newVersion = archiveBytesAsNextVersion(
    recipeId,
    bytes,
    item.heroImageKey,
  );

  upsertRecipeState(recipeId, {
    reviewStatus: 'pending_review',
    selectedVersion: newVersion.version,
  });

  return {
    ok: true,
    message: `Generated ${newVersion.filename} (history kept under ${HISTORY_DIR}; style ${HANKKI_HERO_STYLE_VERSION})`,
    newVersion,
    feedbackAppend,
    generate,
  };
}

export function reopenRejected(recipeId: string): RecipeDashboardState {
  return upsertRecipeState(recipeId, { reviewStatus: 'pending_review' });
}
