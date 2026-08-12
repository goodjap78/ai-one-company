import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import {
  buildIngredientPrompt,
  buildStepPrompt,
} from './buildImagePrompts';
import {
  ingredientFilename,
  isValidAssetKey,
  stepFilename,
} from './normalizeAssetKey';
import type {
  AssetManifest,
  IngredientAssetEntry,
  ScannedRecipe,
  StepAssetEntry,
} from './types';

function listRegistryKeys(registryPath: string, constName: string): Set<string> {
  if (!fs.existsSync(registryPath)) return new Set();
  const source = fs.readFileSync(registryPath, 'utf8');
  const blockMatch = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!blockMatch) return new Set();
  const keys = new Set<string>();
  const re = /^\s*([a-z][a-z0-9_]*)\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blockMatch[1]))) {
    keys.add(m[1]);
  }
  return keys;
}

function fileExists(absPath: string): boolean {
  return fs.existsSync(absPath) && fs.statSync(absPath).isFile();
}

/**
 * Infer which ingredient names are "active" by step order heuristics
 * for kimchi stew–style progressive cooking prompts.
 */
function inferStepVisibility(
  recipe: ScannedRecipe,
  stepIndex: number,
): { visible: string[]; notYet: string[] } {
  const names = recipe.ingredients.map((i) => i.name);
  const step = recipe.steps[stepIndex];
  if (!step) return { visible: [], notYet: names };

  const instruction = `${step.title} ${step.instruction}`;
  const visible = names.filter((name) => instruction.includes(name));
  // Progressive: items mentioned only in later steps are "not yet"
  const laterText = recipe.steps
    .slice(stepIndex + 1)
    .map((s) => `${s.title} ${s.instruction}`)
    .join(' ');
  const earlierOrCurrent = recipe.steps
    .slice(0, stepIndex + 1)
    .map((s) => `${s.title} ${s.instruction}`)
    .join(' ');

  const notYet = names.filter(
    (name) =>
      !earlierOrCurrent.includes(name) && laterText.includes(name),
  );

  // Prefer explicit visible from instruction; fallback to progressive set
  if (visible.length === 0) {
    const progressiveVisible = names.filter((name) =>
      earlierOrCurrent.includes(name),
    );
    return { visible: progressiveVisible, notYet };
  }

  return { visible, notYet };
}

export function buildAssetManifest(recipes: ScannedRecipe[]): AssetManifest {
  const ingredientRegistryKeys = listRegistryKeys(
    PATHS.ingredientRegistry,
    'INGREDIENT_IMAGE_ASSETS',
  );
  const stepRegistryKeys = listRegistryKeys(
    PATHS.stepRegistry,
    'RECIPE_STEP_IMAGE_ASSETS',
  );

  const ingredientMap = new Map<string, IngredientAssetEntry>();
  const duplicates: string[] = [];
  const invalidKeys: string[] = [];
  const seenStepKeys = new Map<string, string>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (!isValidAssetKey(ing.iconKey)) {
        invalidKeys.push(`ingredient:${ing.iconKey} (${recipe.id})`);
      }

      const existing = ingredientMap.get(ing.iconKey);
      if (existing) {
        if (!existing.usedByRecipeIds.includes(recipe.id)) {
          existing.usedByRecipeIds.push(recipe.id);
        }
        if (!existing.names.includes(ing.name)) {
          existing.names.push(ing.name);
          existing.prompt = buildIngredientPrompt({
            iconKey: ing.iconKey,
            names: existing.names,
          });
        }
        continue;
      }

      const filename = ingredientFilename(ing.iconKey);
      const absolutePath = path.join(PATHS.ingredientAssetsDir, filename);
      const names = [ing.name];

      ingredientMap.set(ing.iconKey, {
        kind: 'ingredient',
        iconKey: ing.iconKey,
        names,
        group: ing.group,
        filename,
        relativePath: `assets/ingredients/${filename}`,
        absolutePath,
        fileExists: fileExists(absolutePath),
        registryHasKey: ingredientRegistryKeys.has(ing.iconKey),
        prompt: buildIngredientPrompt({ iconKey: ing.iconKey, names }),
        usedByRecipeIds: [recipe.id],
      });
    }

    recipe.steps.forEach((step) => {
      if (!isValidAssetKey(step.imageKey)) {
        invalidKeys.push(`step:${step.imageKey} (${recipe.id})`);
      }

      const owner = seenStepKeys.get(step.imageKey);
      if (owner && owner !== recipe.id) {
        duplicates.push(
          `step key "${step.imageKey}" used by ${owner} and ${recipe.id}`,
        );
      } else {
        seenStepKeys.set(step.imageKey, recipe.id);
      }
    });
  }

  const steps: StepAssetEntry[] = [];
  const stepKeySet = new Set<string>();

  for (const recipe of recipes) {
    recipe.steps.forEach((step, index) => {
      if (stepKeySet.has(step.imageKey)) {
        duplicates.push(`duplicate step key in selection: ${step.imageKey}`);
        return;
      }
      stepKeySet.add(step.imageKey);

      const { visible, notYet } = inferStepVisibility(recipe, index);
      const filename = stepFilename(step.imageKey);
      const absolutePath = path.join(PATHS.stepAssetsDir, filename);

      steps.push({
        kind: 'step',
        imageKey: step.imageKey,
        recipeId: recipe.id,
        recipeName: recipe.name,
        order: step.order,
        title: step.title,
        instruction: step.instruction,
        filename,
        relativePath: `assets/recipe-steps/${filename}`,
        absolutePath,
        fileExists: fileExists(absolutePath),
        registryHasKey: stepRegistryKeys.has(step.imageKey),
        prompt: buildStepPrompt({
          recipeName: recipe.name,
          order: step.order,
          title: step.title,
          instruction: step.instruction,
          visibleIngredients: visible,
          notYetIngredients: notYet,
        }),
        visibleIngredients: visible,
        notYetIngredients: notYet,
      });
    });
  }

  const ingredients = [...ingredientMap.values()].sort((a, b) =>
    a.iconKey.localeCompare(b.iconKey),
  );
  steps.sort((a, b) => a.imageKey.localeCompare(b.imageKey));

  const ingredientExisting = ingredients.filter((i) => i.fileExists).length;
  const stepExisting = steps.filter((s) => s.fileExists).length;

  return {
    generatedAt: new Date().toISOString(),
    recipeIds: recipes.map((r) => r.id),
    ingredients,
    steps,
    duplicates: [...new Set(duplicates)],
    invalidKeys: [...new Set(invalidKeys)],
    summary: {
      ingredientTotal: ingredients.length,
      ingredientExisting,
      ingredientMissing: ingredients.length - ingredientExisting,
      stepTotal: steps.length,
      stepExisting,
      stepMissing: steps.length - stepExisting,
    },
  };
}
