/**
 * Restore ingredient approval provenance when review/production hashes match.
 * Does not overwrite production bytes for RESTORE_APPROVAL targets.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildIngredientIconMatrix,
  writeIngredientAuditReport,
  type IngredientAuditRow,
} from './ingredientIconMatrix';
import {
  loadIngredientQueue,
  updateQueueItem,
  writeIngredientQueue,
} from './buildQueue';
import { PATHS } from './config';
import { runIngredientApprove } from './runApprove';
import { reviewImagePath, writeIngredientReviewPackage } from './reviewStore';
import { writeIngredientReviewHtml } from './writeReviewHtml';

export type RestoreResult = {
  dryRun: boolean;
  restored: string[];
  approvedFromReview: string[];
  skipped: string[];
  failed: string[];
  auditPath: string;
};

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function restoreQueueApproved(
  row: IngredientAuditRow,
  queue: NonNullable<ReturnType<typeof loadIngredientQueue>>,
): NonNullable<ReturnType<typeof loadIngredientQueue>> {
  const item = queue.items.find((i) => i.iconKey === row.iconKey);
  if (!item) {
    throw new Error(`Queue missing iconKey ${row.iconKey}`);
  }

  const prodAbs = path.join(PATHS.ingredientsDir, item.outputFilename);
  const reviewAbs = reviewImagePath(row.iconKey);
  const beforeProd = sha256File(prodAbs);
  const beforeReview = sha256File(reviewAbs);

  const updated = updateQueueItem(queue, row.iconKey, {
    status: 'approved',
    error: undefined,
  });
  writeIngredientReviewPackage({
    item,
    status: 'approved',
    notes: 'Restored approval — review/production hash verified (no file copy)',
  });

  const afterProd = sha256File(prodAbs);
  const afterReview = sha256File(reviewAbs);
  if (beforeProd !== afterProd || beforeReview !== afterReview) {
    throw new Error(`Hash changed unexpectedly for ${row.iconKey}`);
  }

  return updated;
}

export function runRestoreIngredientApprovals(options: {
  dryRun?: boolean;
} = {}): RestoreResult {
  const matrix = buildIngredientIconMatrix();
  const auditPath = writeIngredientAuditReport(matrix);

  const restored: string[] = [];
  const approvedFromReview: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  console.log('\n--- Ingredient recovery matrix ---');
  console.log(`Required keys: ${matrix.requiredKeys.length}`);
  console.log(`Disk PNG files: ${matrix.diskPngCount}`);
  console.log(
    `Unused on disk (not recipe-required): ${matrix.unusedOnDisk.join(', ') || 'none'}`,
  );
  for (const [action, count] of Object.entries({
    COMPLETE: matrix.rows.filter((r) => r.action === 'COMPLETE').length,
    RESTORE_APPROVAL: matrix.rows.filter((r) => r.action === 'RESTORE_APPROVAL')
      .length,
    APPROVE_FROM_REVIEW: matrix.rows.filter((r) => r.action === 'APPROVE_FROM_REVIEW')
      .length,
    NEEDS_REVIEW: matrix.rows.filter((r) => r.action === 'NEEDS_REVIEW').length,
  })) {
    console.log(`  ${action}: ${count}`);
  }

  if (options.dryRun) {
    for (const row of matrix.rows) {
      if (row.action === 'COMPLETE') skipped.push(row.iconKey);
      else if (row.action === 'RESTORE_APPROVAL') {
        console.log(`  [dry-run restore] ${row.iconKey}`);
        restored.push(row.iconKey);
      } else if (row.action === 'APPROVE_FROM_REVIEW') {
        console.log(`  [dry-run approve-from-review] ${row.iconKey}`);
        approvedFromReview.push(row.iconKey);
      } else {
        console.log(`  [skip] ${row.iconKey}: ${row.notes.join('; ')}`);
        failed.push(row.iconKey);
      }
    }
    return {
      dryRun: true,
      restored,
      approvedFromReview,
      skipped: matrix.rows
        .filter((r) => r.action === 'COMPLETE')
        .map((r) => r.iconKey),
      failed,
      auditPath,
    };
  }

  let queue = loadIngredientQueue();
  if (!queue) {
    throw new Error('Missing ingredient queue. Run: npm run ingredient:queue -- --from=001 --to=160');
  }

  for (const row of matrix.rows) {
    if (row.action === 'COMPLETE') {
      skipped.push(row.iconKey);
      continue;
    }

    if (row.action === 'RESTORE_APPROVAL') {
      try {
        queue = restoreQueueApproved(row, queue);
        restored.push(row.iconKey);
        console.log(`  [restore] ${row.iconKey} → approved (hash verified, no copy)`);
      } catch (error) {
        failed.push(row.iconKey);
        console.log(
          `  [fail] ${row.iconKey}: ${error instanceof Error ? error.message : error}`,
        );
      }
      continue;
    }

    if (row.action === 'APPROVE_FROM_REVIEW') {
      try {
        const result = runIngredientApprove({
          decision: 'approve',
          iconKey: row.iconKey,
          force: true,
        });
        if (result.promoted.includes(row.iconKey)) {
          approvedFromReview.push(row.iconKey);
          queue = loadIngredientQueue() ?? queue;
          console.log(`  [approve] ${row.iconKey} from review → production`);
        } else {
          failed.push(row.iconKey);
          console.log(`  [fail] ${row.iconKey}: approve did not promote`);
        }
      } catch (error) {
        failed.push(row.iconKey);
        console.log(
          `  [fail] ${row.iconKey}: ${error instanceof Error ? error.message : error}`,
        );
      }
      continue;
    }

    failed.push(row.iconKey);
    console.log(`  [skip] ${row.iconKey}: ${row.notes.join('; ')}`);
  }

  writeIngredientQueue(queue);
  writeIngredientReviewHtml(queue);

  return {
    dryRun: false,
    restored,
    approvedFromReview,
    skipped,
    failed,
    auditPath,
  };
}
