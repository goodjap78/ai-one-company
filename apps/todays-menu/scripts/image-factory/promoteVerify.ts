/**
 * Sprint IMG-4 — Review → Production copy + hash verification helpers.
 * No UI / prompt / recipe changes.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';

export function sha256File(absolutePath: string): string {
  const bytes = fs.readFileSync(absolutePath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function sha256Bytes(bytes: Buffer): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function productionAssetPath(heroImageKey: string): string {
  return path.join(PATHS.mealAssetsDir, `${heroImageKey}.jpg`);
}

export function backupAssetPath(recipeId: string, heroImageKey: string): string {
  return path.join(
    PATHS.backupsDir,
    `${recipeId}-${heroImageKey}.prev.jpg`,
  );
}

/**
 * If production file exists, copy it to backups/ before overwrite.
 * Returns backup path when a backup was written.
 */
export function backupProductionIfExists(
  recipeId: string,
  heroImageKey: string,
): string | null {
  const productionAbs = productionAssetPath(heroImageKey);
  if (!fs.existsSync(productionAbs)) return null;

  fs.mkdirSync(PATHS.backupsDir, { recursive: true });
  const backupAbs = backupAssetPath(recipeId, heroImageKey);
  fs.copyFileSync(productionAbs, backupAbs);
  return backupAbs;
}

export type PromoteVerifyResult = {
  ok: boolean;
  reviewPath: string;
  productionPath: string;
  reviewExists: boolean;
  productionExists: boolean;
  reviewSha256: string | null;
  productionSha256: string | null;
  hashMatch: boolean;
  filename: string;
  error?: string;
};

/**
 * After copy: production must exist and SHA-256 must match review bytes.
 */
export function verifyPromoteCopy(input: {
  reviewAbs: string;
  productionAbs: string;
  heroImageKey: string;
}): PromoteVerifyResult {
  const filename = `${input.heroImageKey}.jpg`;
  const reviewExists = fs.existsSync(input.reviewAbs);
  const productionExists = fs.existsSync(input.productionAbs);

  if (!reviewExists) {
    return {
      ok: false,
      reviewPath: input.reviewAbs,
      productionPath: input.productionAbs,
      reviewExists: false,
      productionExists,
      reviewSha256: null,
      productionSha256: null,
      hashMatch: false,
      filename,
      error: 'Review image missing after promote',
    };
  }

  if (!productionExists) {
    return {
      ok: false,
      reviewPath: input.reviewAbs,
      productionPath: input.productionAbs,
      reviewExists: true,
      productionExists: false,
      reviewSha256: sha256File(input.reviewAbs),
      productionSha256: null,
      hashMatch: false,
      filename,
      error: 'Production asset missing after copy',
    };
  }

  const reviewSha256 = sha256File(input.reviewAbs);
  const productionSha256 = sha256File(input.productionAbs);
  const hashMatch = reviewSha256 === productionSha256;

  return {
    ok: hashMatch,
    reviewPath: input.reviewAbs,
    productionPath: input.productionAbs,
    reviewExists: true,
    productionExists: true,
    reviewSha256,
    productionSha256,
    hashMatch,
    filename,
    error: hashMatch
      ? undefined
      : 'SHA-256 mismatch between review and production after copy',
  };
}
