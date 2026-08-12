/**
 * Ingredient Queue Generator — unique iconKeys across catalog → queue JSON.
 * No AI image generation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildAssetManifest } from '../../recipe-assets/buildAssetManifest';
import { readRecipes } from '../../recipe-assets/readRecipes';
import { PIPELINE_PATHS } from '../config';
import type { IngredientQueueItem } from '../types';

export type IngredientQueueResult = {
  queuePath: string;
  total: number;
  missing: number;
  present: number;
  registered: number;
};

export function runIngredientQueueGenerator(): IngredientQueueResult {
  const scanned = readRecipes(null);
  const manifest = buildAssetManifest(scanned);

  const items: IngredientQueueItem[] = manifest.ingredients.map((entry) => {
    let status: IngredientQueueItem['status'] = 'missing';
    if (entry.fileExists && entry.registryHasKey) status = 'registered';
    else if (entry.fileExists) status = 'ready';
    else status = 'queued';

    return {
      iconKey: entry.iconKey,
      filename: entry.filename,
      names: entry.names,
      usedByRecipeIds: entry.usedByRecipeIds,
      status,
      relativePath: entry.relativePath,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sprint: 'AUTO-1',
    total: items.length,
    present: items.filter((i) => i.status === 'ready' || i.status === 'registered')
      .length,
    missing: items.filter((i) => i.status === 'queued' || i.status === 'missing')
      .length,
    registered: items.filter((i) => i.status === 'registered').length,
    items,
  };

  fs.mkdirSync(PIPELINE_PATHS.outRoot, { recursive: true });
  fs.writeFileSync(
    PIPELINE_PATHS.ingredientQueue,
    JSON.stringify(payload, null, 2),
    'utf8',
  );

  return {
    queuePath: path.relative(PIPELINE_PATHS.appRoot, PIPELINE_PATHS.ingredientQueue),
    total: payload.total,
    missing: payload.missing,
    present: payload.present,
    registered: payload.registered,
  };
}
