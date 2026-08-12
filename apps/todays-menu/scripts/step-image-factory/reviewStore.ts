/**
 * Review workspace for step candidates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { StepAssetStatus, StepQueueItem } from './types';

export function reviewImagePath(imageKey: string): string {
  return path.join(PATHS.reviewDir, `${imageKey}.jpg`);
}

export function reviewRelative(imageKey: string): string {
  return `generated/step-image-factory/review/${imageKey}.jpg`;
}

export function writeStepReviewPackage(input: {
  item: StepQueueItem;
  status: StepAssetStatus;
  provider?: string;
  notes?: string;
  prompt?: string;
}): void {
  const dir = path.join(PATHS.reviewDir, input.item.imageKey);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const meta = {
    recipeId: input.item.recipeId,
    recipeName: input.item.recipeName,
    stepOrder: input.item.stepOrder,
    stepTitle: input.item.stepTitle,
    imageKey: input.item.imageKey,
    status: input.status,
    provider: input.provider,
    notes: input.notes,
    candidateRelative: reviewRelative(input.item.imageKey),
    productionRelative: `assets/recipe-steps/${input.item.outputFilename}`,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(dir, 'meta.json'),
    JSON.stringify(meta, null, 2),
    'utf8',
  );

  if (input.prompt) {
    fs.writeFileSync(
      path.join(dir, 'prompt-used.md'),
      [
        `# Prompt — ${input.item.recipeName} step ${input.item.stepOrder}`,
        '',
        '```',
        input.prompt,
        '```',
        '',
      ].join('\n'),
      'utf8',
    );
  }

  fs.writeFileSync(
    path.join(dir, 'PREVIEW.md'),
    [
      `# Review — ${input.item.recipeName} · step ${input.item.stepOrder}`,
      '',
      `| Field | Value |`,
      `| --- | --- |`,
      `| imageKey | \`${input.item.imageKey}\` |`,
      `| status | **${input.status}** |`,
      `| title | ${input.item.stepTitle} |`,
      '',
      input.item.stepInstruction,
      '',
      '```bash',
      `npm run step:approve -- --key=${input.item.imageKey}`,
      `npm run step:approve -- --key=${input.item.imageKey} --decision=reject`,
      `npm run step:approve -- --key=${input.item.imageKey} --decision=regenerate --force`,
      '```',
      '',
    ].join('\n'),
    'utf8',
  );
}
