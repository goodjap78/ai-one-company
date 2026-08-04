/**
 * Review workspace for combo hero candidates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { ComboAssetStatus, ComboQueueItem } from './types';

export function reviewImagePath(imageKey: string): string {
  return path.join(PATHS.reviewDir, `${imageKey}.jpg`);
}

export function reviewRelative(imageKey: string): string {
  return `generated/combo-factory/review/${imageKey}.jpg`;
}

export function reviewMetaPath(imageKey: string): string {
  return path.join(PATHS.reviewDir, imageKey, 'meta.json');
}

export function writeComboReviewPackage(input: {
  item: ComboQueueItem;
  status: ComboAssetStatus;
  provider?: string;
  notes?: string;
  prompt?: string;
}): void {
  const dir = path.join(PATHS.reviewDir, input.item.imageKey);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const meta = {
    comboId: input.item.comboId,
    imageKey: input.item.imageKey,
    title: input.item.title,
    comboKind: input.item.comboKind,
    items: input.item.items,
    status: input.status,
    provider: input.provider,
    notes: input.notes,
    candidateRelative: reviewRelative(input.item.imageKey),
    productionRelative: `assets/convenience-combos/${input.item.outputFilename}`,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(reviewMetaPath(input.item.imageKey), JSON.stringify(meta, null, 2));

  if (input.prompt) {
    fs.writeFileSync(
      path.join(dir, 'prompt-used.md'),
      [`# Prompt — ${input.item.title}`, '', '```', input.prompt, '```', ''].join('\n'),
      'utf8',
    );
  }

  fs.writeFileSync(
    path.join(dir, 'PREVIEW.md'),
    [
      `# Review — ${input.item.title}`,
      '',
      '| Field | Value |',
      '| --- | --- |',
      `| comboId | \`${input.item.comboId}\` |`,
      `| imageKey | \`${input.item.imageKey}\` |`,
      `| status | **${input.status}** |`,
      '',
      '```bash',
      `npm run combo:approve -- --key=${input.item.imageKey}`,
      `npm run combo:approve -- --key=${input.item.imageKey} --decision=reject`,
      `npm run combo:approve -- --key=${input.item.imageKey} --decision=regenerate --force`,
      '```',
      '',
    ].join('\n'),
    'utf8',
  );
}
