/**
 * Sprint R7 / RF-5 / RF-6 — Full pipeline catalog (100 recipes).
 *
 * Live production (Home): HANKKI_RECIPES = Batch 01–10 (001–100).
 * Batch 06–10 inputs remain scaffolded via draftInputs + master template.
 */
import { BATCH_02_INPUTS } from '../batches/batch02';
import { HANKKI_RECIPES } from '../hankkiRecipes';
import { createHankkiRecipeBatch } from '../recipeMasterTemplate';
import type { Recipe } from '../types';
import {
  ALL_DRAFT_SPECS,
  PIPELINE_DRAFT_INPUTS,
} from './draftInputs';
import { PIPELINE_BATCH_META } from './draftSpecsPart1';
import type { BatchMeta, RecipeSpec } from './types';

export { PIPELINE_BATCH_META, ALL_DRAFT_SPECS, PIPELINE_DRAFT_INPUTS };
export type { BatchMeta, RecipeSpec };

/** Scaffolded Batch 06–10 recipes (also included in HANKKI_RECIPES since RF-6). */
export const PIPELINE_DRAFT_RECIPES: Recipe[] =
  createHankkiRecipeBatch(PIPELINE_DRAFT_INPUTS);

/**
 * Full production pipeline target = live HANKKI catalog (100 after RF-6).
 */
export const PIPELINE_RECIPES: Recipe[] = HANKKI_RECIPES;

export const PIPELINE_TARGET_COUNT = 100;

export function getBatchRecipes(batchId: string): Recipe[] {
  const meta = PIPELINE_BATCH_META.find((b) => b.batchId === batchId);
  if (!meta) return [];
  const pad = (n: number) => String(n).padStart(3, '0');
  const ids = new Set<string>();
  for (let i = meta.idStart; i <= meta.idEnd; i++) ids.add(pad(i));
  return PIPELINE_RECIPES.filter((r) => ids.has(r.id));
}

export function getLiveRecipeCount(): number {
  return HANKKI_RECIPES.length;
}

/** @deprecated RF-6 — drafts are live; kept for tooling compatibility. */
export function getDraftRecipeCount(): number {
  return PIPELINE_DRAFT_RECIPES.length;
}

/** Batch 02 inputs re-export for pipeline tooling. */
export { BATCH_02_INPUTS };
