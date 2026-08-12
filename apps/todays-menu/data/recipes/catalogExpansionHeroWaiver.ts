/**
 * Sprint 58 — Catalog expansion recipes pending dedicated hero pipeline.
 * Batch 1: recipe_0161–0190, Batch 2: recipe_0191–0220, Batch 3: recipe_0221–0250,
 * Batch 4: recipe_0251–0280, Batch 5 (Final): recipe_0281–0300.
 *
 * Sprint 60 — approved heroes tracked in generated/meal-hero-expansion/approved-recipes.json
 */
import fs from 'node:fs';
import path from 'node:path';
const BATCH_1_IDS = Array.from({ length: 30 }, (_, i) => `recipe_${String(161 + i).padStart(4, '0')}`);
const BATCH_2_IDS = Array.from({ length: 30 }, (_, i) => `recipe_${String(191 + i).padStart(4, '0')}`);
const BATCH_3_IDS = Array.from({ length: 30 }, (_, i) => `recipe_${String(221 + i).padStart(4, '0')}`);
const BATCH_4_IDS = Array.from({ length: 30 }, (_, i) => `recipe_${String(251 + i).padStart(4, '0')}`);
const BATCH_5_IDS = Array.from({ length: 20 }, (_, i) => `recipe_${String(281 + i).padStart(4, '0')}`);

export const CATALOG_EXPANSION_HERO_WAIVER_IDS: ReadonlySet<string> = new Set([
  ...BATCH_1_IDS,
  ...BATCH_2_IDS,
  ...BATCH_3_IDS,
  ...BATCH_4_IDS,
  ...BATCH_5_IDS,
]);

const APPROVED_EXPANSION_PATH = path.join(
  __dirname,
  '../../generated/meal-hero-expansion/approved-recipes.json',
);

function loadApprovedExpansionRecipeIds(): Set<string> {
  if (!fs.existsSync(APPROVED_EXPANSION_PATH)) return new Set();
  try {
    const parsed = JSON.parse(fs.readFileSync(APPROVED_EXPANSION_PATH, 'utf8')) as {
      recipeIds?: string[];
    };
    return new Set((parsed.recipeIds ?? []).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function isCatalogExpansionHeroWaiver(recipeId: string): boolean {
  if (!CATALOG_EXPANSION_HERO_WAIVER_IDS.has(recipeId)) return false;
  return !loadApprovedExpansionRecipeIds().has(recipeId);
}
