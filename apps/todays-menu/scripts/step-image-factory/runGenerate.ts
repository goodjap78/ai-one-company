/**
 * Generate step review images (batches of 5, concurrency 2).
 * Never writes assets/recipe-steps until approve.
 */
import path from 'node:path';
import {
  createImageProvider,
  getProviderEnv,
  saveImageFile,
  type ImageProvider,
} from '../image-factory/engine';
import {
  checkProviderGate,
  printProviderNotConfigured,
} from '../image-factory/providerGate';
import {
  chunkArray,
  mapWithConcurrency,
} from '../image-factory/recipeIdRange';
import {
  loadStepQueue,
  updateQueueItem,
  writeStepQueue,
} from './buildQueue';
import { extractPromptBody } from './buildPrompts';
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_CONCURRENCY,
  PATHS,
  STEP_IMAGE_SPEC,
} from './config';
import {
  reviewImagePath,
  reviewRelative,
  writeStepReviewPackage,
} from './reviewStore';
import type { StepQueueItem } from './types';
import { writeStepReviewHtml } from './writeReviewHtml';

function shouldGenerate(
  item: StepQueueItem,
  options: {
    missingOnly?: boolean;
    resume?: boolean;
    force?: boolean;
    keys?: Set<string>;
    recipeIds?: Set<string>;
  },
): boolean {
  if (options.recipeIds && !options.recipeIds.has(item.recipeId)) return false;
  if (options.keys && !options.keys.has(item.imageKey)) return false;
  if (options.force) return true;
  if (item.status === 'approved') return false;
  if (item.status === 'existing_unregistered' && !options.force) return false;
  if (item.status === 'completed') return false;
  if (item.status === 'rejected') return false;
  return (
    item.status === 'queued' ||
    item.status === 'missing' ||
    item.status === 'failed' ||
    (item.status === 'processing' && Boolean(options.resume))
  );
}

export type StepGenerateOptions = {
  missingOnly?: boolean;
  resume?: boolean;
  force?: boolean;
  keys?: string[];
  /** Filter by recipe id(s), e.g. --recipe=003 */
  recipeIds?: string[];
  batchSize?: number;
  concurrency?: number;
  dryRun?: boolean;
};

export type StepGenerateResult = {
  written: number;
  skipped: number;
  failed: number;
  providerStatus:
    | 'ok'
    | 'PROVIDER_NOT_CONFIGURED'
    | 'API_KEY_MISSING'
    | 'dry-run';
  providerName: string;
  reviewPaths: string[];
};

async function generateOne(
  item: StepQueueItem,
  provider: ImageProvider,
  mutate: (key: string, patch: Partial<StepQueueItem>) => void,
): Promise<{ ok: boolean; failed: boolean; reviewPath?: string }> {
  mutate(item.imageKey, { status: 'processing', error: undefined });

  const promptAbs = path.join(PATHS.appRoot, item.promptFile);
  const promptBody =
    extractPromptBody(promptAbs) ??
    `${item.recipeName} step ${item.stepOrder}: ${item.stepInstruction}`;

  console.log(
    `  [gen] ${item.imageKey} · ${item.recipeName} step ${item.stepOrder}…`,
  );

  let result;
  try {
    result = await provider.generateImage({
      assetKey: item.imageKey,
      subject: `${item.recipeName} step ${item.stepOrder}`,
      prompt: promptBody,
      width: STEP_IMAGE_SPEC.width,
      height: STEP_IMAGE_SPEC.height,
      format: STEP_IMAGE_SPEC.format,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mutate(item.imageKey, { status: 'failed', error: message });
    writeStepReviewPackage({
      item,
      status: 'failed',
      provider: provider.name,
      notes: message,
      prompt: promptBody,
    });
    console.log(`  [fail] ${item.imageKey}: ${message}`);
    return { ok: false, failed: true };
  }

  if (result.status !== 'ok' || !result.bytes) {
    const err = result.error ?? 'generation failed';
    mutate(item.imageKey, { status: 'failed', error: err });
    writeStepReviewPackage({
      item,
      status: 'failed',
      provider: provider.name,
      notes: err,
      prompt: promptBody,
    });
    console.log(`  [fail] ${item.imageKey}: ${err}`);
    return { ok: false, failed: true };
  }

  const saved = saveImageFile({
    bytes: result.bytes,
    absolutePath: reviewImagePath(item.imageKey),
    force: true,
  });
  if (saved.status === 'error') {
    mutate(item.imageKey, { status: 'failed', error: saved.error });
    console.log(`  [fail] ${item.imageKey}: ${saved.error}`);
    return { ok: false, failed: true };
  }

  const reviewRel = reviewRelative(item.imageKey);
  mutate(item.imageKey, {
    status: 'completed',
    candidateFile: reviewRel,
    error: undefined,
  });
  writeStepReviewPackage({
    item,
    status: 'completed',
    provider: provider.name,
    notes: 'Awaiting approval — not copied to assets/recipe-steps',
    prompt: promptBody,
  });
  console.log(`  [review] ${reviewRel}`);
  return { ok: true, failed: false, reviewPath: reviewRel };
}

export async function runStepGenerate(
  options: StepGenerateOptions = {},
): Promise<StepGenerateResult> {
  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  const provider = createImageProvider(env, PATHS.appRoot);

  let queue = loadStepQueue();
  if (!queue) {
    throw new Error(
      'Missing step queue. Run: npm run step:queue -- --from=001 --to=050 --missing-only',
    );
  }

  const keySet = options.keys?.length ? new Set(options.keys) : undefined;
  const recipeSet = options.recipeIds?.length
    ? new Set(options.recipeIds)
    : undefined;
  const targets = queue.items.filter((item) =>
    shouldGenerate(item, {
      missingOnly: options.missingOnly,
      resume: options.resume,
      force: options.force,
      keys: keySet,
      recipeIds: recipeSet,
    }),
  );
  const skipped = queue.items.length - targets.length;

  console.log(`Provider: ${provider.name}`);
  console.log(`Targets: ${targets.length} · skipped: ${skipped}`);
  console.log(
    `Batch: ${options.batchSize ?? DEFAULT_BATCH_SIZE} · concurrency: ${options.concurrency ?? DEFAULT_CONCURRENCY}`,
  );

  if (options.dryRun) {
    for (const t of targets.slice(0, 20)) {
      console.log(`  [dry] ${t.imageKey}`);
    }
    return {
      written: 0,
      skipped,
      failed: 0,
      providerStatus: 'dry-run',
      providerName: provider.name,
      reviewPaths: [],
    };
  }

  if (!gate.ready || !provider.isConfigured) {
    printProviderNotConfigured(gate);
    for (const t of targets.slice(0, 15)) {
      console.log(
        `  [pending] ${t.imageKey} — ${t.recipeName} step ${t.stepOrder}`,
      );
    }
    if (targets.length > 15) {
      console.log(`  … +${targets.length - 15} more`);
    }
    return {
      written: 0,
      skipped,
      failed: 0,
      providerStatus:
        !gate.ready && gate.status === 'API_KEY_MISSING'
          ? 'API_KEY_MISSING'
          : 'PROVIDER_NOT_CONFIGURED',
      providerName: provider.name,
      reviewPaths: [],
    };
  }

  let written = 0;
  let failed = 0;
  const reviewPaths: string[] = [];
  const batches = chunkArray(
    targets,
    options.batchSize ?? DEFAULT_BATCH_SIZE,
  );

  const mutate = (key: string, patch: Partial<StepQueueItem>) => {
    queue = updateQueueItem(queue!, key, patch);
    writeStepQueue(queue);
  };

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`\n--- Batch ${b + 1}/${batches.length} (${batch.length}) ---`);
    const results = await mapWithConcurrency(
      batch,
      options.concurrency ?? DEFAULT_CONCURRENCY,
      async (item) => {
        try {
          return await generateOne(item, provider, mutate);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          mutate(item.imageKey, { status: 'failed', error: message });
          console.log(`  [fail] ${item.imageKey}: ${message}`);
          return { ok: false, failed: true };
        }
      },
    );
    for (const r of results) {
      if (r.ok) {
        written += 1;
        if (r.reviewPath) reviewPaths.push(r.reviewPath);
      }
      if (r.failed) failed += 1;
    }
  }

  queue = loadStepQueue() ?? queue;
  writeStepReviewHtml(queue!);
  return {
    written,
    skipped,
    failed,
    providerStatus: 'ok',
    providerName: provider.name,
    reviewPaths,
  };
}
