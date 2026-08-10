/**
 * STEP 5 + 7 / Sprint IMG-4 — Promote / reject / regenerate.
 * Approved images copy into assets/meals/, verify hash, refresh registry + recipeImageMap.
 * Never overwrite production unless --force (backs up first for hero:rollback).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildImageQueue,
  clearRegisteredMealKeyCache,
  loadImageQueue,
  updateQueueItem,
  writeImageQueue,
} from './buildImageQueue';
import { PATHS } from './config';
import { saveImageFile } from './engine';
import {
  backupProductionIfExists,
  productionAssetPath,
  verifyPromoteCopy,
  type PromoteVerifyResult,
} from './promoteVerify';
import { inRecipeIdRange } from './recipeIdRange';
import {
  candidatePathFor,
  resolveCandidatePath,
  writeReviewPackage,
} from './reviewStore';
import { updateMealImageRegistry } from './updateMealImageRegistry';
import { updateRecipeImageMapEntries } from './updateRecipeImageMap';
import { writeReviewIndexHtml } from './writeReviewHtml';
import { markHeroExpansionApproved } from './heroExpansionWaiver';

export type ApprovalDecision = 'approve' | 'reject' | 'regenerate';

export type ApproveOptions = {
  decision: ApprovalDecision;
  recipeId?: string;
  heroImageKey?: string;
  force?: boolean;
  /** Approve/reject all completed items. */
  allCompleted?: boolean;
  fromId?: string;
  toId?: string;
  /**
   * IMG-3: only promote items with status `completed` (awaiting review).
   * Used with --from/--to for batch approval of ready reviews.
   */
  approvedOnly?: boolean;
};

export type ApprovePromotionDetail = {
  recipeId: string;
  heroImageKey: string;
  filename: string;
  reviewRelative: string;
  productionRelative: string;
  backupRelative: string | null;
  verify: PromoteVerifyResult;
};

export function runHeroApprove(options: ApproveOptions): {
  touched: string[];
  promoted: string[];
  registryUpdated: boolean;
  mappingUpdatedCount: number;
  promotions: ApprovePromotionDetail[];
  failed: string[];
} {
  let queue = loadImageQueue() ?? buildImageQueue();
  const touched: string[] = [];
  const promoted: string[] = [];
  const mappingPairs: Array<{ recipeId: string; heroImageKey: string }> = [];
  const promotions: ApprovePromotionDetail[] = [];
  const failed: string[] = [];

  const hasRange = options.fromId && options.toId;

  const targets = queue.items.filter((item) => {
    if (hasRange) {
      if (!inRecipeIdRange(item.recipeId, options.fromId, options.toId)) {
        return false;
      }
      if (options.approvedOnly) return item.status === 'completed';
      if (options.decision === 'approve') {
        return item.status === 'completed' || item.status === 'approved';
      }
      return true;
    }
    if (options.allCompleted) {
      return item.status === 'completed';
    }
    if (options.recipeId) return item.recipeId === options.recipeId;
    if (options.heroImageKey) return item.heroImageKey === options.heroImageKey;
    if (options.fromId || options.toId) {
      return inRecipeIdRange(item.recipeId, options.fromId, options.toId);
    }
    return false;
  });

  if (targets.length === 0) {
    throw new Error(
      'No matching queue items. Pass --recipe=011, or --from=001 --to=050 --approved-only, or --all-completed',
    );
  }

  for (const item of targets) {
    touched.push(item.recipeId);

    if (options.decision === 'reject') {
      queue = updateQueueItem(queue, item.recipeId, { status: 'rejected' });
      writeReviewPackage({
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        heroImageKey: item.heroImageKey,
        status: 'rejected',
        notes: 'Rejected in review — not copied to assets/meals',
      });
      console.log(`  [reject] ${item.recipeId} ${item.heroImageKey}`);
      continue;
    }

    if (options.decision === 'regenerate') {
      const candidate = resolveCandidatePath(item.recipeId, item.heroImageKey);
      if (fs.existsSync(candidate) && options.force) {
        fs.unlinkSync(candidate);
      }
      const legacy = candidatePathFor(item.heroImageKey);
      if (fs.existsSync(legacy) && options.force && legacy !== candidate) {
        fs.unlinkSync(legacy);
      }
      queue = updateQueueItem(queue, item.recipeId, {
        status: 'queued',
        error: undefined,
      });
      writeReviewPackage({
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        heroImageKey: item.heroImageKey,
        status: 'queued',
        notes: 'Re-queued for regeneration',
      });
      console.log(`  [regen] ${item.recipeId} → queued`);
      continue;
    }

    // --- approve (IMG-4 promote) ---
    if (item.status === 'approved' && !options.force) {
      console.log(`  [skip] ${item.recipeId} already approved (use --force to re-promote)`);
      promoted.push(item.heroImageKey);
      mappingPairs.push({
        recipeId: item.recipeId,
        heroImageKey: item.heroImageKey,
      });
      continue;
    }

    const candidate = resolveCandidatePath(item.recipeId, item.heroImageKey);
    const productionAbs = productionAssetPath(item.heroImageKey);
    const reviewRelative = path
      .relative(PATHS.appRoot, candidate)
      .replace(/\\/g, '/');
    const productionRelative = `assets/meals/${item.heroImageKey}.jpg`;

    if (!fs.existsSync(candidate)) {
      console.log(
        `  [skip] ${item.recipeId} missing review candidate — run hero:generate first`,
      );
      failed.push(item.recipeId);
      continue;
    }

    // Backup current production before overwrite (enables hero:rollback).
    let backupRelative: string | null = null;
    if (fs.existsSync(productionAbs)) {
      if (!options.force && item.status !== 'approved') {
        // Existing production without force → skip overwrite (legacy safety)
        const verifyExisting = verifyPromoteCopy({
          reviewAbs: candidate,
          productionAbs,
          heroImageKey: item.heroImageKey,
        });
        if (verifyExisting.hashMatch) {
          queue = updateQueueItem(queue, item.recipeId, { status: 'approved' });
          writeReviewPackage({
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            heroImageKey: item.heroImageKey,
            status: 'approved',
            notes: 'Production already matched review — marked approved',
          });
          promoted.push(item.heroImageKey);
          mappingPairs.push({
            recipeId: item.recipeId,
            heroImageKey: item.heroImageKey,
          });
          promotions.push({
            recipeId: item.recipeId,
            heroImageKey: item.heroImageKey,
            filename: `${item.heroImageKey}.jpg`,
            reviewRelative,
            productionRelative,
            backupRelative: null,
            verify: verifyExisting,
          });
          console.log(`  [approve] ${item.recipeId} (production already matches review)`);
          continue;
        }
        console.log(
          `  [skip] production exists ${item.outputFile} (use --force to overwrite)`,
        );
        continue;
      }

      const backupAbs = backupProductionIfExists(
        item.recipeId,
        item.heroImageKey,
      );
      if (backupAbs) {
        backupRelative = path
          .relative(PATHS.appRoot, backupAbs)
          .replace(/\\/g, '/');
        console.log(`  [backup] ${backupRelative}`);
      }
    }

    const bytes = fs.readFileSync(candidate);
    const saved = saveImageFile({
      bytes,
      absolutePath: productionAbs,
      force: true,
    });

    if (saved.status === 'error') {
      console.log(`  [fail] ${item.recipeId}: ${saved.error}`);
      queue = updateQueueItem(queue, item.recipeId, {
        status: 'failed',
        error: saved.error,
      });
      failed.push(item.recipeId);
      continue;
    }

    const verify = verifyPromoteCopy({
      reviewAbs: candidate,
      productionAbs,
      heroImageKey: item.heroImageKey,
    });

    if (!verify.ok) {
      console.log(`  [fail] ${item.recipeId}: ${verify.error}`);
      console.log(
        `         review=${verify.reviewSha256?.slice(0, 12) ?? '—'} prod=${verify.productionSha256?.slice(0, 12) ?? '—'}`,
      );
      queue = updateQueueItem(queue, item.recipeId, {
        status: 'failed',
        error: verify.error,
      });
      failed.push(item.recipeId);
      continue;
    }

    queue = updateQueueItem(queue, item.recipeId, { status: 'approved' });
    writeReviewPackage({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      status: 'approved',
      notes: `IMG-4 promoted to assets/meals/ (sha256=${verify.productionSha256?.slice(0, 16)})`,
    });
    promoted.push(item.heroImageKey);
    mappingPairs.push({
      recipeId: item.recipeId,
      heroImageKey: item.heroImageKey,
    });
    promotions.push({
      recipeId: item.recipeId,
      heroImageKey: item.heroImageKey,
      filename: `${item.heroImageKey}.jpg`,
      reviewRelative,
      productionRelative,
      backupRelative,
      verify,
    });
    console.log(`  [approve] ${item.recipeId} → ${productionRelative}`);
    console.log(
      `  [verify] exists=yes hashMatch=yes sha256=${verify.productionSha256?.slice(0, 16)}…`,
    );
  }

  writeImageQueue(queue);

  const registry = updateMealImageRegistry(promoted);
  clearRegisteredMealKeyCache();
  if (registry.updated) {
    console.log(
      `  Registry updated: ${path.relative(PATHS.appRoot, registry.registryPath)}`,
    );
  } else {
    console.log('  Registry: unchanged (keys already registered)');
  }

  const mapping = updateRecipeImageMapEntries(mappingPairs);
  if (mapping.updatedCount > 0) {
    console.log(
      `  recipeImageMap updated entries: ${mapping.updatedCount}`,
    );
  } else {
    console.log('  recipeImageMap: preserved (mapping already correct)');
  }

  const waiverRemoved = markHeroExpansionApproved(
    promotions.map((p) => p.recipeId),
  );
  if (waiverRemoved.length > 0) {
    console.log(
      `  Hero expansion waiver removed: ${waiverRemoved.join(', ')}`,
    );
  }

  const latest = loadImageQueue() ?? queue;
  const htmlPath = writeReviewIndexHtml(latest);
  console.log(`  Review HTML → ${htmlPath}`);

  return {
    touched,
    promoted,
    registryUpdated: registry.updated,
    mappingUpdatedCount: mapping.updatedCount,
    promotions,
    failed,
  };
}
