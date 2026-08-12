/**
 * Sprint R7 — Pipeline validation (100-recipe target).
 * Does not touch Home / Detail / recommendation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../recipe-assets/config';
import { validateHankkiRecipe } from '../../data/recipes/validateHankkiProduction';
import {
  getDraftRecipeCount,
  getLiveRecipeCount,
  PIPELINE_BATCH_META,
  PIPELINE_RECIPES,
  PIPELINE_TARGET_COUNT,
} from '../../data/recipes/pipeline/pipelineRecipes';
import type { Recipe } from '../../data/recipes/types';

export type PipelineIssue = {
  severity: 'P0' | 'P1' | 'P2';
  code: string;
  message: string;
  recipeId?: string;
};

export type PipelineValidationResult = {
  ok: boolean;
  targetCount: number;
  totalRecipes: number;
  liveCount: number;
  draftCount: number;
  readyCount: number;
  missingFieldCount: number;
  issues: PipelineIssue[];
  duplicateIds: string[];
  duplicateNames: string[];
  duplicateHeroKeys: string[];
  uniqueIconKeys: string[];
  uniqueStepKeys: string[];
  uniqueHeroKeys: string[];
  missingHeroes: string[];
  missingIngredients: string[];
  missingSteps: string[];
};

function fileExists(abs: string): boolean {
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dups.add(v);
    else seen.add(v);
  }
  return [...dups].sort();
}

export function validatePipeline(recipes: Recipe[] = PIPELINE_RECIPES): PipelineValidationResult {
  const issues: PipelineIssue[] = [];
  const ids = recipes.map((r) => r.id);
  const names = recipes.map((r) => r.name);
  const heroes = recipes.map((r) => r.heroImageKey);

  const duplicateIds = findDuplicates(ids);
  const duplicateNames = findDuplicates(names);
  const duplicateHeroKeys = findDuplicates(heroes);

  for (const id of duplicateIds) {
    issues.push({
      severity: 'P0',
      code: 'duplicate.id',
      message: `Duplicate recipe id: ${id}`,
      recipeId: id,
    });
  }
  for (const name of duplicateNames) {
    issues.push({
      severity: 'P0',
      code: 'duplicate.name',
      message: `Duplicate recipe name: ${name}`,
    });
  }
  for (const key of duplicateHeroKeys) {
    issues.push({
      severity: 'P1',
      code: 'duplicate.hero',
      message: `Duplicate heroImageKey: ${key}`,
    });
  }

  let missingFieldCount = 0;
  let readyCount = 0;

  const iconKeys = new Set<string>();
  const stepKeys = new Set<string>();
  const missingHeroes: string[] = [];
  const missingIngredients = new Set<string>();
  const missingSteps = new Set<string>();

  for (const recipe of recipes) {
    const fieldIssues = validateHankkiRecipe(recipe);
    if (fieldIssues.length > 0) {
      missingFieldCount += 1;
      for (const issue of fieldIssues) {
        issues.push({
          severity: 'P0',
          code: issue.code,
          message: issue.message,
          recipeId: recipe.id,
        });
      }
    } else {
      readyCount += 1;
    }

    const heroPath = path.join(PATHS.mealAssetsDir, `${recipe.heroImageKey}.jpg`);
    if (!fileExists(heroPath)) {
      missingHeroes.push(recipe.heroImageKey);
    }

    for (const ing of recipe.ingredients) {
      iconKeys.add(ing.iconKey);
      const ingPath = path.join(PATHS.ingredientAssetsDir, `${ing.iconKey}.png`);
      if (!fileExists(ingPath)) missingIngredients.add(ing.iconKey);
    }

    for (const step of recipe.recipe.steps) {
      stepKeys.add(step.imageKey);
      const stepPath = path.join(PATHS.stepAssetsDir, `${step.imageKey}.jpg`);
      if (!fileExists(stepPath)) missingSteps.add(step.imageKey);
    }
  }

  if (recipes.length !== PIPELINE_TARGET_COUNT) {
    issues.push({
      severity: 'P1',
      code: 'count.target',
      message: `Expected ${PIPELINE_TARGET_COUNT} pipeline recipes, got ${recipes.length}`,
    });
  }

  for (const meta of PIPELINE_BATCH_META) {
    const count = recipes.filter((r) => {
      const n = Number.parseInt(r.id, 10);
      return n >= meta.idStart && n <= meta.idEnd;
    }).length;
    if (count !== meta.idEnd - meta.idStart + 1) {
      issues.push({
        severity: 'P1',
        code: 'batch.count',
        message: `Batch ${meta.batchId} expected ${meta.idEnd - meta.idStart + 1}, got ${count}`,
      });
    }
  }

  const ok =
    duplicateIds.length === 0 &&
    duplicateNames.length === 0 &&
    missingFieldCount === 0 &&
    recipes.length === PIPELINE_TARGET_COUNT;

  return {
    ok,
    targetCount: PIPELINE_TARGET_COUNT,
    totalRecipes: recipes.length,
    liveCount: getLiveRecipeCount(),
    draftCount: getDraftRecipeCount(),
    readyCount,
    missingFieldCount,
    issues,
    duplicateIds,
    duplicateNames,
    duplicateHeroKeys,
    uniqueIconKeys: [...iconKeys].sort(),
    uniqueStepKeys: [...stepKeys].sort(),
    uniqueHeroKeys: [...new Set(heroes)].sort(),
    missingHeroes: [...new Set(missingHeroes)].sort(),
    missingIngredients: [...missingIngredients].sort(),
    missingSteps: [...missingSteps].sort(),
  };
}
