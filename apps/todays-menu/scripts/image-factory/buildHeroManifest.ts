/**
 * Sprint IMG-1 STEP 2 / 4 — hero image manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HERO_IMAGE_EXTENSION, PATHS } from './config';
import type {
  CollectedRecipe,
  HeroFactoryManifest,
  HeroFactoryValidation,
  HeroImageStatus,
  HeroManifestEntry,
} from './types';

function heroFileExists(heroImageKey: string): boolean {
  const abs = path.join(
    PATHS.mealAssetsDir,
    `${heroImageKey}.${HERO_IMAGE_EXTENSION}`,
  );
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function statusForKey(heroImageKey: string): HeroImageStatus {
  return heroFileExists(heroImageKey) ? 'completed' : 'missing';
}

export function buildHeroManifestEntries(
  recipes: CollectedRecipe[],
): HeroManifestEntry[] {
  return recipes.map((recipe) => ({
    recipeId: recipe.id,
    recipeName: recipe.recipeTitle,
    heroImageKey: recipe.heroImageKey,
    outputFilename: `${recipe.heroImageKey}.${HERO_IMAGE_EXTENSION}`,
    promptFilename: `${recipe.heroImageKey}.md`,
    status: statusForKey(recipe.heroImageKey),
  }));
}

export function buildHeroFactoryManifest(
  recipes: CollectedRecipe[],
  validation: HeroFactoryValidation,
): HeroFactoryManifest {
  const items = buildHeroManifestEntries(recipes);
  const completed = items.filter((i) => i.status === 'completed').length;
  const missing = items.filter((i) => i.status === 'missing').length;
  const total = items.length;
  const progressPercent =
    total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;

  return {
    generatedAt: new Date().toISOString(),
    sprint: 'IMG-1',
    total,
    completed,
    missing,
    progressPercent,
    validation,
    recipes,
    items,
  };
}
