/**
 * Sprint R7 — Image manifests (no image generation).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../recipe-assets/config';
import { PIPELINE_RECIPES } from '../../data/recipes/pipeline/pipelineRecipes';
import type { PipelineValidationResult } from './validatePipeline';

export type HeroManifestEntry = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  filename: string;
  relativePath: string;
  exists: boolean;
};

export type IngredientManifestEntry = {
  iconKey: string;
  filename: string;
  relativePath: string;
  names: string[];
  usedByRecipeIds: string[];
  exists: boolean;
};

export type StepManifestEntry = {
  recipeId: string;
  recipeName: string;
  order: number;
  imageKey: string;
  filename: string;
  relativePath: string;
  title: string;
  exists: boolean;
};

function exists(abs: string): boolean {
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

export function buildImageManifests(recipes = PIPELINE_RECIPES) {
  const heroes: HeroManifestEntry[] = recipes.map((recipe) => {
    const filename = `${recipe.heroImageKey}.jpg`;
    const relativePath = `assets/meals/${filename}`;
    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      heroImageKey: recipe.heroImageKey,
      filename,
      relativePath,
      exists: exists(path.join(PATHS.mealAssetsDir, filename)),
    };
  });

  const ingredientMap = new Map<string, IngredientManifestEntry>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const existing = ingredientMap.get(ing.iconKey);
      if (existing) {
        if (!existing.names.includes(ing.name)) existing.names.push(ing.name);
        if (!existing.usedByRecipeIds.includes(recipe.id)) {
          existing.usedByRecipeIds.push(recipe.id);
        }
        continue;
      }
      const filename = `${ing.iconKey}.png`;
      ingredientMap.set(ing.iconKey, {
        iconKey: ing.iconKey,
        filename,
        relativePath: `assets/ingredients/${filename}`,
        names: [ing.name],
        usedByRecipeIds: [recipe.id],
        exists: exists(path.join(PATHS.ingredientAssetsDir, filename)),
      });
    }
  }

  const steps: StepManifestEntry[] = [];
  for (const recipe of recipes) {
    recipe.recipe.steps.forEach((step, index) => {
      const filename = `${step.imageKey}.jpg`;
      steps.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        order: index + 1,
        imageKey: step.imageKey,
        filename,
        relativePath: `assets/recipe-steps/${filename}`,
        title: step.title || `단계 ${index + 1}`,
        exists: exists(path.join(PATHS.stepAssetsDir, filename)),
      });
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    recipeCount: recipes.length,
    heroes,
    ingredients: [...ingredientMap.values()].sort((a, b) =>
      a.iconKey.localeCompare(b.iconKey),
    ),
    steps,
  };
}

export function writeImageManifests(
  validation: PipelineValidationResult,
  outDir = path.join(PATHS.appRoot, 'generated/recipe-pipeline'),
): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const manifests = buildImageManifests();
  const written: string[] = [];

  const heroPath = path.join(outDir, 'hero-images.json');
  fs.writeFileSync(
    heroPath,
    JSON.stringify(
      {
        generatedAt: manifests.generatedAt,
        total: manifests.heroes.length,
        missing: manifests.heroes.filter((h) => !h.exists).length,
        duplicateHeroKeys: validation.duplicateHeroKeys,
        items: manifests.heroes,
      },
      null,
      2,
    ),
    'utf8',
  );
  written.push(path.relative(PATHS.appRoot, heroPath));

  const ingPath = path.join(outDir, 'ingredient-images.json');
  fs.writeFileSync(
    ingPath,
    JSON.stringify(
      {
        generatedAt: manifests.generatedAt,
        total: manifests.ingredients.length,
        missing: manifests.ingredients.filter((i) => !i.exists).length,
        items: manifests.ingredients,
      },
      null,
      2,
    ),
    'utf8',
  );
  written.push(path.relative(PATHS.appRoot, ingPath));

  const stepPath = path.join(outDir, 'step-images.json');
  fs.writeFileSync(
    stepPath,
    JSON.stringify(
      {
        generatedAt: manifests.generatedAt,
        total: manifests.steps.length,
        missing: manifests.steps.filter((s) => !s.exists).length,
        items: manifests.steps,
      },
      null,
      2,
    ),
    'utf8',
  );
  written.push(path.relative(PATHS.appRoot, stepPath));

  return written;
}
