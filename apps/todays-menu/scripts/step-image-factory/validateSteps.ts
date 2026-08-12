/**
 * Validate step images for a recipe range.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { expandRecipeIdRange } from '../image-factory/recipeIdRange';
import { loadStepQueue } from './buildQueue';
import { PATHS } from './config';

export type StepValidation = {
  ok: boolean;
  totalSteps: number;
  approved: number;
  missingFiles: string[];
  missingRegistry: string[];
  requireMismatches: string[];
  duplicateKeys: string[];
  casingIssues: string[];
  keyMismatches: string[];
  unresolved: string[];
  typescriptOk: boolean;
  recipeCoveragePercent: number;
  issues: string[];
};

function parseRequireMap(source: string): Map<string, string> {
  const map = new Map<string, string>();
  const block = source.match(
    /export const RECIPE_STEP_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return map;
  const re = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*require\('([^']+)'\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    map.set(m[1], m[2].replace(/\\/g, '/'));
  }
  return map;
}

export function validateSteps(fromId: string, toId: string): StepValidation {
  const queue = loadStepQueue();
  const ids = expandRecipeIdRange(fromId, toId);
  const idSet = new Set(ids);
  const recipes = HANKKI_RECIPES.filter((r) => idSet.has(r.id));
  const issues: string[] = [];
  const items = queue?.items ?? [];

  const keys = items.map((i) => i.imageKey);
  const duplicateKeys = [
    ...new Set(keys.filter((k, i) => keys.indexOf(k) !== i)),
  ];
  if (duplicateKeys.length) {
    issues.push(`Duplicate imageKeys: ${duplicateKeys.join(', ')}`);
  }

  const casingIssues = keys.filter(
    (k) => k !== k.toLowerCase() || !/^[a-z][a-z0-9_]*$/.test(k),
  );
  if (casingIssues.length) {
    issues.push(`Casing issues: ${casingIssues.join(', ')}`);
  }

  const registrySource = fs.existsSync(PATHS.stepRegistry)
    ? fs.readFileSync(PATHS.stepRegistry, 'utf8')
    : '';
  const requireMap = parseRequireMap(registrySource);

  const missingFiles: string[] = [];
  const missingRegistry: string[] = [];
  const requireMismatches: string[] = [];
  const keyMismatches: string[] = [];
  let approved = 0;

  for (const item of items) {
    const recipe = recipes.find((r) => r.id === item.recipeId);
    const step = recipe?.recipe?.steps?.find(
      (s) => s.imageKey === item.imageKey,
    );
    if (recipe && !step) {
      keyMismatches.push(`${item.recipeId}:${item.imageKey}`);
    }

    const abs = path.join(PATHS.stepsDir, item.outputFilename);
    if (item.status === 'approved') {
      approved += 1;
      if (!fs.existsSync(abs)) {
        missingFiles.push(item.imageKey);
        issues.push(`Approved but file missing: ${item.imageKey}`);
      }
      if (!requireMap.has(item.imageKey)) {
        missingRegistry.push(item.imageKey);
      } else {
        const expected = `../../assets/recipe-steps/${item.outputFilename}`;
        if (requireMap.get(item.imageKey) !== expected) {
          requireMismatches.push(
            `${item.imageKey}: ${requireMap.get(item.imageKey)}`,
          );
        }
      }
    }
  }

  // Filename collisions
  const onDisk = fs.existsSync(PATHS.stepsDir)
    ? fs.readdirSync(PATHS.stepsDir).filter((f) => /\.jpe?g$/i.test(f))
    : [];
  const lower = onDisk.map((f) => f.toLowerCase());
  const collisions = onDisk.filter(
    (f, i) => lower.indexOf(f.toLowerCase()) !== i,
  );
  if (collisions.length) {
    issues.push(`Filename collisions: ${collisions.join(', ')}`);
  }

  // Text-only fallback: steps without approved assets are OK (unresolved = broken mapping only)
  const unresolved = [...keyMismatches];
  if (keyMismatches.length) {
    issues.push(`imageKey not found on recipe: ${keyMismatches.length}`);
  }

  const approvedKeys = new Set(
    items.filter((i) => i.status === 'approved').map((i) => i.imageKey),
  );
  let covered = 0;
  for (const recipe of recipes) {
    const steps = recipe.recipe?.steps ?? [];
    if (!steps.length) continue;
    if (steps.every((s) => approvedKeys.has(s.imageKey))) covered += 1;
  }
  const recipeCoveragePercent =
    recipes.length === 0
      ? 0
      : Math.round((covered / recipes.length) * 1000) / 10;

  let typescriptOk = false;
  try {
    execSync('npx tsc --noEmit -p tsconfig.json', {
      cwd: PATHS.appRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120_000,
    });
    typescriptOk = true;
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}`;
    const related = /recipeStepImageAssets/i.test(out);
    typescriptOk = !related;
    if (related) issues.push('TypeScript errors in recipeStepImageAssets');
  }

  if (missingRegistry.length) {
    issues.push(`Missing registry: ${missingRegistry.join(', ')}`);
  }
  if (requireMismatches.length) {
    issues.push(`Require mismatches: ${requireMismatches.length}`);
  }

  // Structural OK even when assets missing — text-only step cards are allowed
  const ok =
    duplicateKeys.length === 0 &&
    casingIssues.length === 0 &&
    missingFiles.length === 0 &&
    missingRegistry.length === 0 &&
    requireMismatches.length === 0 &&
    unresolved.length === 0 &&
    typescriptOk;

  return {
    ok,
    totalSteps: items.length,
    approved,
    missingFiles,
    missingRegistry,
    requireMismatches,
    duplicateKeys,
    casingIssues,
    keyMismatches,
    unresolved,
    typescriptOk,
    recipeCoveragePercent,
    issues,
  };
}
