/**
 * Review workspace for ingredient candidates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { IngredientAssetStatus, IngredientQueueItem } from './types';

export function reviewImagePath(iconKey: string): string {
  return path.join(PATHS.reviewDir, `${iconKey}.png`);
}

export function reviewRelative(iconKey: string): string {
  return `generated/ingredient-factory/review/${iconKey}.png`;
}

export function reviewMetaPath(iconKey: string): string {
  return path.join(PATHS.reviewDir, iconKey, 'meta.json');
}

export function writeIngredientReviewPackage(input: {
  item: IngredientQueueItem;
  status: IngredientAssetStatus;
  provider?: string;
  notes?: string;
  prompt?: string;
}): void {
  const dir = path.join(PATHS.reviewDir, input.item.iconKey);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const meta = {
    iconKey: input.item.iconKey,
    koreanName: input.item.koreanName,
    aliases: input.item.aliases,
    usedByRecipeIds: input.item.usedByRecipeIds,
    status: input.status,
    provider: input.provider,
    notes: input.notes,
    candidateRelative: reviewRelative(input.item.iconKey),
    productionRelative: `assets/ingredients/${input.item.outputFilename}`,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(reviewMetaPath(input.item.iconKey), JSON.stringify(meta, null, 2));

  if (input.prompt) {
    fs.writeFileSync(
      path.join(dir, 'prompt-used.md'),
      [`# Prompt — ${input.item.koreanName}`, '', '```', input.prompt, '```', ''].join(
        '\n',
      ),
      'utf8',
    );
  }

  fs.writeFileSync(
    path.join(dir, 'PREVIEW.md'),
    [
      `# Review — ${input.item.koreanName}`,
      '',
      `| Field | Value |`,
      `| --- | --- |`,
      `| iconKey | \`${input.item.iconKey}\` |`,
      `| status | **${input.status}** |`,
      `| recipes | ${input.item.usedByRecipeIds.join(', ')} |`,
      '',
      '```bash',
      `npm run ingredient:approve -- --key=${input.item.iconKey}`,
      `npm run ingredient:approve -- --key=${input.item.iconKey} --decision=reject`,
      `npm run ingredient:approve -- --key=${input.item.iconKey} --decision=regenerate`,
      '```',
      '',
    ].join('\n'),
    'utf8',
  );
}
