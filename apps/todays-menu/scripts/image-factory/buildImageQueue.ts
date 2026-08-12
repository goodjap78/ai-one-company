/**
 * STEP 1–2 — Build image queue from hero-images.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { HeroFactoryManifest, HeroManifestEntry } from './types';
import type { ImageQueueFile, ImageQueueItem, ImageQueueStatus } from './queueTypes';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';

function nowIso(): string {
  return new Date().toISOString();
}

function productionExists(heroImageKey: string): boolean {
  const abs = path.join(PATHS.mealAssetsDir, `${heroImageKey}.jpg`);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function reviewMetaStatus(heroImageKey: string): ImageQueueStatus | null {
  const metaPath = path.join(PATHS.reviewDir, heroImageKey, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as {
      status?: ImageQueueStatus;
    };
    return meta.status ?? null;
  } catch {
    return null;
  }
}

/**
 * Preserve prior queue decisions when rebuilding from manifest.
 */
export function resolveInitialStatus(
  entry: HeroManifestEntry,
  previous?: ImageQueueItem,
): ImageQueueStatus {
  if (previous) {
    if (
      previous.status === 'approved' ||
      previous.status === 'rejected' ||
      previous.status === 'completed' ||
      previous.status === 'failed' ||
      previous.status === 'processing'
    ) {
      return previous.status;
    }
  }

  const reviewStatus = reviewMetaStatus(entry.heroImageKey);
  if (reviewStatus) return reviewStatus;

  // Production file + registry entry = published (approved).
  // File alone (post-generate, pre-approve) is NOT approved.
  if (productionExists(entry.heroImageKey)) {
    const registered = getRegisteredMealKeySet();
    if (registered.has(entry.heroImageKey)) {
      return 'approved';
    }
    // Staging on disk awaiting review/approval
    return 'completed';
  }

  return 'queued';
}

let _registeredCache: Set<string> | null = null;

function getRegisteredMealKeySet(): Set<string> {
  if (_registeredCache) return _registeredCache;
  try {
    _registeredCache = new Set(parseRegisteredMealKeys());
  } catch {
    _registeredCache = new Set();
  }
  return _registeredCache;
}

/** Call after registry writes so the next queue rebuild sees fresh keys. */
export function clearRegisteredMealKeyCache(): void {
  _registeredCache = null;
}

export function loadHeroManifest(
  manifestPath = PATHS.heroManifest,
): HeroFactoryManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Missing ${path.relative(PATHS.appRoot, manifestPath)}. Run: npm run image-factory:prepare`,
    );
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as HeroFactoryManifest;
}

export function loadImageQueue(
  queuePath = PATHS.imageQueue,
): ImageQueueFile | null {
  if (!fs.existsSync(queuePath)) return null;
  return JSON.parse(fs.readFileSync(queuePath, 'utf8')) as ImageQueueFile;
}

export function countTotals(items: ImageQueueItem[]): ImageQueueFile['totals'] {
  const totals = {
    recipes: items.length,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    approved: 0,
    rejected: 0,
  };
  for (const item of items) {
    totals[item.status] += 1;
  }
  return totals;
}

export function buildImageQueue(options?: {
  providerHint?: string;
}): ImageQueueFile {
  const manifest = loadHeroManifest();
  const previous = loadImageQueue();
  const prevById = new Map(
    (previous?.items ?? []).map((i) => [i.recipeId, i] as const),
  );

  const stamp = nowIso();
  const items: ImageQueueItem[] = manifest.items.map((entry) => {
    const prev = prevById.get(entry.recipeId);
    const status = resolveInitialStatus(entry, prev);
    return {
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      heroImageKey: entry.heroImageKey,
      promptFile: `generated/image-factory/prompts/${entry.promptFilename}`,
      outputFile: `assets/meals/${entry.outputFilename}`,
      status,
      updatedAt: prev?.updatedAt && status === prev.status ? prev.updatedAt : stamp,
      error: status === 'failed' ? prev?.error : undefined,
      reviewDir: `generated/image-factory/review/${entry.heroImageKey}`,
      candidateFile: `generated/image-factory/review/${entry.recipeId}-${entry.heroImageKey}.jpg`,
    };
  });

  return {
    generatedAt: stamp,
    sprint: 'IMG-2',
    sourceManifest: path.relative(PATHS.appRoot, PATHS.heroManifest),
    providerHint: options?.providerHint ?? process.env.IMAGE_PROVIDER ?? 'disabled',
    totals: countTotals(items),
    items,
  };
}

export function writeImageQueue(queue: ImageQueueFile): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  queue.totals = countTotals(queue.items);
  queue.generatedAt = nowIso();
  fs.writeFileSync(PATHS.imageQueue, JSON.stringify(queue, null, 2), 'utf8');
  return path.relative(PATHS.appRoot, PATHS.imageQueue);
}

export function updateQueueItem(
  queue: ImageQueueFile,
  recipeId: string,
  patch: Partial<ImageQueueItem>,
): ImageQueueFile {
  const items = queue.items.map((item) =>
    item.recipeId === recipeId
      ? { ...item, ...patch, updatedAt: nowIso() }
      : item,
  );
  return { ...queue, items, totals: countTotals(items) };
}
