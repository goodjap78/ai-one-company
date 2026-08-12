import fs from 'node:fs';
import path from 'node:path';
import {
  BATCH_02_REQUIRED_HERO_FILENAMES,
  normalizeBatchId,
} from './batchRecipeIds';
import { buildHeroPrompt } from './buildImagePrompts';
import { PATHS } from './config';
import type { AssetManifest, ScannedRecipe } from './types';

function fileExists(absPath: string): boolean {
  return fs.existsSync(absPath) && fs.statSync(absPath).isFile();
}

/**
 * Write `generated/recipe-reports/batch-XX-assets.md` for a dry-run batch.
 * Does not modify registries or overwrite asset image files.
 */
export function writeBatchAssetsReport(
  batchRaw: string,
  recipes: ScannedRecipe[],
  manifest: AssetManifest,
): string {
  const batch = normalizeBatchId(batchRaw);
  const reportDir = path.join(PATHS.appRoot, 'generated/recipe-reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `batch-${batch}-assets.md`);

  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const missingIngredients = manifest.ingredients.filter((i) => !i.fileExists);
  const existingIngredients = manifest.ingredients.filter((i) => i.fileExists);
  const missingSteps = manifest.steps.filter((s) => !s.fileExists);
  const existingSteps = manifest.steps.filter((s) => s.fileExists);

  const heroRows =
    batch === '02'
      ? BATCH_02_REQUIRED_HERO_FILENAMES.map((entry) => {
          const recipe = recipeById.get(entry.id);
          const abs = path.join(PATHS.mealAssetsDir, entry.requiredFilename);
          const exists = fileExists(abs);
          return {
            ...entry,
            currentHeroKey: recipe?.heroImageKey ?? '(missing recipe)',
            relativePath: `assets/meals/${entry.requiredFilename}`,
            exists,
            prompt: buildHeroPrompt({
              recipeName: entry.name,
              heroFilename: entry.requiredFilename,
            }),
          };
        })
      : recipes.map((recipe) => {
          const filename = `${recipe.heroImageKey}.jpg`;
          const abs = path.join(PATHS.mealAssetsDir, filename);
          return {
            id: recipe.id,
            name: recipe.name,
            requiredFilename: filename,
            currentHeroKey: recipe.heroImageKey,
            relativePath: `assets/meals/${filename}`,
            exists: fileExists(abs),
            prompt: buildHeroPrompt({
              recipeName: recipe.name,
              heroFilename: filename,
            }),
          };
        });

  const missingHeroes = heroRows.filter((h) => !h.exists);
  const existingHeroes = heroRows.filter((h) => h.exists);

  const lines: string[] = [
    `# Batch ${batch} — Recipe Assets Preparation Report`,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '> Dry-run only. Registries not modified. Existing asset files not overwritten.',
    '',
    '## Summary',
    '',
    '| Type | Missing | Existing | Total |',
    '| --- | ---: | ---: | ---: |',
    `| Hero images | ${missingHeroes.length} | ${existingHeroes.length} | ${heroRows.length} |`,
    `| Ingredient images | ${missingIngredients.length} | ${existingIngredients.length} | ${manifest.ingredients.length} |`,
    `| Cooking-step images | ${missingSteps.length} | ${existingSteps.length} | ${manifest.steps.length} |`,
    '',
    '## Recipes',
    '',
    ...recipes.map((r) => `- \`${r.id}\` ${r.name}`),
    '',
    '## Missing hero images',
    '',
    '| ID | Name | Required filename | Current recipe key | Status |',
    '| --- | --- | --- | --- | --- |',
    ...heroRows.map(
      (h) =>
        `| ${h.id} | ${h.name} | \`${h.requiredFilename}\` | \`${h.currentHeroKey}\` | ${h.exists ? 'EXISTS' : 'MISSING'} |`,
    ),
    '',
    '> Required filenames are the RF-2A production targets. Recipe data / `heroImageKey` are unchanged in this sprint.',
    '',
    '### Required hero filenames',
    '',
    ...heroRows.map((h) => `- \`assets/meals/${h.requiredFilename}\``),
    '',
    '## Missing ingredient images',
    '',
  ];

  if (missingIngredients.length === 0) {
    lines.push('_None — all ingredient icons present on disk._', '');
  } else {
    lines.push('| iconKey | Filename | Names | Used by |', '| --- | --- | --- | --- |');
    for (const item of missingIngredients) {
      lines.push(
        `| \`${item.iconKey}\` | \`${item.filename}\` | ${item.names.join(', ')} | ${item.usedByRecipeIds.join(', ')} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Missing cooking-step images', '');
  if (missingSteps.length === 0) {
    lines.push('_None — all step images present on disk._', '');
  } else {
    lines.push(
      '| Recipe | Order | imageKey | Filename | Title |',
      '| --- | ---: | --- | --- | --- |',
    );
    for (const step of missingSteps) {
      lines.push(
        `| ${step.recipeId} ${step.recipeName} | ${step.order} | \`${step.imageKey}\` | \`${step.filename}\` | ${step.title} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Generated prompts', '', '### Hero prompts', '');
  for (const hero of heroRows) {
    lines.push(`#### ${hero.id} ${hero.name} — \`${hero.requiredFilename}\``);
    lines.push('');
    lines.push('```');
    lines.push(hero.prompt);
    lines.push('```');
    lines.push('');
  }

  lines.push('### Ingredient prompts', '');
  for (const item of missingIngredients) {
    lines.push(`#### \`${item.iconKey}\` → \`${item.filename}\``);
    lines.push(`- names: ${item.names.join(', ')}`);
    lines.push('');
    lines.push('```');
    lines.push(item.prompt);
    lines.push('```');
    lines.push('');
  }

  lines.push('### Cooking-step prompts', '');
  for (const step of missingSteps) {
    lines.push(
      `#### ${step.recipeId} ${step.order}단계 — \`${step.filename}\``,
    );
    lines.push(`- ${step.title}`);
    lines.push('');
    lines.push('```');
    lines.push(step.prompt);
    lines.push('```');
    lines.push('');
  }

  lines.push(
    '## Notes',
    '',
    '- Per-recipe manifests/prompts also under `generated/recipe-assets/{id}/`.',
    '- Image provider remains disabled until wired; this report prepares filenames + prompts only.',
    '- Do not register `require()` keys until files exist on disk.',
    '',
  );

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return path.relative(PATHS.appRoot, reportPath);
}
