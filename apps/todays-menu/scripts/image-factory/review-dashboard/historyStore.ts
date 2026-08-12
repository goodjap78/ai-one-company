/**
 * Sprint REVIEW-1 / CONTENT-CENTER-1 — version history for review heroes.
 *
 * Preferred: generated/image-factory/review/history/{recipeId}-{heroImageKey}-v{n}.jpg
 * Legacy:    generated/image-factory/review/history/{recipeId}-v{n}.jpg
 * Never auto-delete.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { flatReviewImagePath, resolveCandidatePath } from '../reviewStore';

export const HISTORY_DIR = path.join(PATHS.reviewDir, 'history');

export type ReviewVersion = {
  version: number;
  filename: string;
  absolutePath: string;
  relativePath: string;
  bytes: number;
  createdAt: string;
  sha256?: string;
};

function ensureHistoryDir(): void {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

/** Canonical filename for a new history version. */
export function historyFileName(
  recipeId: string,
  heroImageKey: string,
  version: number,
): string {
  return `${recipeId}-${heroImageKey}-v${version}.jpg`;
}

export function historyFilePath(
  recipeId: string,
  heroImageKey: string,
  version: number,
): string {
  return path.join(HISTORY_DIR, historyFileName(recipeId, heroImageKey, version));
}

function parseVersionFromFilename(
  filename: string,
  recipeId: string,
  heroImageKey?: string,
): number | null {
  if (heroImageKey) {
    const preferred = filename.match(
      new RegExp(`^${recipeId}-${heroImageKey}-v(\\d+)\\.jpg$`),
    );
    if (preferred) return Number(preferred[1]);
  }
  const legacy = filename.match(new RegExp(`^${recipeId}-v(\\d+)\\.jpg$`));
  if (legacy) return Number(legacy[1]);
  // Also accept preferred when heroImageKey unknown: {id}-{anything}-v{n}.jpg
  const loose = filename.match(
    new RegExp(`^${recipeId}-[a-z0-9_]+-v(\\d+)\\.jpg$`),
  );
  if (loose) return Number(loose[1]);
  return null;
}

export function listVersions(
  recipeId: string,
  heroImageKey?: string,
): ReviewVersion[] {
  ensureHistoryDir();
  const files = fs
    .readdirSync(HISTORY_DIR)
    .map((filename) => {
      const version = parseVersionFromFilename(
        filename,
        recipeId,
        heroImageKey,
      );
      return version == null ? null : { version, filename };
    })
    .filter((x): x is { version: number; filename: string } => Boolean(x))
    // Prefer preferred naming when both exist for same version number
    .sort((a, b) => {
      if (a.version !== b.version) return a.version - b.version;
      const aPref = a.filename.includes(`-${heroImageKey ?? ''}-v`);
      const bPref = b.filename.includes(`-${heroImageKey ?? ''}-v`);
      if (aPref === bPref) return a.filename.localeCompare(b.filename);
      return aPref ? -1 : 1;
    });

  const byVersion = new Map<number, { version: number; filename: string }>();
  for (const f of files) {
    if (!byVersion.has(f.version)) byVersion.set(f.version, f);
  }

  return [...byVersion.values()]
    .sort((a, b) => a.version - b.version)
    .map((f) => {
      const abs = path.join(HISTORY_DIR, f.filename);
      const stat = fs.statSync(abs);
      return {
        version: f.version,
        filename: f.filename,
        absolutePath: abs,
        relativePath: `generated/image-factory/review/history/${f.filename}`,
        bytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    });
}

export function resolveHistoryAbsolutePath(
  recipeId: string,
  version: number,
  heroImageKey?: string,
): string | null {
  const versions = listVersions(recipeId, heroImageKey);
  const found = versions.find((v) => v.version === version);
  return found?.absolutePath ?? null;
}

export function nextVersionNumber(
  recipeId: string,
  heroImageKey?: string,
): number {
  const existing = listVersions(recipeId, heroImageKey);
  if (existing.length === 0) return 1;
  return existing[existing.length - 1].version + 1;
}

/** Copy bytes into the next history slot (preferred naming). */
export function archiveBytesAsNextVersion(
  recipeId: string,
  bytes: Buffer,
  heroImageKey = 'hero',
): ReviewVersion {
  ensureHistoryDir();
  const version = nextVersionNumber(recipeId, heroImageKey);
  const filename = historyFileName(recipeId, heroImageKey, version);
  const abs = path.join(HISTORY_DIR, filename);
  fs.writeFileSync(abs, bytes);
  const stat = fs.statSync(abs);
  return {
    version,
    filename,
    absolutePath: abs,
    relativePath: `generated/image-factory/review/history/${filename}`,
    bytes: stat.size,
    createdAt: stat.mtime.toISOString(),
  };
}

/** Archive current flat/legacy candidate into history if present and content-new. */
export function archiveCurrentCandidateIfNeeded(
  recipeId: string,
  heroImageKey: string,
): ReviewVersion | null {
  const candidate = resolveCandidatePath(recipeId, heroImageKey);
  if (!fs.existsSync(candidate)) return null;
  const bytes = fs.readFileSync(candidate);
  const existing = listVersions(recipeId, heroImageKey);
  if (existing.length > 0) {
    const last = existing[existing.length - 1];
    const lastBytes = fs.readFileSync(last.absolutePath);
    if (lastBytes.equals(bytes)) return last;
  }
  return archiveBytesAsNextVersion(recipeId, bytes, heroImageKey);
}

/** Set flat review candidate from a history version (for approve / preview current). */
export function promoteVersionToCurrentCandidate(
  recipeId: string,
  heroImageKey: string,
  version: number,
): string {
  const src = resolveHistoryAbsolutePath(recipeId, version, heroImageKey);
  if (!src || !fs.existsSync(src)) {
    throw new Error(
      `History version not found: ${historyFileName(recipeId, heroImageKey, version)}`,
    );
  }
  const dest = flatReviewImagePath(recipeId, heroImageKey);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const legacy = path.join(PATHS.reviewDir, heroImageKey, 'candidate.jpg');
  fs.mkdirSync(path.dirname(legacy), { recursive: true });
  fs.copyFileSync(src, legacy);
  return dest;
}
