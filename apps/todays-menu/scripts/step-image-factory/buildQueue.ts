/**
 * Build / persist step image queue from manifest.
 */
import fs from 'node:fs';
import { PATHS } from './config';
import type {
  StepAssetStatus,
  StepManifest,
  StepQueueFile,
  StepQueueItem,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function countTotals(items: StepQueueItem[]): StepQueueFile['totals'] {
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
    if (key in totals && key !== 'total') totals[key] += 1;
  }
  return totals;
}

export function loadStepQueue(): StepQueueFile | null {
  if (!fs.existsSync(PATHS.imageQueue)) return null;
  return JSON.parse(fs.readFileSync(PATHS.imageQueue, 'utf8')) as StepQueueFile;
}

export function writeStepQueue(queue: StepQueueFile): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  queue.totals = countTotals(queue.items);
  queue.generatedAt = nowIso();
  fs.writeFileSync(PATHS.imageQueue, JSON.stringify(queue, null, 2), 'utf8');
  return PATHS.imageQueue;
}

function preserveStatus(
  manifestStatus: StepAssetStatus,
  previous?: StepQueueItem,
): StepAssetStatus {
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

export function buildStepQueue(
  manifest: StepManifest,
  providerHint: string,
  options: { missingOnly?: boolean } = {},
): StepQueueFile {
  const previous = loadStepQueue();
  const prevByKey = new Map(
    (previous?.items ?? []).map((i) => [i.imageKey, i] as const),
  );

  const items: StepQueueItem[] = manifest.items.map((entry) => {
    const prev = prevByKey.get(entry.imageKey);
    const status = preserveStatus(entry.status, prev);
    return {
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      stepOrder: entry.stepOrder,
      stepTitle: entry.stepTitle,
      stepInstruction: entry.stepInstruction,
      imageKey: entry.imageKey,
      outputFilename: entry.outputFilename,
      promptFile: entry.promptFile,
      status,
      visibleIngredients: entry.visibleIngredients,
      notYetIngredients: entry.notYetIngredients,
      updatedAt:
        prev?.updatedAt && status === prev.status ? prev.updatedAt : nowIso(),
      error: status === 'failed' ? prev?.error : undefined,
      candidateFile:
        prev?.candidateFile ??
        `generated/step-image-factory/review/${entry.imageKey}.jpg`,
    };
  });

  return {
    generatedAt: nowIso(),
    sprint: 'STEP-1',
    fromId: manifest.fromId,
    toId: manifest.toId,
    providerHint,
    missingOnly: Boolean(options.missingOnly),
    totals: countTotals(items),
    items,
  };
}

export function updateQueueItem(
  queue: StepQueueFile,
  imageKey: string,
  patch: Partial<StepQueueItem>,
): StepQueueFile {
  const items = queue.items.map((item) =>
    item.imageKey === imageKey
      ? { ...item, ...patch, updatedAt: nowIso() }
      : item,
  );
  return { ...queue, items, totals: countTotals(items) };
}
