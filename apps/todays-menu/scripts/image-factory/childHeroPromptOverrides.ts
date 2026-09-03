/**
 * Child hero finish descriptions from child-missing-hero-queue.json.
 * Used by buildHeroPrompts for texture/stage-aware baby/toddler/elementary heroes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = path.join(__dirname, '../reports/child-missing-hero-queue.json');

let cache: Map<string, string> | null = null;

function loadMap(): Map<string, string> {
  if (cache) return cache;
  cache = new Map();
  if (!fs.existsSync(QUEUE_PATH)) return cache;
  const data = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8')) as {
    recipes?: Array<{ recipeId: string; finishDescription?: string }>;
  };
  for (const row of data.recipes ?? []) {
    if (row.finishDescription?.trim()) {
      cache.set(row.recipeId, row.finishDescription.trim());
    }
  }
  return cache;
}

export function getChildHeroFinishDescription(recipeId: string): string | undefined {
  return loadMap().get(recipeId);
}

export function clearChildHeroPromptCache(): void {
  cache = null;
}
