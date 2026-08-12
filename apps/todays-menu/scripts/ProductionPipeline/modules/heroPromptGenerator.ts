/**
 * Hero Prompt Generator — prepare hero prompts via Image Factory (IMG-1).
 * No AI image generation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { collectHankkiRecipes } from '../../image-factory/collectRecipes';
import { buildHeroPromptMarkdown } from '../../image-factory/buildHeroPrompts';
import { PATHS as HERO_PATHS } from '../../image-factory/config';
import {
  buildHeroFactoryManifest,
  buildHeroManifestEntries,
} from '../../image-factory/buildHeroManifest';
import { validateHeroFactory } from '../../image-factory/validateHeroFactory';

export type HeroPromptResult = {
  recipeCount: number;
  promptCount: number;
  manifestPath: string;
  promptsDir: string;
};

export function runHeroPromptGenerator(): HeroPromptResult {
  fs.mkdirSync(HERO_PATHS.promptsDir, { recursive: true });
  fs.mkdirSync(HERO_PATHS.generatedRoot, { recursive: true });

  const recipes = collectHankkiRecipes();
  for (const recipe of recipes) {
    const abs = path.join(HERO_PATHS.promptsDir, `${recipe.heroImageKey}.md`);
    fs.writeFileSync(abs, buildHeroPromptMarkdown(recipe), 'utf8');
  }

  const items = buildHeroManifestEntries(recipes);
  const validation = validateHeroFactory(recipes, items);
  const manifest = buildHeroFactoryManifest(recipes, validation);
  fs.writeFileSync(
    HERO_PATHS.heroManifest,
    JSON.stringify(manifest, null, 2),
    'utf8',
  );

  return {
    recipeCount: recipes.length,
    promptCount: recipes.length,
    manifestPath: path.relative(HERO_PATHS.appRoot, HERO_PATHS.heroManifest),
    promptsDir: path.relative(HERO_PATHS.appRoot, HERO_PATHS.promptsDir),
  };
}
