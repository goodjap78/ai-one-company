/**
 * Build / persist combo image queue from manifest.
 */
import fs from 'node:fs';
import { PATHS } from './config';
import type {
  ComboAssetStatus,
  ComboManifest,
  ComboQueueFile,
  ComboQueueItem,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function countTotals(items: ComboQueueItem[]): ComboQueueFile['totals'] {
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

export function loadComboQueue(): ComboQueueFile | null {
  if (!fs.existsSync(PATHS.imageQueue)) return null;
  return JSON.parse(fs.readFileSync(PATHS.imageQueue, 'utf8')) as ComboQueueFile;
}

export function writeComboQueue(queue: ComboQueueFile): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  queue.totals = countTotals(queue.items);
  queue.generatedAt = nowIso();
  fs.writeFileSync(PATHS.imageQueue, JSON.stringify(queue, null, 2), 'utf8');
  return PATHS.imageQueue;
}

function preserveStatus(
  manifestStatus: ComboAssetStatus,
  previous?: ComboQueueItem,
): ComboAssetStatus {
  if (!previous) return manifestStatus === 'missing' ? 'queued' : manifestStatus;
  if (
    previous.status === 'completed' ||
    previous.status === 'failed' ||
    previous.status === 'rejected' ||
    previous.status === 'processing'
  ) {
    if (manifestStatus === 'approved') return 'approved';
    return previous.status;
  }
  if (previous.status === 'approved' && manifestStatus === 'approved') {
    return 'approved';
  }
  return manifestStatus === 'missing' ? 'queued' : manifestStatus;
}

export function buildComboQueue(
  manifest: ComboManifest,
  providerHint: string,
  options: { missingOnly?: boolean } = {},
): ComboQueueFile {
  const previous = loadComboQueue();
  const prevByKey = new Map(
    (previous?.items ?? []).map((i) => [i.imageKey, i] as const),
  );

  const items: ComboQueueItem[] = manifest.items.map((entry) => {
    const prev = prevByKey.get(entry.imageKey);
    const status = preserveStatus(entry.status, prev);
    return {
      comboId: entry.comboId,
      imageKey: entry.imageKey,
      title: entry.title,
      comboKind: entry.comboKind,
      items: entry.items,
      outputFilename: entry.outputFilename,
      promptFile: entry.promptFile,
      status,
      updatedAt:
        prev?.updatedAt && status === prev.status ? prev.updatedAt : nowIso(),
      error: status === 'failed' ? prev?.error : undefined,
      candidateFile:
        prev?.candidateFile ??
        `generated/combo-factory/review/${entry.imageKey}.jpg`,
    };
  });

  return {
    generatedAt: nowIso(),
    sprint: manifest.sprint,
    pilotOnly: manifest.pilotOnly,
    scope: manifest.scope,
    providerHint,
    missingOnly: Boolean(options.missingOnly),
    totals: countTotals(items),
    items,
  };
}

export function updateQueueItem(
  queue: ComboQueueFile,
  imageKey: string,
  patch: Partial<ComboQueueItem>,
): ComboQueueFile {
  const items = queue.items.map((item) =>
    item.imageKey === imageKey
      ? { ...item, ...patch, updatedAt: nowIso() }
      : item,
  );
  return { ...queue, items, totals: countTotals(items) };
}
