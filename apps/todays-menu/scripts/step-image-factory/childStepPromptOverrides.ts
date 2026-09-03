/**
 * Child step visual descriptions from batch3 pilot queue JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATCH3_PATH = path.join(__dirname, '../reports/child-step-pilot-queue-batch3.json');
const BATCH4_PATH = path.join(__dirname, '../reports/child-step-pilot-queue-batch4.json');
const LEGACY_PATH = path.join(__dirname, '../reports/child-step-pilot-queue.json');

let cache: Map<string, string> | null = null;

function ingestQueue(filePath: string, map: Map<string, string>): void {
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    recipes?: Array<{
      stepSlots?: {
        prep?: { imageKey: string; visualDescription?: string };
        cook?: { imageKey: string; visualDescription?: string };
        finish?: { imageKey: string; visualDescription?: string };
      };
    }>;
  };
  for (const row of data.recipes ?? []) {
    for (const slot of ['prep', 'cook', 'finish'] as const) {
      const entry = row.stepSlots?.[slot];
      if (entry?.imageKey && entry.visualDescription?.trim()) {
        map.set(entry.imageKey, entry.visualDescription.trim());
      }
    }
  }
}

function loadMap(): Map<string, string> {
  if (cache) return cache;
  cache = new Map();
  ingestQueue(LEGACY_PATH, cache);
  ingestQueue(BATCH3_PATH, cache);
  ingestQueue(BATCH4_PATH, cache);
  return cache;
}

export function getChildStepVisualDescription(imageKey: string): string | undefined {
  return loadMap().get(imageKey);
}

export function clearChildStepPromptCache(): void {
  cache = null;
}
