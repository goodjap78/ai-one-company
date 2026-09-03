/**
 * Prepare Batch #4 child image sprint: queues, scoped hero prompts, size baseline.
 * Run: npm run batch4:image-prepare
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { buildHeroPromptMarkdown } from './image-factory/buildHeroPrompts';
import { collectHankkiRecipes } from './image-factory/collectRecipes';
import { PATHS } from './image-factory/config';
import { buildImageQueue, writeImageQueue } from './image-factory/buildImageQueue';
import { buildHeroFactoryManifest, buildHeroManifestEntries } from './image-factory/buildHeroManifest';
import { validateHeroFactory } from './image-factory/validateHeroFactory';
import { writeAllStepPrompts } from './step-image-factory/buildPrompts';
import type { StepManifestEntry } from './step-image-factory/types';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(__dirname, 'reports');
const BATCH4_FROM = 484;
const BATCH4_TO = 517;

function dirBytes(dir: string, filter: (f: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!filter(f)) continue;
    total += fs.statSync(path.join(dir, f)).size;
  }
  return total;
}

function heroKeysBatch4(): string[] {
  return collectHankkiRecipes()
    .filter((r) => {
      const n = Number(r.id.replace('recipe_', ''));
      return n >= BATCH4_FROM && n <= BATCH4_TO;
    })
    .map((r) => r.heroImageKey);
}

function main(): void {
  console.log('Batch #4 image sprint prepare — start\n');
  execSync('npx tsx scripts/build-child-image-queues.ts', {
    cwd: APP_ROOT,
    stdio: 'inherit',
  });

  const recipes = collectHankkiRecipes();
  const batch4 = recipes.filter((r) => {
    const n = Number(r.id.replace('recipe_', ''));
    return n >= BATCH4_FROM && n <= BATCH4_TO;
  });
  fs.mkdirSync(PATHS.promptsDir, { recursive: true });
  for (const recipe of batch4) {
    const abs = path.join(PATHS.promptsDir, `${recipe.heroImageKey}.md`);
    fs.writeFileSync(abs, buildHeroPromptMarkdown(recipe), 'utf8');
  }
  console.log(`Wrote ${batch4.length} batch4 hero prompts`);

  const validation = validateHeroFactory(recipes, buildHeroManifestEntries(recipes));
  const manifest = buildHeroFactoryManifest(recipes, validation);
  fs.writeFileSync(PATHS.heroManifest, JSON.stringify(manifest, null, 2), 'utf8');
  const queue = buildImageQueue({ providerHint: process.env.IMAGE_PROVIDER ?? 'gemini' });
  writeImageQueue(queue);
  console.log('Refreshed hero manifest + queue');

  const pilotQueue = JSON.parse(
    fs.readFileSync(path.join(REPORTS, 'child-step-pilot-queue-batch4.json'), 'utf8'),
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
  const pilotKeys = new Set<string>();
  const stepItems: StepManifestEntry[] = [];
  for (const row of pilotQueue.recipes) {
    const recipe = getHankkiRecipeById(row.recipeId);
    if (!recipe) throw new Error(`Missing pilot recipe ${row.recipeId}`);
    for (const slot of [row.stepSlots.prep, row.stepSlots.cook, row.stepSlots.finish]) {
      pilotKeys.add(slot.imageKey);
      const fileExists = fs.existsSync(
        path.join(APP_ROOT, 'assets/recipe-steps', `${slot.imageKey}.jpg`),
      );
      stepItems.push({
        recipeId: row.recipeId,
        recipeName: row.name,
        stepOrder: slot.order,
        stepTitle: slot.title,
        stepInstruction: slot.instruction,
        imageKey: slot.imageKey,
        outputFilename: `${slot.imageKey}.jpg`,
        promptFile: `generated/step-image-factory/prompts/${slot.imageKey}.md`,
        status: fileExists ? 'queued' : 'queued',
        visibleIngredients: recipe.ingredients.map((i) => i.name).slice(0, 6),
        notYetIngredients: [],
        fileExists,
        registryHasKey: false,
      });
    }
  }
  writeAllStepPrompts(stepItems);
  console.log(`Wrote ${stepItems.length} batch4 step pilot prompts`);

  const heroKeys = heroKeysBatch4();
  const baseline = {
    capturedAt: new Date().toISOString(),
    heroBatch4Keys: heroKeys.length,
    heroBatch4BytesBefore: heroKeys.reduce((sum, key) => {
      const p = path.join(APP_ROOT, 'assets/meals', `${key}.jpg`);
      return sum + (fs.existsSync(p) ? fs.statSync(p).size : 0);
    }, 0),
    stepPilotKeys: [...pilotKeys],
    stepPilotBytesBefore: [...pilotKeys].reduce((sum, key) => {
      const p = path.join(APP_ROOT, 'assets/recipe-steps', `${key}.jpg`);
      return sum + (fs.existsSync(p) ? fs.statSync(p).size : 0);
    }, 0),
    mealsDirBytes: dirBytes(path.join(APP_ROOT, 'assets/meals'), (f) => f.endsWith('.jpg')),
    stepsDirBytes: dirBytes(path.join(APP_ROOT, 'assets/recipe-steps'), (f) => f.endsWith('.jpg')),
  };
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS, 'batch4-image-size-baseline.json'),
    JSON.stringify(baseline, null, 2) + '\n',
    'utf8',
  );
  console.log(JSON.stringify(baseline, null, 2));
  console.log('\nBatch #4 image sprint prepare — done');
}

main();
