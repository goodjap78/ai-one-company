/**
 * Sprint IMG-1 STEP 6 — production dashboard.
 */
import type { HeroFactoryManifest } from './types';

export function buildDashboardMarkdown(manifest: HeroFactoryManifest): string {
  const { validation } = manifest;
  const completedItems = manifest.items.filter((i) => i.status === 'completed');
  const missingItems = manifest.items.filter((i) => i.status === 'missing');

  const lines: string[] = [
    '# HANKKI Hero Image Factory — Dashboard',
    '',
    `> Sprint IMG-1 · generated ${manifest.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Recipes | ${manifest.total} |`,
    `| Hero Images (on disk) | ${manifest.completed} |`,
    `| Completed | ${manifest.completed} |`,
    `| Missing | ${manifest.missing} |`,
    `| Progress | **${manifest.progressPercent}%** |`,
    `| Validation | ${validation.ok ? 'PASS' : 'FAIL (see issues)'} |`,
    '',
    '## Progress',
    '',
    '```',
    renderBar(manifest.progressPercent),
    '```',
    '',
    '## Validation',
    '',
    `| Check | Count |`,
    `| --- | ---: |`,
    `| Duplicate heroImageKey | ${validation.duplicateHeroImageKeys.length} |`,
    `| Duplicate filename | ${validation.duplicateFilenames.length} |`,
    `| Missing recipe fields | ${validation.missingRecipes.length} |`,
    `| Missing prompt files | ${validation.missingPrompts.length} |`,
    `| Missing hero JPGs | ${validation.missingHeroImages.length} |`,
    '',
  ];

  if (validation.duplicateHeroImageKeys.length > 0) {
    lines.push('### Duplicate heroImageKey', '');
    for (const d of validation.duplicateHeroImageKeys) {
      lines.push(`- \`${d.key}\` → recipes ${d.recipeIds.join(', ')}`);
    }
    lines.push('');
  }

  if (validation.duplicateFilenames.length > 0) {
    lines.push('### Duplicate filenames', '');
    for (const d of validation.duplicateFilenames) {
      lines.push(`- \`${d.filename}\` → recipes ${d.recipeIds.join(', ')}`);
    }
    lines.push('');
  }

  if (validation.missingPrompts.length > 0) {
    lines.push('### Missing prompts', '');
    for (const f of validation.missingPrompts) {
      lines.push(`- \`${f}\``);
    }
    lines.push('');
  }

  lines.push(
    '## Completed hero images',
    '',
    `| ID | Name | File |`,
    `| --- | --- | --- |`,
  );
  for (const item of completedItems) {
    lines.push(
      `| ${item.recipeId} | ${item.recipeName} | \`${item.outputFilename}\` |`,
    );
  }
  if (completedItems.length === 0) {
    lines.push('| — | — | — |');
  }

  lines.push(
    '',
    '## Missing hero images',
    '',
    `| ID | Name | Output | Prompt |`,
    `| --- | --- | --- | --- |`,
  );
  for (const item of missingItems) {
    lines.push(
      `| ${item.recipeId} | ${item.recipeName} | \`${item.outputFilename}\` | \`${item.promptFilename}\` |`,
    );
  }
  if (missingItems.length === 0) {
    lines.push('| — | — | — | — |');
  }

  lines.push(
    '',
    '## All recipes',
    '',
    `| ID | Name | Key | Status | Cooking style | Main ingredients | Tags |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
  );

  for (const recipe of manifest.recipes) {
    const item = manifest.items.find((i) => i.recipeId === recipe.id);
    const status = item?.status ?? 'missing';
    lines.push(
      `| ${recipe.id} | ${recipe.recipeTitle} | \`${recipe.heroImageKey}\` | ${status} | ${recipe.cookingStyle} | ${recipe.mainIngredients.join(', ') || '—'} | ${recipe.recommendationTags.join(', ') || '—'} |`,
    );
  }

  lines.push(
    '',
    '## Next step',
    '',
    'Image generation is **not** enabled in IMG-1.',
    'Review prompts under `generated/image-factory/prompts/`, then run the image provider sprint.',
    '',
  );

  return lines.join('\n');
}

function renderBar(percent: number): string {
  const width = 40;
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${'#'.repeat(filled)}${'-'.repeat(empty)}] ${percent}%`;
}
