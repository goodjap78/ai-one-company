/**
 * Build / persist ingredient image queue from manifest.
 */
import fs from 'node:fs';
import { PATHS } from './config';
import type {
  IngredientAssetStatus,
  IngredientManifest,
  IngredientQueueFile,
  IngredientQueueItem,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function countTotals(
  items: IngredientQueueItem[],
): IngredientQueueFile['totals'] {
  const totals = {
    total: items.length,
    approved: 0,
    existing_unregistered: 0,
    queued: 0,
    missing: 0,
    completed: 0,
    failed: 0,
    rejected: 0,
    processing: 0,
  };
  for (const item of items) {
    const key = item.status as keyof typeof totals;
    if (key in totals && key !== 'total') {
      totals[key] += 1;
    }
  }
  return totals;
}

export function loadIngredientQueue(): IngredientQueueFile | null {
  if (!fs.existsSync(PATHS.imageQueue)) return null;
  return JSON.parse(
    fs.readFileSync(PATHS.imageQueue, 'utf8'),
  ) as IngredientQueueFile;
}

export function writeIngredientQueue(queue: IngredientQueueFile): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  queue.totals = countTotals(queue.items);
  queue.generatedAt = nowIso();
  fs.writeFileSync(PATHS.imageQueue, JSON.stringify(queue, null, 2), 'utf8');
  return PATHS.imageQueue;
}

function preserveStatus(
  manifestStatus: IngredientAssetStatus,
  previous?: IngredientQueueItem,
): IngredientAssetStatus {
  if (!previous) return manifestStatus === 'missing' ? 'queued' : manifestStatus;

  // Preserve human / pipeline decisions
  if (
    previous.status === 'completed' ||
    previous.status === 'failed' ||
    previous.status === 'rejected' ||
    previous.status === 'processing'
  ) {
    // Remount approved if disk+registry now say approved
    if (manifestStatus === 'approved') return 'approved';
    return previous.status;
  }

  if (previous.status === 'approved' && manifestStatus === 'approved') {
    return 'approved';
  }

  return manifestStatus === 'missing' ? 'queued' : manifestStatus;
}

export function buildIngredientQueue(
  manifest: IngredientManifest,
  providerHint: string,
  options: { missingOnly?: boolean } = {},
): IngredientQueueFile {
  const previous = loadIngredientQueue();
  const prevByKey = new Map(
    (previous?.items ?? []).map((i) => [i.iconKey, i] as const),
  );

  const items: IngredientQueueItem[] = manifest.items.map((entry) => {
    const prev = prevByKey.get(entry.iconKey);
    const status = preserveStatus(entry.status, prev);
    return {
      iconKey: entry.iconKey,
      koreanName: entry.koreanName,
      aliases: entry.aliases,
      usedByRecipeIds: entry.usedByRecipeIds,
      outputFilename: entry.outputFilename,
      promptFile: entry.promptFile,
      status,
      updatedAt:
        prev?.updatedAt && status === prev.status ? prev.updatedAt : nowIso(),
      error: status === 'failed' ? prev?.error : undefined,
      candidateFile:
        prev?.candidateFile ??
        `generated/ingredient-factory/review/${entry.iconKey}.png`,
    };
  });

  return {
    generatedAt: nowIso(),
    sprint: 'ING-2',
    fromId: manifest.fromId,
    toId: manifest.toId,
    providerHint,
    missingOnly: Boolean(options.missingOnly),
    totals: countTotals(items),
    items,
  };
}

export function updateQueueItem(
  queue: IngredientQueueFile,
  iconKey: string,
  patch: Partial<IngredientQueueItem>,
): IngredientQueueFile {
  const items = queue.items.map((item) =>
    item.iconKey === iconKey
      ? { ...item, ...patch, updatedAt: nowIso() }
      : item,
  );
  return { ...queue, items, totals: countTotals(items) };
}
