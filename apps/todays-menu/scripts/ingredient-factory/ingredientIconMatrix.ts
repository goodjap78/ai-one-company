/**
 * Ingredient icon audit matrix — recipe-required keys vs disk/registry/queue.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sizeOf from 'image-size';
import { listUniqueIngredientKeys } from '../content-center/productionProgress';
import { PATHS } from './config';
import { loadIngredientQueue } from './buildQueue';
import { reviewImagePath } from './reviewStore';

export type IngredientAuditAction =
  | 'RESTORE_APPROVAL'
  | 'APPROVE_FROM_REVIEW'
  | 'NEEDS_REVIEW'
  | 'COMPLETE';

export type IngredientAuditRow = {
  iconKey: string;
  recipeUsed: boolean;
  reviewExists: boolean;
  productionExists: boolean;
  registryExists: boolean;
  queueStatus: string | null;
  reviewSha256: string | null;
  productionSha256: string | null;
  hashMatch: boolean;
  reviewSize: string | null;
  action: IngredientAuditAction;
  notes: string[];
};

function sha256File(abs: string): string | null {
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function parseRegistryKeys(): Set<string> {
  const source = fs.readFileSync(PATHS.ingredientRegistry, 'utf8');
  const keys = new Set<string>();
  const block = source.match(
    /export const INGREDIENT_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return keys;
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) keys.add(m[1]);
  return keys;
}

function readPngSize(abs: string): string | null {
  if (!fs.existsSync(abs)) return null;
  try {
    const dims = sizeOf(fs.readFileSync(abs));
    if (!dims.width || !dims.height) return 'unknown';
    return `${dims.width}x${dims.height}`;
  } catch {
    return 'invalid';
  }
}

export function buildIngredientIconMatrix(): {
  requiredKeys: string[];
  diskPngCount: number;
  unusedOnDisk: string[];
  rows: IngredientAuditRow[];
} {
  const requiredKeys = listUniqueIngredientKeys();
  const registryKeys = parseRegistryKeys();
  const queue = loadIngredientQueue();

  const diskFiles = fs.existsSync(PATHS.ingredientsDir)
    ? fs
        .readdirSync(PATHS.ingredientsDir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => f.replace(/\.png$/, ''))
    : [];
  const diskSet = new Set(diskFiles);
  const requiredSet = new Set(requiredKeys);
  const unusedOnDisk = diskFiles.filter((k) => !requiredSet.has(k)).sort();

  const rows: IngredientAuditRow[] = [];

  for (const iconKey of requiredKeys) {
    const notes: string[] = [];
    const reviewAbs = reviewImagePath(iconKey);
    const prodAbs = path.join(PATHS.ingredientsDir, `${iconKey}.png`);
    const reviewExists = fs.existsSync(reviewAbs);
    const productionExists = fs.existsSync(prodAbs);
    const registryExists = registryKeys.has(iconKey);
    const item = queue?.items.find((i) => i.iconKey === iconKey);
    const queueStatus = item?.status ?? null;

    const reviewSha256 = reviewExists ? sha256File(reviewAbs) : null;
    const productionSha256 = productionExists ? sha256File(prodAbs) : null;
    const hashMatch =
      reviewSha256 !== null &&
      productionSha256 !== null &&
      reviewSha256 === productionSha256;
    const reviewSize = reviewExists ? readPngSize(reviewAbs) : null;

    if (reviewSize && reviewSize !== '1024x1024') {
      notes.push(`review size ${reviewSize}`);
    }

    let action: IngredientAuditAction;

    const smokeComplete =
      queueStatus === 'approved' &&
      reviewExists &&
      productionExists &&
      registryExists &&
      hashMatch;

    if (smokeComplete) {
      action = 'COMPLETE';
    } else if (
      reviewExists &&
      productionExists &&
      registryExists &&
      hashMatch &&
      queueStatus !== 'approved'
    ) {
      action = 'RESTORE_APPROVAL';
      notes.push('queue approval restore only — no file copy');
    } else if (reviewExists && (!productionExists || !registryExists)) {
      action = 'APPROVE_FROM_REVIEW';
      if (!productionExists) notes.push('missing production PNG');
      if (!registryExists) notes.push('missing registry require');
    } else {
      action = 'NEEDS_REVIEW';
      if (!reviewExists) notes.push('missing review PNG');
      if (reviewExists && productionExists && !hashMatch) {
        notes.push('review/production hash mismatch');
      }
      if (!productionExists && !reviewExists) notes.push('no review or production');
    }

    rows.push({
      iconKey,
      recipeUsed: true,
      reviewExists,
      productionExists,
      registryExists,
      queueStatus,
      reviewSha256,
      productionSha256,
      hashMatch,
      reviewSize,
      action,
      notes,
    });
  }

  return {
    requiredKeys,
    diskPngCount: diskFiles.length,
    unusedOnDisk,
    rows,
  };
}

export function writeIngredientAuditReport(
  matrix: ReturnType<typeof buildIngredientIconMatrix>,
): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  const out = path.join(PATHS.generatedRoot, 'ingredient-recovery-audit.json');
  const summary = {
    generatedAt: new Date().toISOString(),
    requiredKeyCount: matrix.requiredKeys.length,
    diskPngCount: matrix.diskPngCount,
    unusedOnDisk: matrix.unusedOnDisk,
    byAction: {
      COMPLETE: matrix.rows.filter((r) => r.action === 'COMPLETE').length,
      RESTORE_APPROVAL: matrix.rows.filter((r) => r.action === 'RESTORE_APPROVAL')
        .length,
      APPROVE_FROM_REVIEW: matrix.rows.filter((r) => r.action === 'APPROVE_FROM_REVIEW')
        .length,
      NEEDS_REVIEW: matrix.rows.filter((r) => r.action === 'NEEDS_REVIEW').length,
    },
    rows: matrix.rows,
  };
  fs.writeFileSync(out, JSON.stringify(summary, null, 2), 'utf8');
  return path.relative(PATHS.appRoot, out);
}
