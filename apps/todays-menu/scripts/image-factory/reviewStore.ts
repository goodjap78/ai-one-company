/**
 * STEP 7 — Approval / review workspace.
 * Generated candidates live here until approve promotes to assets/meals/.
 *
 * Sprint IMG-2B flat review path:
 *   generated/image-factory/review/{recipeId}-{heroImageKey}.jpg
 * Legacy path (still supported):
 *   generated/image-factory/review/{heroImageKey}/candidate.jpg
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { ImageQueueStatus } from './queueTypes';
import type { ReviewMeta } from './queueTypes';

export function reviewDirFor(heroImageKey: string): string {
  return path.join(PATHS.reviewDir, heroImageKey);
}

/** IMG-2B — flat review filename used for human review (not production). */
export function flatReviewImagePath(
  recipeId: string,
  heroImageKey: string,
): string {
  return path.join(PATHS.reviewDir, `${recipeId}-${heroImageKey}.jpg`);
}

export function flatReviewRelative(
  recipeId: string,
  heroImageKey: string,
): string {
  return `generated/image-factory/review/${recipeId}-${heroImageKey}.jpg`;
}

export function candidatePathFor(heroImageKey: string): string {
  return path.join(reviewDirFor(heroImageKey), 'candidate.jpg');
}

/**
 * Prefer IMG-2B flat path; fall back to legacy nested candidate.
 */
export function resolveCandidatePath(
  recipeId: string,
  heroImageKey: string,
): string {
  const flat = flatReviewImagePath(recipeId, heroImageKey);
  if (fs.existsSync(flat)) return flat;
  return candidatePathFor(heroImageKey);
}

export function metaPathFor(heroImageKey: string): string {
  return path.join(reviewDirFor(heroImageKey), 'meta.json');
}

export function previewMarkdownPath(heroImageKey: string): string {
  return path.join(reviewDirFor(heroImageKey), 'PREVIEW.md');
}

export function writeReviewPackage(input: {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  status: ImageQueueStatus;
  provider?: string;
  notes?: string;
}): ReviewMeta {
  const dir = reviewDirFor(input.heroImageKey);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const stamp = new Date().toISOString();

  let previous: ReviewMeta | null = null;
  const metaFile = metaPathFor(input.heroImageKey);
  if (fs.existsSync(metaFile)) {
    try {
      previous = JSON.parse(fs.readFileSync(metaFile, 'utf8')) as ReviewMeta;
    } catch {
      previous = null;
    }
  }

  const meta: ReviewMeta = {
    recipeId: input.recipeId,
    recipeName: input.recipeName,
    heroImageKey: input.heroImageKey,
    status: input.status,
    createdAt: previous?.createdAt ?? stamp,
    updatedAt: stamp,
    candidateRelative: flatReviewRelative(input.recipeId, input.heroImageKey),
    productionRelative: `assets/meals/${input.heroImageKey}.jpg`,
    provider: input.provider ?? previous?.provider,
    notes: input.notes ?? previous?.notes,
    decision: previous?.decision,
  };

  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');
  fs.writeFileSync(
    previewMarkdownPath(input.heroImageKey),
    buildPreviewMarkdown(meta),
    'utf8',
  );
  return meta;
}

function buildPreviewMarkdown(meta: ReviewMeta): string {
  return [
    `# Review — ${meta.recipeName}`,
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| recipeId | \`${meta.recipeId}\` |`,
    `| heroImageKey | \`${meta.heroImageKey}\` |`,
    `| status | **${meta.status}** |`,
    `| candidate | \`${meta.candidateRelative}\` |`,
    `| production target | \`${meta.productionRelative}\` |`,
    `| provider | ${meta.provider ?? '—'} |`,
    `| updated | ${meta.updatedAt} |`,
    '',
    '## Actions',
    '',
    '```bash',
    `npm run hero:approve -- --recipe=${meta.recipeId} --force`,
    `npm run hero:rollback -- --recipe=${meta.recipeId}`,
    `npm run hero:approve -- --recipe=${meta.recipeId} --decision=reject`,
    `npm run hero:approve -- --recipe=${meta.recipeId} --decision=regenerate`,
    '```',
    '',
    '> Images must be **approved** before entering `assets/meals/` production.',
    '> `hero:approve --force` backs up the previous JPG for `hero:rollback`.',
    '',
  ].join('\n');
}

export function readReviewMeta(heroImageKey: string): ReviewMeta | null {
  const p = metaPathFor(heroImageKey);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as ReviewMeta;
}
