/**
 * Approve / reject / regenerate ingredient images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { saveImageFile } from '../image-factory/engine';
import { updateIngredientRegistry } from '../recipe-assets/updateIngredientRegistry';
import {
  loadIngredientQueue,
  updateQueueItem,
  writeIngredientQueue,
} from './buildQueue';
import { PATHS } from './config';
import { reviewImagePath, writeIngredientReviewPackage } from './reviewStore';
import { writeIngredientReviewHtml } from './writeReviewHtml';

export type IngredientApproveOptions = {
  decision: 'approve' | 'reject' | 'regenerate';
  iconKey?: string;
  approvedOnly?: boolean;
  force?: boolean;
};

export function runIngredientApprove(options: IngredientApproveOptions): {
  touched: string[];
  promoted: string[];
  registryUpdated: boolean;
} {
  let queue = loadIngredientQueue();
  if (!queue) {
    throw new Error('Missing ingredient queue. Run ingredient:queue first.');
  }

  const targets = queue.items.filter((item) => {
    if (options.iconKey) return item.iconKey === options.iconKey;
    if (options.approvedOnly) return item.status === 'completed';
    return false;
  });

  if (targets.length === 0) {
    throw new Error(
      'No matching items. Pass --key=onion or --approved-only (completed reviews).',
    );
  }

  const touched: string[] = [];
  const promoted: string[] = [];

  for (const item of targets) {
    touched.push(item.iconKey);

    if (options.decision === 'reject') {
      queue = updateQueueItem(queue, item.iconKey, { status: 'rejected' });
      writeIngredientReviewPackage({
        item,
        status: 'rejected',
        notes: 'Rejected — not copied to production',
      });
      console.log(`  [reject] ${item.iconKey}`);
      continue;
    }

    if (options.decision === 'regenerate') {
      const candidate = reviewImagePath(item.iconKey);
      if (fs.existsSync(candidate) && options.force) fs.unlinkSync(candidate);
      queue = updateQueueItem(queue, item.iconKey, {
        status: 'queued',
        error: undefined,
      });
      writeIngredientReviewPackage({
        item,
        status: 'queued',
        notes: 'Re-queued for regeneration',
      });
      console.log(`  [regen] ${item.iconKey} → queued`);
      continue;
    }

    // approve
    if (item.status === 'approved' && !options.force) {
      console.log(`  [skip] ${item.iconKey} already approved`);
      promoted.push(item.iconKey);
      continue;
    }

    const candidate = reviewImagePath(item.iconKey);
    const productionAbs = path.join(
      PATHS.ingredientsDir,
      item.outputFilename,
    );

    if (!fs.existsSync(candidate) && fs.existsSync(productionAbs)) {
      queue = updateQueueItem(queue, item.iconKey, { status: 'approved' });
      writeIngredientReviewPackage({
        item,
        status: 'approved',
        notes: 'Existing production file registered',
      });
      promoted.push(item.iconKey);
      console.log(`  [approve] ${item.iconKey} (existing file)`);
      continue;
    }

    if (!fs.existsSync(candidate)) {
      console.log(`  [skip] ${item.iconKey} missing review candidate`);
      continue;
    }

    const bytes = fs.readFileSync(candidate);
    const saved = saveImageFile({
      bytes,
      absolutePath: productionAbs,
      force: options.force,
    });

    if (saved.status === 'skipped_exists') {
      console.log(
        `  [skip] production exists ${item.outputFilename} (use --force)`,
      );
      queue = updateQueueItem(queue, item.iconKey, { status: 'approved' });
      promoted.push(item.iconKey);
      continue;
    }

    if (saved.status === 'error') {
      console.log(`  [fail] ${item.iconKey}: ${saved.error}`);
      queue = updateQueueItem(queue, item.iconKey, {
        status: 'failed',
        error: saved.error,
      });
      continue;
    }

    queue = updateQueueItem(queue, item.iconKey, { status: 'approved' });
    writeIngredientReviewPackage({
      item,
      status: 'approved',
      notes: 'Promoted to assets/ingredients/',
    });
    promoted.push(item.iconKey);
    console.log(`  [approve] ${item.iconKey} → assets/ingredients/${item.outputFilename}`);
  }

  writeIngredientQueue(queue);
  const registry = updateIngredientRegistry(promoted);
  if (registry.updated) {
    console.log(
      `  Registry updated: ${path.relative(PATHS.appRoot, registry.path)}`,
    );
  }

  writeIngredientReviewHtml(loadIngredientQueue() ?? queue);

  return {
    touched,
    promoted,
    registryUpdated: registry.updated,
  };
}
