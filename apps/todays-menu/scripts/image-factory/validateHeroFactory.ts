/**
 * Sprint IMG-1 STEP 5 — validate hero image factory artifacts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HERO_IMAGE_EXTENSION, PATHS } from './config';
import type {
  CollectedRecipe,
  HeroFactoryValidation,
  HeroManifestEntry,
} from './types';

function groupDuplicates(
  pairs: Array<{ key: string; recipeId: string }>,
): Array<{ key: string; recipeIds: string[] }> {
  const map = new Map<string, string[]>();
  for (const { key, recipeId } of pairs) {
    const list = map.get(key) ?? [];
    list.push(recipeId);
    map.set(key, list);
  }
  return [...map.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, recipeIds]) => ({ key, recipeIds }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function validateHeroFactory(
  recipes: CollectedRecipe[],
  items: HeroManifestEntry[],
  promptsDir: string = PATHS.promptsDir,
): HeroFactoryValidation {
  const duplicateHeroImageKeys = groupDuplicates(
    recipes.map((r) => ({ key: r.heroImageKey, recipeId: r.id })),
  ).map(({ key, recipeIds }) => ({ key, recipeIds }));

  const duplicateFilenames = groupDuplicates(
    items.map((i) => ({ key: i.outputFilename, recipeId: i.recipeId })),
  ).map(({ key, recipeIds }) => ({ filename: key, recipeIds }));

  const missingRecipes = recipes
    .filter((r) => !r.id?.trim() || !r.recipeTitle?.trim() || !r.heroImageKey?.trim())
    .map((r) => r.id || '(empty-id)');

  const missingPrompts: string[] = [];
  const missingHeroImages: string[] = [];

  for (const item of items) {
    const promptPath = path.join(promptsDir, item.promptFilename);
    if (!fs.existsSync(promptPath)) {
      missingPrompts.push(item.promptFilename);
    }
    if (item.status === 'missing') {
      missingHeroImages.push(item.outputFilename);
    } else {
      const abs = path.join(PATHS.mealAssetsDir, item.outputFilename);
      if (!fs.existsSync(abs)) {
        missingHeroImages.push(item.outputFilename);
      }
    }
  }

  // Detect orphan keys that claim completed but file missing already covered.
  // Also flag any expected jpg path from heroImageKey convention.
  for (const recipe of recipes) {
    const filename = `${recipe.heroImageKey}.${HERO_IMAGE_EXTENSION}`;
    if (!items.some((i) => i.outputFilename === filename)) {
      missingRecipes.push(recipe.id);
    }
  }

  const ok =
    duplicateHeroImageKeys.length === 0 &&
    duplicateFilenames.length === 0 &&
    missingRecipes.length === 0 &&
    missingPrompts.length === 0;

  return {
    duplicateHeroImageKeys,
    duplicateFilenames,
    missingRecipes: [...new Set(missingRecipes)],
    missingPrompts,
    missingHeroImages,
    ok,
  };
}
