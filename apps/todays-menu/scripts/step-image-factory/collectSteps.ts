/**
 * Collect cooking-step entries for recipe ID range.
 */
import fs from 'node:fs';
import { expandRecipeIdRange } from '../image-factory/recipeIdRange';
import { buildAssetManifest } from '../recipe-assets/buildAssetManifest';
import { readRecipes } from '../recipe-assets/readRecipes';
import { PATHS } from './config';
import type { StepManifest, StepManifestEntry } from './types';

function parseRequireKeys(registryPath: string): Set<string> {
  if (!fs.existsSync(registryPath)) return new Set();
  const source = fs.readFileSync(registryPath, 'utf8');
  const block = source.match(
    /export const RECIPE_STEP_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return new Set();
  const keys = new Set<string>();
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) keys.add(m[1]);
  return keys;
}

function classifyStatus(fileExists: boolean, registryHasKey: boolean) {
  if (fileExists && registryHasKey) return 'approved' as const;
  if (fileExists && !registryHasKey) return 'existing_unregistered' as const;
  return 'queued' as const;
}

export function collectStepManifest(
  fromId: string,
  toId: string,
): StepManifest {
  const ids = expandRecipeIdRange(fromId, toId);
  const scanned = readRecipes(ids);
  const assetManifest = buildAssetManifest(scanned);
  const registryKeys = parseRequireKeys(PATHS.stepRegistry);

  const items: StepManifestEntry[] = assetManifest.steps
    .slice()
    .sort((a, b) => {
      const byRecipe = a.recipeId.localeCompare(b.recipeId);
      if (byRecipe !== 0) return byRecipe;
      return a.order - b.order;
    })
    .map((step) => {
      const registryHasKey = registryKeys.has(step.imageKey);
      return {
        recipeId: step.recipeId,
        recipeName: step.recipeName,
        stepOrder: step.order,
        stepTitle: step.title,
        stepInstruction: step.instruction,
        imageKey: step.imageKey,
        outputFilename: step.filename,
        promptFile: `generated/step-image-factory/prompts/${step.imageKey}.md`,
        status: classifyStatus(step.fileExists, registryHasKey),
        visibleIngredients: step.visibleIngredients,
        notYetIngredients: step.notYetIngredients,
        fileExists: step.fileExists,
        registryHasKey,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    sprint: 'STEP-1',
    fromId,
    toId,
    recipeCount: scanned.length,
    totalSteps: items.length,
    items,
  };
}

export function writeStepManifest(manifest: StepManifest): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.manifest, JSON.stringify(manifest, null, 2), 'utf8');
  return PATHS.manifest;
}

export function loadStepManifest(): StepManifest | null {
  if (!fs.existsSync(PATHS.manifest)) return null;
  return JSON.parse(fs.readFileSync(PATHS.manifest, 'utf8')) as StepManifest;
}
