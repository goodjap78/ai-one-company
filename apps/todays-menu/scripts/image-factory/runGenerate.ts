/**
 * Sprint IMG-2B / IMG-3 — generate heroes via connected ImageProvider.
 *
 * IMG-3 batch mode:
 *   npm run hero:generate -- --from=001 --to=050 --resume
 *   batches of 5 · max concurrency 2 · fail one → continue
 *
 * Review only — never assets/meals until hero:approve.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildImageQueue,
  loadImageQueue,
  updateQueueItem,
  writeImageQueue,
} from './buildImageQueue';
import { HERO_IMAGE_EXTENSION, PATHS } from './config';
import {
  buildHeroGenerateRequest,
  createImageProvider,
  getProviderEnv,
  normalizeHeroBytes,
  saveImageFile,
  type ImageProvider,
} from './engine';
import type { ImageQueueFile, ImageQueueItem } from './queueTypes';
import {
  checkProviderGate,
  printProviderNotConfigured,
} from './providerGate';
import {
  chunkArray,
  mapWithConcurrency,
  parseRecipeIdNum,
} from './recipeIdRange';
import {
  candidatePathFor,
  flatReviewImagePath,
  flatReviewRelative,
  writeReviewPackage,
} from './reviewStore';
import { shouldSkipHeroGenerate } from './skipRules';
import { writeReviewIndexHtml } from './writeReviewHtml';

const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_CONCURRENCY = 2;

function extractPromptBody(promptMdPath: string): string | undefined {
  if (!fs.existsSync(promptMdPath)) return undefined;
  const text = fs.readFileSync(promptMdPath, 'utf8');
  const fenced = text.match(/## Prompt\s*```(?:[^\n]*)\r?\n([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  const after = text.split(/## Prompt\s*/i)[1];
  if (!after) return undefined;
  return after.replace(/```/g, '').trim() || undefined;
}

export type GenerateOptions = {
  force?: boolean;
  limit?: number;
  recipeIds?: string[];
  fromId?: string;
  toId?: string;
  resume?: boolean;
  batchSize?: number;
  concurrency?: number;
  dryRun?: boolean;
  skipReviewHtml?: boolean;
  /** Default false — production only via approve. */
  writeAssets?: boolean;
  /**
   * Sprint REVIEW-2 — optional regeneration feedback appended to Gemini prompt.
   * Only meaningful when generating a single recipe (e.g. Content Center regenerate).
   */
  feedbackAppend?: string;
};

export type GenerateRunResult = {
  processed: number;
  written: number;
  assetsWritten: number;
  skipped: number;
  failed: number;
  disabled: boolean;
  providerStatus:
    | 'ok'
    | 'PROVIDER_NOT_CONFIGURED'
    | 'API_KEY_MISSING'
    | 'dry-run';
  providerName: string;
  reviewPaths: string[];
  skipReasons: Array<{ recipeId: string; reason: string }>;
  queueStatuses: Array<{ recipeId: string; status: string }>;
  range?: { from: string; to: string };
};

type QueueLock = {
  queue: ImageQueueFile;
  apply: (
    recipeId: string,
    patch: Partial<ImageQueueItem>,
  ) => ImageQueueFile;
};

function createQueueLock(initial: ImageQueueFile): QueueLock {
  let queue = initial;
  return {
    get queue() {
      return queue;
    },
    apply(recipeId, patch) {
      queue = updateQueueItem(queue, recipeId, patch);
      writeImageQueue(queue);
      return queue;
    },
  };
}

async function generateOne(
  item: ImageQueueItem,
  ctx: {
    provider: ImageProvider;
    lock: QueueLock;
    writeAssets: boolean;
    force: boolean;
    feedbackAppend?: string;
  },
): Promise<{
  recipeId: string;
  ok: boolean;
  failed: boolean;
  assetsWritten: number;
  skippedAsset: boolean;
  reviewPath?: string;
  error?: string;
  promptUsed?: string;
}> {
  ctx.lock.apply(item.recipeId, { status: 'processing', error: undefined });

  const promptAbs = path.join(PATHS.appRoot, item.promptFile);
  if (!fs.existsSync(promptAbs)) {
    ctx.lock.apply(item.recipeId, {
      status: 'failed',
      error: `Missing prompt file: ${item.promptFile}`,
    });
    writeReviewPackage({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      status: 'failed',
      provider: ctx.provider.name,
      notes: `Missing prompt: ${item.promptFile}`,
    });
    return {
      recipeId: item.recipeId,
      ok: false,
      failed: true,
      assetsWritten: 0,
      skippedAsset: false,
      error: 'missing prompt',
    };
  }

  const promptBody = extractPromptBody(promptAbs);
  const request = buildHeroGenerateRequest({
    recipeName: item.recipeName,
    heroImageKey: item.heroImageKey,
    promptBody,
    feedbackAppend: ctx.feedbackAppend,
  });

  console.log(`  [gen] ${item.recipeId} ${item.recipeName}…`);
  let result;
  try {
    result = await ctx.provider.generateImage(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.lock.apply(item.recipeId, { status: 'failed', error: message });
    writeReviewPackage({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      status: 'failed',
      provider: ctx.provider.name,
      notes: message,
    });
    console.log(`  [fail] ${item.recipeId}: ${message}`);
    return {
      recipeId: item.recipeId,
      ok: false,
      failed: true,
      assetsWritten: 0,
      skippedAsset: false,
      error: message,
    };
  }

  if (result.status !== 'ok' || !result.bytes) {
    const err = result.error ?? 'generation failed';
    ctx.lock.apply(item.recipeId, { status: 'failed', error: err });
    writeReviewPackage({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      status: 'failed',
      provider: ctx.provider.name,
      notes: err,
    });
    console.log(`  [fail] ${item.recipeId}: ${err}`);
    return {
      recipeId: item.recipeId,
      ok: false,
      failed: true,
      assetsWritten: 0,
      skippedAsset: false,
      error: err,
    };
  }

  let normalizedBytes: Buffer;
  try {
    normalizedBytes = await normalizeHeroBytes(result.bytes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'normalize hero bytes failed';
    ctx.lock.apply(item.recipeId, { status: 'failed', error: message });
    writeReviewPackage({
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      heroImageKey: item.heroImageKey,
      status: 'failed',
      provider: ctx.provider.name,
      notes: message,
    });
    console.log(`  [fail] ${item.recipeId}: ${message}`);
    return {
      recipeId: item.recipeId,
      ok: false,
      failed: true,
      assetsWritten: 0,
      skippedAsset: false,
      error: message,
    };
  }

  const flatAbs = flatReviewImagePath(item.recipeId, item.heroImageKey);
  const flatSaved = saveImageFile({
    bytes: normalizedBytes,
    absolutePath: flatAbs,
    force: true,
  });
  if (flatSaved.status === 'error') {
    ctx.lock.apply(item.recipeId, {
      status: 'failed',
      error: flatSaved.error,
    });
    console.log(`  [fail] review ${item.recipeId}: ${flatSaved.error}`);
    return {
      recipeId: item.recipeId,
      ok: false,
      failed: true,
      assetsWritten: 0,
      skippedAsset: false,
      error: flatSaved.error,
    };
  }

  saveImageFile({
    bytes: normalizedBytes,
    absolutePath: candidatePathFor(item.heroImageKey),
    force: true,
  });

  // Persist prompt used alongside review package
  const promptCopy = path.join(
    PATHS.reviewDir,
    item.heroImageKey,
    'prompt-used.md',
  );
  fs.mkdirSync(path.dirname(promptCopy), { recursive: true });
  fs.writeFileSync(
    promptCopy,
    [
      `# Prompt used — ${item.recipeName}`,
      '',
      `recipeId: ${item.recipeId}`,
      `heroImageKey: ${item.heroImageKey}`,
      `source: ${item.promptFile}`,
      '',
      '```',
      request.prompt,
      '```',
      '',
    ].join('\n'),
    'utf8',
  );

  const reviewRel = flatReviewRelative(item.recipeId, item.heroImageKey);
  console.log(`  [review] ${reviewRel}`);

  let assetsWritten = 0;
  let skippedAsset = false;
  if (ctx.writeAssets) {
    const productionAbs = path.join(
      PATHS.mealAssetsDir,
      `${item.heroImageKey}.${HERO_IMAGE_EXTENSION}`,
    );
    const assetSaved = saveImageFile({
      bytes: normalizedBytes,
      absolutePath: productionAbs,
      force: ctx.force,
    });
    if (assetSaved.status === 'written') {
      assetsWritten = 1;
      console.log(`  [asset] wrote ${item.outputFile}`);
    } else if (assetSaved.status === 'skipped_exists') {
      skippedAsset = true;
      console.log(`  [asset] skip exists ${item.outputFile} (use --force)`);
    } else {
      ctx.lock.apply(item.recipeId, {
        status: 'failed',
        error: assetSaved.error,
      });
      return {
        recipeId: item.recipeId,
        ok: false,
        failed: true,
        assetsWritten: 0,
        skippedAsset: false,
        error: assetSaved.error,
      };
    }
  } else {
    console.log('  [asset] skipped — await hero:approve');
  }

  ctx.lock.apply(item.recipeId, {
    status: 'completed',
    candidateFile: reviewRel,
    error: undefined,
  });
  writeReviewPackage({
    recipeId: item.recipeId,
    recipeName: item.recipeName,
    heroImageKey: item.heroImageKey,
    status: 'completed',
    provider: ctx.provider.name,
    notes:
      'Awaiting human approval — not copied to assets/meals until hero:approve',
  });
  console.log(`  [ok] ${item.recipeId} → review only`);

  return {
    recipeId: item.recipeId,
    ok: true,
    failed: false,
    assetsWritten,
    skippedAsset,
    reviewPath: reviewRel,
    promptUsed: request.prompt,
  };
}

function resolveScopedItems(
  queue: ImageQueueFile,
  options: GenerateOptions,
): {
  scoped: ImageQueueItem[];
  targets: ImageQueueItem[];
  skipReasons: Array<{ recipeId: string; reason: string }>;
  range?: { from: string; to: string };
} {
  let scoped = queue.items;
  let range: { from: string; to: string } | undefined;

  if (options.fromId && options.toId) {
    const from = parseRecipeIdNum(options.fromId);
    const to = parseRecipeIdNum(options.toId);
    if (from == null || to == null) {
      throw new Error(
        `Invalid recipe range: --from=${options.fromId} --to=${options.toId}`,
      );
    }
    scoped = queue.items.filter((i) => {
      const n = parseRecipeIdNum(i.recipeId);
      return n != null && n >= from && n <= to;
    });
    range = { from: options.fromId, to: options.toId };
  } else if (options.recipeIds?.length) {
    const set = new Set(options.recipeIds);
    scoped = queue.items.filter((i) => set.has(i.recipeId));
  }

  const skipReasons: Array<{ recipeId: string; reason: string }> = [];
  const targets: ImageQueueItem[] = [];

  const allowReviewRegen = Boolean(options.recipeIds?.length);

  for (const item of scoped) {
    const decision = shouldSkipHeroGenerate(item, {
      force: options.force,
      resume: options.resume,
      allowReviewRegen,
    });
    if (decision.skip) {
      skipReasons.push({ recipeId: item.recipeId, reason: decision.reason });
    } else {
      targets.push(item);
    }
  }

  return { scoped, targets, skipReasons, range };
}

export async function runHeroGenerate(
  options: GenerateOptions = {},
): Promise<GenerateRunResult> {
  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  const provider = createImageProvider(env, PATHS.appRoot);
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  let queue = buildImageQueue({
    providerHint: gate.ready ? gate.provider : 'disabled',
  });
  writeImageQueue(queue);

  const { scoped, targets: rawTargets, skipReasons, range } = resolveScopedItems(
    queue,
    options,
  );

  if (
    (options.fromId || options.toId || options.recipeIds?.length) &&
    scoped.length === 0
  ) {
    throw new Error(
      'No queue items in requested range/recipe filter. Check hero-images.json.',
    );
  }

  let targets = rawTargets;
  if (options.limit && options.limit > 0) {
    targets = targets.slice(0, options.limit);
  }

  console.log(`Provider: ${provider.name} (configured=${provider.isConfigured})`);
  console.log(`IMAGE_PROVIDER=${env.provider ?? '(unset)'}`);
  if ((env.provider ?? '').toLowerCase() === 'gemini') {
    console.log(`GEMINI_API_KEY=${env.geminiApiKey ? '(set)' : '(unset)'}`);
  } else {
    console.log(`IMAGE_API_KEY=${env.openaiApiKey || env.apiKey ? '(set)' : '(unset)'}`);
  }
  if (range) console.log(`Range: ${range.from}–${range.to}`);
  console.log(`Scoped: ${scoped.length} · skip: ${skipReasons.length} · generate: ${targets.length}`);
  console.log(`Batch size: ${batchSize} · concurrency: ${concurrency}`);
  console.log(`Resume: ${Boolean(options.resume)}`);

  // Dry-run validates queue + prompts without requiring an API key.
  if (options.dryRun) {
    for (const item of targets.slice(0, 30)) {
      console.log(
        `  [dry] ${item.recipeId} ${item.recipeName} → ${flatReviewRelative(item.recipeId, item.heroImageKey)}`,
      );
    }
    return {
      processed: 0,
      written: 0,
      assetsWritten: 0,
      skipped: skipReasons.length,
      failed: 0,
      disabled: false,
      providerStatus: 'dry-run',
      providerName: provider.name,
      reviewPaths: [],
      skipReasons,
      queueStatuses: scoped.map((i) => ({
        recipeId: i.recipeId,
        status: i.status,
      })),
      range,
    };
  }

  if (!gate.ready || !provider.isConfigured) {
    printProviderNotConfigured(gate);
    console.log(
      `\nWould generate: ${targets.length} · skipped: ${skipReasons.length}`,
    );
    for (const s of skipReasons.slice(0, 15)) {
      console.log(`  [skip] ${s.recipeId}: ${s.reason}`);
    }
    if (skipReasons.length > 15) {
      console.log(`  … +${skipReasons.length - 15} more skips`);
    }
    for (const t of targets.slice(0, 20)) {
      console.log(`  [pending] ${t.recipeId} ${t.recipeName}`);
    }
    if (targets.length > 20) {
      console.log(`  … +${targets.length - 20} more pending`);
    }

    return {
      processed: 0,
      written: 0,
      assetsWritten: 0,
      skipped: skipReasons.length,
      failed: 0,
      disabled: true,
      providerStatus:
        !gate.ready && gate.status === 'API_KEY_MISSING'
          ? 'API_KEY_MISSING'
          : 'PROVIDER_NOT_CONFIGURED',
      providerName: provider.name,
      reviewPaths: [],
      skipReasons,
      queueStatuses: scoped.map((i) => ({
        recipeId: i.recipeId,
        status: i.status,
      })),
      range,
    };
  }

  const lock = createQueueLock(queue);
  let written = 0;
  let assetsWritten = 0;
  let skippedAssets = 0;
  let failed = 0;
  const reviewPaths: string[] = [];
  const batches = chunkArray(targets, batchSize);

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`\n--- Batch ${b + 1}/${batches.length} (${batch.length} recipes) ---`);

    const results = await mapWithConcurrency(batch, concurrency, async (item) => {
      try {
        return await generateOne(item, {
          provider,
          lock,
          writeAssets: options.writeAssets === true,
          force: Boolean(options.force),
          feedbackAppend: options.feedbackAppend,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lock.apply(item.recipeId, { status: 'failed', error: message });
        console.log(`  [fail] ${item.recipeId}: ${message}`);
        return {
          recipeId: item.recipeId,
          ok: false,
          failed: true,
          assetsWritten: 0,
          skippedAsset: false,
          error: message,
        };
      }
    });

    for (const r of results) {
      if (r.ok) {
        written += 1;
        if (r.reviewPath) reviewPaths.push(r.reviewPath);
      }
      if (r.failed) failed += 1;
      assetsWritten += r.assetsWritten;
      if (r.skippedAsset) skippedAssets += 1;
    }
  }

  queue = loadImageQueue() ?? lock.queue;

  if (!options.skipReviewHtml) {
    const htmlPath = writeReviewIndexHtml(queue);
    console.log(`\nReview HTML → ${htmlPath}`);
  }

  return {
    processed: targets.length,
    written,
    assetsWritten,
    skipped: skipReasons.length + skippedAssets,
    failed,
    disabled: false,
    providerStatus: 'ok',
    providerName: provider.name,
    reviewPaths,
    skipReasons,
    queueStatuses: scoped.map((i) => {
      const latest = queue.items.find((x) => x.recipeId === i.recipeId);
      return { recipeId: i.recipeId, status: latest?.status ?? i.status };
    }),
    range,
  };
}
