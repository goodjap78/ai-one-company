/**
 * Approve / reject / regenerate step images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { saveImageFile } from '../image-factory/engine';
import { updateStepImageRegistry } from '../recipe-assets/updateStepImageRegistry';
import {
  loadStepQueue,
  updateQueueItem,
  writeStepQueue,
} from './buildQueue';
import { PATHS } from './config';
import { reviewImagePath, writeStepReviewPackage } from './reviewStore';
import { writeStepReviewHtml } from './writeReviewHtml';

export type StepApproveOptions = {
  decision: 'approve' | 'reject' | 'regenerate';
  imageKey?: string;
  approvedOnly?: boolean;
  force?: boolean;
};

export function runStepApprove(options: StepApproveOptions): {
  touched: string[];
  promoted: string[];
  registryUpdated: boolean;
} {
  let queue = loadStepQueue();
  if (!queue) {
    throw new Error('Missing step queue. Run step:queue first.');
  }

  const targets = queue.items.filter((item) => {
    if (options.imageKey) return item.imageKey === options.imageKey;
    if (options.approvedOnly) return item.status === 'completed';
    return false;
  });

  if (targets.length === 0) {
    throw new Error(
      'No matching items. Pass --key=kimchi_stew_step_01 or --approved-only',
    );
  }

  const touched: string[] = [];
  const promoted: string[] = [];

  for (const item of targets) {
    touched.push(item.imageKey);

    if (options.decision === 'reject') {
      queue = updateQueueItem(queue, item.imageKey, { status: 'rejected' });
      writeStepReviewPackage({
        item,
        status: 'rejected',
        notes: 'Rejected — not copied to production',
      });
      console.log(`  [reject] ${item.imageKey}`);
      continue;
    }

    if (options.decision === 'regenerate') {
      const candidate = reviewImagePath(item.imageKey);
      if (fs.existsSync(candidate) && options.force) fs.unlinkSync(candidate);
      queue = updateQueueItem(queue, item.imageKey, {
        status: 'queued',
        error: undefined,
      });
      writeStepReviewPackage({
        item,
        status: 'queued',
        notes: 'Re-queued for regeneration',
      });
      console.log(`  [regen] ${item.imageKey} → queued`);
      continue;
    }

    if (item.status === 'approved' && !options.force) {
      console.log(`  [skip] ${item.imageKey} already approved`);
      promoted.push(item.imageKey);
      continue;
    }

    const candidate = reviewImagePath(item.imageKey);
    const productionAbs = path.join(PATHS.stepsDir, item.outputFilename);

    if (!fs.existsSync(candidate) && fs.existsSync(productionAbs)) {
      queue = updateQueueItem(queue, item.imageKey, { status: 'approved' });
      writeStepReviewPackage({
        item,
        status: 'approved',
        notes: 'Existing production file registered',
      });
      promoted.push(item.imageKey);
      console.log(`  [approve] ${item.imageKey} (existing file)`);
      continue;
    }

    if (!fs.existsSync(candidate)) {
      console.log(`  [skip] ${item.imageKey} missing review candidate`);
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
      queue = updateQueueItem(queue, item.imageKey, { status: 'approved' });
      promoted.push(item.imageKey);
      continue;
    }

    if (saved.status === 'error') {
      console.log(`  [fail] ${item.imageKey}: ${saved.error}`);
      queue = updateQueueItem(queue, item.imageKey, {
        status: 'failed',
        error: saved.error,
      });
      continue;
    }

    queue = updateQueueItem(queue, item.imageKey, { status: 'approved' });
    writeStepReviewPackage({
      item,
      status: 'approved',
      notes: 'Promoted to assets/recipe-steps/',
    });
    promoted.push(item.imageKey);
    console.log(
      `  [approve] ${item.imageKey} → assets/recipe-steps/${item.outputFilename}`,
    );
  }

  writeStepQueue(queue);
  const registry = updateStepImageRegistry(promoted);
  if (registry.updated) {
    console.log(
      `  Registry updated: ${path.relative(PATHS.appRoot, registry.path)}`,
    );
  }

  writeStepReviewHtml(loadStepQueue() ?? queue);

  return {
    touched,
    promoted,
    registryUpdated: registry.updated,
  };
}
