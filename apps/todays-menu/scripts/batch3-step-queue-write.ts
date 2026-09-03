/**
 * Build step queue for Batch #3 pilot keys only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStepQueue, writeStepQueue } from './step-image-factory/buildQueue';
import type { StepManifest } from './step-image-factory/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'reports/batch3-image-size-baseline.json'), 'utf8'),
) as { stepPilotKeys: string[] };
const pilot = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'reports/child-step-pilot-queue-batch3.json'), 'utf8'),
) as {
  recipes: Array<{
    recipeId: string;
    name: string;
    stepSlots: {
      prep: { imageKey: string; order: number; title: string; instruction: string };
      cook: { imageKey: string; order: number; title: string; instruction: string };
      finish: { imageKey: string; order: number; title: string; instruction: string };
    };
  }>;
};

const keySet = new Set(baseline.stepPilotKeys);
const items = [];
for (const row of pilot.recipes) {
  for (const slot of [row.stepSlots.prep, row.stepSlots.cook, row.stepSlots.finish]) {
    if (!keySet.has(slot.imageKey)) continue;
    items.push({
      recipeId: row.recipeId,
      recipeName: row.name,
      stepOrder: slot.order,
      stepTitle: slot.title,
      stepInstruction: slot.instruction,
      imageKey: slot.imageKey,
      outputFilename: `${slot.imageKey}.jpg`,
      promptFile: `generated/step-image-factory/prompts/${slot.imageKey}.md`,
      status: 'queued' as const,
      visibleIngredients: [],
      notYetIngredients: [],
      fileExists: false,
      registryHasKey: false,
    });
  }
}

const manifest: StepManifest = {
  generatedAt: new Date().toISOString(),
  sprint: 'BATCH3-STEP-PILOT',
  fromId: '0448',
  toId: '0483',
  recipeCount: pilot.recipes.length,
  totalSteps: items.length,
  items,
};

fs.mkdirSync(path.join(__dirname, '../generated/step-image-factory'), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, '../generated/step-image-factory/step-manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);
const queue = buildStepQueue(manifest, process.env.IMAGE_PROVIDER ?? 'gemini');
writeStepQueue(queue);
console.log(`Batch3 step queue: ${items.length} items`);
