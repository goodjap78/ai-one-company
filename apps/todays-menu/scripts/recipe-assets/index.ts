/**
 * Sprint A1 — Recipe asset automation CLI (developer tool).
 *
 * npm run recipe-assets:check
 * npm run recipe-assets:dry -- --recipe=003
 * npm run recipe-assets:dry -- --batch=02
 * npm run recipe-assets:generate -- --recipe=003
 * npm run recipe-assets:validate -- --recipe=003
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveBatchRecipeIds } from './batchRecipeIds';
import { buildAssetManifest } from './buildAssetManifest';
import { formatPromptsMarkdown } from './buildImagePrompts';
import { DISABLED_PROVIDER_MESSAGE, PATHS } from './config';
import { generateImages } from './generateImages';
import { readRecipes } from './readRecipes';
import { createImageProvider } from './providers/DisabledImageProvider';
import type { CliMode, CliOptions, RunReport } from './types';
import { updateIngredientRegistry } from './updateIngredientRegistry';
import { updateStepImageRegistry } from './updateStepImageRegistry';
import { validateRecipeAssets } from './validateRecipeAssets';
import { writeBatchAssetsReport } from './writeBatchAssetsReport';

function parseArgs(argv: string[]): CliOptions {
  const modeArg = argv.find((a) => a.startsWith('--mode='));
  const mode = (modeArg?.split('=')[1] ?? 'dry') as CliMode;

  const recipeIds: string[] = [];
  let batch: string | null = null;

  for (const arg of argv) {
    if (arg.startsWith('--recipe=')) {
      recipeIds.push(...arg.slice('--recipe='.length).split(',').filter(Boolean));
    }
    if (arg.startsWith('--batch=')) {
      batch = arg.slice('--batch='.length).trim() || null;
    }
  }
  // support `--recipe 003` / `--batch 02`
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--recipe' && argv[i + 1] && !argv[i + 1].startsWith('-')) {
      recipeIds.push(argv[i + 1]);
    }
    if (argv[i] === '--batch' && argv[i + 1] && !argv[i + 1].startsWith('-')) {
      batch = argv[i + 1];
    }
  }

  let resolvedIds: string[] | null =
    recipeIds.length > 0 ? [...new Set(recipeIds)] : null;

  if (batch) {
    const batchIds = resolveBatchRecipeIds(batch);
    resolvedIds =
      resolvedIds && resolvedIds.length > 0
        ? resolvedIds.filter((id) => batchIds.includes(id))
        : batchIds;
  }

  return {
    mode,
    recipeIds: resolvedIds,
    batch,
    force: argv.includes('--force'),
  };
}

function writePreparedArtifacts(
  recipes: ReturnType<typeof readRecipes>,
  manifest: ReturnType<typeof buildAssetManifest>,
): string[] {
  const created: string[] = [];

  for (const recipe of recipes) {
    const dir = path.join(PATHS.generatedRoot, recipe.id);
    fs.mkdirSync(dir, { recursive: true });

    const recipeIngredients = manifest.ingredients.filter((i) =>
      i.usedByRecipeIds.includes(recipe.id),
    );
    const recipeSteps = manifest.steps.filter((s) => s.recipeId === recipe.id);

    const recipeManifest = {
      ...manifest,
      recipeIds: [recipe.id],
      ingredients: recipeIngredients,
      steps: recipeSteps,
      summary: {
        ingredientTotal: recipeIngredients.length,
        ingredientExisting: recipeIngredients.filter((i) => i.fileExists).length,
        ingredientMissing: recipeIngredients.filter((i) => !i.fileExists).length,
        stepTotal: recipeSteps.length,
        stepExisting: recipeSteps.filter((s) => s.fileExists).length,
        stepMissing: recipeSteps.filter((s) => !s.fileExists).length,
      },
    };

    const manifestPath = path.join(dir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(recipeManifest, null, 2), 'utf8');
    created.push(path.relative(PATHS.appRoot, manifestPath));

    const promptsPath = path.join(dir, 'prompts.md');
    fs.writeFileSync(
      promptsPath,
      formatPromptsMarkdown(
        recipe.id,
        recipe.name,
        recipeIngredients,
        recipeSteps,
      ),
      'utf8',
    );
    created.push(path.relative(PATHS.appRoot, promptsPath));
  }

  return created;
}

function printDryReport(
  recipes: ReturnType<typeof readRecipes>,
  manifest: ReturnType<typeof buildAssetManifest>,
): void {
  console.log('\n========== Recipe Assets DRY-RUN ==========');
  console.log(`Recipes: ${recipes.map((r) => `${r.id} ${r.name}`).join(', ')}`);
  console.log('');

  console.log('--- Heroes (current recipe keys) ---');
  for (const recipe of recipes) {
    const filename = `${recipe.heroImageKey}.jpg`;
    const abs = path.join(PATHS.mealAssetsDir, filename);
    const status = fs.existsSync(abs) ? 'EXISTS' : 'MISSING';
    console.log(`  [${status}] ${recipe.id} → assets/meals/${filename}`);
  }

  console.log('\n--- Ingredients ---');
  for (const item of manifest.ingredients) {
    const status = item.fileExists ? 'EXISTS' : 'MISSING';
    console.log(
      `  [${status}] ${item.iconKey} → ${item.relativePath} (${item.names.join('/')})`,
    );
  }

  console.log('\n--- Cooking steps ---');
  for (const item of manifest.steps) {
    const status = item.fileExists ? 'EXISTS' : 'MISSING';
    console.log(
      `  [${status}] ${item.imageKey} → ${item.relativePath} (${item.order}단계: ${item.title})`,
    );
  }

  if (manifest.duplicates.length) {
    console.log('\n--- Duplicates ---');
    for (const d of manifest.duplicates) console.log(`  ! ${d}`);
  }
  if (manifest.invalidKeys.length) {
    console.log('\n--- Invalid keys ---');
    for (const k of manifest.invalidKeys) console.log(`  ! ${k}`);
  }

  console.log('\n--- Summary ---');
  console.log(
    `  Ingredients: ${manifest.summary.ingredientExisting}/${manifest.summary.ingredientTotal} existing, ${manifest.summary.ingredientMissing} missing`,
  );
  console.log(
    `  Steps: ${manifest.summary.stepExisting}/${manifest.summary.stepTotal} existing, ${manifest.summary.stepMissing} missing`,
  );
  console.log('===========================================\n');
}

function printValidation(rows: ReturnType<typeof validateRecipeAssets>): void {
  console.log('\n========== Recipe Assets VALIDATE ==========');
  let pass = 0;
  let fail = 0;
  for (const row of rows) {
    const tag = row.verdict;
    if (tag === 'PASS') pass += 1;
    else fail += 1;
    console.log(`  [${tag}] ${row.kind}:${row.key}${row.recipeId ? ` (${row.recipeId})` : ''}`);
    for (const c of row.checks.filter((x) => x.verdict === 'FAIL')) {
      console.log(`         - FAIL ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
    }
  }
  console.log(`\n  Totals: PASS ${pass} / FAIL ${fail}`);
  console.log('============================================\n');
}

function printReport(report: RunReport): void {
  console.log('\n========== Run report ==========');
  console.log(`mode: ${report.mode}`);
  console.log(`provider: ${report.providerStatus}`);
  console.log(`created (${report.createdFiles.length}):`);
  for (const f of report.createdFiles) console.log(`  + ${f}`);
  console.log(`skipped (${report.skippedFiles.length}):`);
  for (const f of report.skippedFiles.slice(0, 20)) console.log(`  ~ ${f}`);
  if (report.skippedFiles.length > 20) {
    console.log(`  … +${report.skippedFiles.length - 20} more`);
  }
  console.log(`missing (${report.missingAssets.length}):`);
  for (const f of report.missingAssets) console.log(`  - ${f}`);
  console.log(`updated mapping files (${report.updatedMappingFiles.length}):`);
  for (const f of report.updatedMappingFiles) console.log(`  * ${f}`);
  if (report.errors.length) {
    console.log('errors:');
    for (const e of report.errors) console.log(`  ! ${e}`);
  }
  console.log('================================\n');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const recipes = readRecipes(options.recipeIds);
  const manifest = buildAssetManifest(recipes);
  const provider = createImageProvider();

  const report: RunReport = {
    mode: options.mode,
    createdFiles: [],
    skippedFiles: [],
    missingAssets: [],
    updatedMappingFiles: [],
    errors: [],
    providerStatus: provider.isConfigured
      ? `configured:${provider.name}`
      : `disabled:${provider.name}`,
  };

  if (options.mode === 'check' || options.mode === 'dry') {
    printDryReport(recipes, manifest);
    // Preparation artifacts only (not images / registries)
    report.createdFiles.push(...writePreparedArtifacts(recipes, manifest));
    if (options.batch) {
      const batchReport = writeBatchAssetsReport(
        options.batch,
        recipes,
        manifest,
      );
      report.createdFiles.push(batchReport);
      console.log(`Batch assets report: ${batchReport}`);
    }
    const gen = await generateImages(manifest, provider, {
      force: options.force,
      dryRun: true,
    });
    report.skippedFiles = gen.skippedFiles;
    report.missingAssets = gen.missingAssets;
    printReport(report);

    // Sample prompts to stdout for dry
    if (options.mode === 'dry' && manifest.ingredients[0]) {
      console.log('Sample ingredient prompt:\n');
      console.log(manifest.ingredients[0].prompt);
      console.log('\nSample step prompt:\n');
      if (manifest.steps[0]) console.log(manifest.steps[0].prompt);
      console.log('');
    }
    return;
  }

  if (options.mode === 'validate') {
    const rows = validateRecipeAssets(manifest);
    report.validation = rows;
    printValidation(rows);
    const failed = rows.some((r) => r.verdict === 'FAIL');
    printReport({
      ...report,
      missingAssets: [
        ...manifest.ingredients.filter((i) => !i.fileExists).map((i) => i.relativePath),
        ...manifest.steps.filter((s) => !s.fileExists).map((s) => s.relativePath),
      ],
    });
    process.exitCode = failed ? 1 : 0;
    return;
  }

  if (options.mode === 'generate') {
    report.createdFiles.push(...writePreparedArtifacts(recipes, manifest));

    const gen = await generateImages(manifest, provider, {
      force: options.force,
      dryRun: false,
    });
    report.createdFiles.push(...gen.createdFiles);
    report.skippedFiles.push(...gen.skippedFiles);
    report.missingAssets.push(...gen.missingAssets);
    report.errors.push(...gen.errors);

    if (!provider.isConfigured) {
      console.log(`\n${DISABLED_PROVIDER_MESSAGE}\n`);
      printDryReport(recipes, manifest);
      printReport(report);
      process.exitCode = 1;
      return;
    }

    // Sync registries for files that exist on disk after generation
    const ingKeys = manifest.ingredients
      .filter((i) => fs.existsSync(i.absolutePath))
      .map((i) => i.iconKey);
    const stepKeys = manifest.steps
      .filter((s) => fs.existsSync(s.absolutePath))
      .map((s) => s.imageKey);

    const ingUpdate = updateIngredientRegistry(ingKeys);
    const stepUpdate = updateStepImageRegistry(stepKeys);
    if (ingUpdate.updated) {
      report.updatedMappingFiles.push(
        path.relative(PATHS.appRoot, ingUpdate.path),
      );
    }
    if (stepUpdate.updated) {
      report.updatedMappingFiles.push(
        path.relative(PATHS.appRoot, stepUpdate.path),
      );
    }

    printReport(report);
    return;
  }

  throw new Error(`Unknown mode: ${options.mode}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
