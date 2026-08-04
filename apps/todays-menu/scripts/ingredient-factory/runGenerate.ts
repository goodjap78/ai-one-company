/**
 * Generate ingredient review images (batches of 10, concurrency 2).
 * Never writes assets/ingredients until approve.
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
  loadIngredientQueue,
  updateQueueItem,
  writeIngredientQueue,
} from './buildQueue';
import { extractPromptBody } from './buildPrompts';
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_CONCURRENCY,
  INGREDIENT_IMAGE_SPEC,
  PATHS,
} from './config';
import {
  reviewImagePath,
  reviewRelative,
  writeIngredientReviewPackage,
} from './reviewStore';
import type { IngredientQueueItem } from './types';
import { writeIngredientReviewHtml } from './writeReviewHtml';

function shouldGenerate(
  item: IngredientQueueItem,
  options: { missingOnly?: boolean; resume?: boolean; force?: boolean; keys?: Set<string> },
): boolean {
  if (options.keys && !options.keys.has(item.iconKey)) return false;
  if (options.force) return true;
  if (item.status === 'approved') return false;
  if (item.status === 'existing_unregistered' && !options.force) return false;
  if (item.status === 'completed') return false;
  if (item.status === 'rejected') return false;
  if (options.missingOnly) {
    return (
      item.status === 'queued' ||
      item.status === 'missing' ||
      item.status === 'failed' ||
      (item.status === 'processing' && Boolean(options.resume))
    );
  }
  return (
    item.status === 'queued' ||
    item.status === 'missing' ||
    item.status === 'failed' ||
    (item.status === 'processing' && Boolean(options.resume))
  );
}

export type IngredientGenerateOptions = {
  missingOnly?: boolean;
  resume?: boolean;
  force?: boolean;
  keys?: string[];
  batchSize?: number;
  concurrency?: number;
  dryRun?: boolean;
};

export type IngredientGenerateResult = {
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
  item: IngredientQueueItem,
  provider: ImageProvider,
  mutate: (key: string, patch: Partial<IngredientQueueItem>) => void,
): Promise<{ ok: boolean; failed: boolean; reviewPath?: string }> {
  mutate(item.iconKey, { status: 'processing', error: undefined });

  const promptAbs = path.join(PATHS.appRoot, item.promptFile);
  const promptBody =
    extractPromptBody(promptAbs) ??
    `HANKKI Official Ingredient Icon Style v1.0. Premium 3D illustration icon of ${item.koreanName} (${item.iconKey}). Soft rounded shape; centered; warm cream or transparent background; square 1:1; no text, logo, or watermark.`;

  const request = {
    assetKey: item.iconKey,
    subject: item.koreanName,
    prompt: promptBody,
    width: INGREDIENT_IMAGE_SPEC.width,
    height: INGREDIENT_IMAGE_SPEC.height,
    format: INGREDIENT_IMAGE_SPEC.format,
  };

  console.log(`  [gen] ${item.iconKey} (${item.koreanName})…`);
  let result;
  try {
    result = await provider.generateImage(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mutate(item.iconKey, { status: 'failed', error: message });
    writeIngredientReviewPackage({
      item,
      status: 'failed',
      provider: provider.name,
      notes: message,
      prompt: promptBody,
    });
    console.log(`  [fail] ${item.iconKey}: ${message}`);
    return { ok: false, failed: true };
  }

  if (result.status !== 'ok' || !result.bytes) {
    const err = result.error ?? 'generation failed';
    mutate(item.iconKey, { status: 'failed', error: err });
    writeIngredientReviewPackage({
      item,
      status: 'failed',
      provider: provider.name,
      notes: err,
      prompt: promptBody,
    });
    console.log(`  [fail] ${item.iconKey}: ${err}`);
    return { ok: false, failed: true };
  }

  const reviewAbs = reviewImagePath(item.iconKey);
  const saved = saveImageFile({
    bytes: result.bytes,
    absolutePath: reviewAbs,
    force: true,
  });
  if (saved.status === 'error') {
    mutate(item.iconKey, { status: 'failed', error: saved.error });
    console.log(`  [fail] ${item.iconKey}: ${saved.error}`);
    return { ok: false, failed: true };
  }

  const reviewRel = reviewRelative(item.iconKey);
  mutate(item.iconKey, {
    status: 'completed',
    candidateFile: reviewRel,
    error: undefined,
  });
  writeIngredientReviewPackage({
    item,
    status: 'completed',
    provider: provider.name,
    notes: 'Awaiting approval — not copied to assets/ingredients',
    prompt: promptBody,
  });
  console.log(`  [review] ${reviewRel}`);
  return { ok: true, failed: false, reviewPath: reviewRel };
}

export async function runIngredientGenerate(
  options: IngredientGenerateOptions = {},
): Promise<IngredientGenerateResult> {
  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  const provider = createImageProvider(env, PATHS.appRoot);

  let queue = loadIngredientQueue();
  if (!queue) {
    throw new Error(
      'Missing image-queue.json. Run: npm run ingredient:queue -- --from=001 --to=050',
    );
  }

  const keySet = options.keys?.length ? new Set(options.keys) : undefined;
  const targets = queue.items.filter((item) =>
    shouldGenerate(item, {
      missingOnly: options.missingOnly,
      resume: options.resume,
      force: options.force,
      keys: keySet,
    }),
  );
  const skipped = queue.items.length - targets.length;

  console.log(`Provider: ${provider.name}`);
  console.log(`Targets: ${targets.length} · skipped: ${skipped}`);
  console.log(
    `Batch: ${options.batchSize ?? DEFAULT_BATCH_SIZE} · concurrency: ${options.concurrency ?? DEFAULT_CONCURRENCY}`,
  );

  if (options.dryRun) {
    for (const t of targets) {
      console.log(`  [dry] ${t.iconKey}`);
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
    for (const t of targets.slice(0, 20)) {
      console.log(`  [pending] ${t.iconKey} — ${t.koreanName}`);
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

  const mutate = (key: string, patch: Partial<IngredientQueueItem>) => {
    queue = updateQueueItem(queue!, key, patch);
    writeIngredientQueue(queue);
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
          const message = error instanceof Error ? error.message : String(error);
          mutate(item.iconKey, { status: 'failed', error: message });
          console.log(`  [fail] ${item.iconKey}: ${message}`);
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

  queue = loadIngredientQueue() ?? queue;
  writeIngredientReviewHtml(queue!);
  return {
    written,
    skipped,
    failed,
    providerStatus: 'ok',
    providerName: provider.name,
    reviewPaths,
  };
}
