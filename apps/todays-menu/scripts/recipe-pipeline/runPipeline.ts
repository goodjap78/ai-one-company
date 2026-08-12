/**
 * Sprint R7 — Recipe production pipeline CLI.
 *
 * npm run recipes:pipeline
 *
 * Does NOT generate images.
 * Does NOT modify Home / Recipe Detail / recommendation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../recipe-assets/config';
import {
  PIPELINE_BATCH_META,
  PIPELINE_RECIPES,
  PIPELINE_TARGET_COUNT,
} from '../../data/recipes/pipeline/pipelineRecipes';
import { writeImageManifests } from './buildImageManifests';
import { writeAssetDashboard, writeProductionReport } from './buildReports';
import { validatePipeline } from './validatePipeline';

function writeBatchIndex(outDir: string): string {
  const lines = [
    '# Batch 01–10 Structure',
    '',
    `| Batch | Focus | Recipe IDs | Live in Home |`,
    `| --- | --- | --- | --- |`,
    ...PIPELINE_BATCH_META.map(
      (m) =>
        `| ${m.batchId} | ${m.cuisineFocus} — ${m.label} | ${String(m.idStart).padStart(3, '0')}–${String(m.idEnd).padStart(3, '0')} | ${m.liveInProduction ? 'YES' : 'no (draft)'} |`,
    ),
    '',
    `Target: **${PIPELINE_TARGET_COUNT}** recipes.`,
    `Pipeline loaded: **${PIPELINE_RECIPES.length}**.`,
    '',
  ];
  const file = path.join(outDir, 'batch-structure.md');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return path.relative(PATHS.appRoot, file);
}

function writeStatusSummary(
  validation: ReturnType<typeof validatePipeline>,
  outDir: string,
): string {
  const assetsNeeded =
    validation.missingHeroes.length +
    validation.missingIngredients.length +
    validation.missingSteps.length;

  const status =
    validation.ok && validation.liveCount >= 20
      ? validation.missingHeroes.length === 0 &&
        validation.missingIngredients.length === 0
        ? 'Store asset-ready'
        : 'Pipeline data ready — assets pending'
      : 'Needs data fixes';

  const lines = [
    '# Overall Production Status',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Recipes ready (fields OK) | ${validation.readyCount} |`,
    `| Recipes missing fields | ${validation.missingFieldCount} |`,
    `| Live in Home | ${validation.liveCount} |`,
    `| Draft prepared | ${validation.draftCount} |`,
    `| Assets needed (unique missing files) | ${assetsNeeded} |`,
    `| Heroes missing | ${validation.missingHeroes.length} |`,
    `| Ingredient icons missing | ${validation.missingIngredients.length} |`,
    `| Step images missing | ${validation.missingSteps.length} |`,
    `| Status | **${status}** |`,
    '',
  ];
  const file = path.join(outDir, 'overall-status.md');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return path.relative(PATHS.appRoot, file);
}

async function main(): Promise<void> {
  const outDir = path.join(PATHS.appRoot, 'generated/recipe-pipeline');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('\n========== HANKKI Recipe Production Pipeline ==========');
  console.log(`Target: ${PIPELINE_TARGET_COUNT}`);
  console.log(`Loaded: ${PIPELINE_RECIPES.length}`);

  const validation = validatePipeline();
  const batchIndex = writeBatchIndex(outDir);
  const manifests = writeImageManifests(validation, outDir);
  const report = writeProductionReport(validation, outDir);
  const dashboard = writeAssetDashboard(validation, outDir);
  const status = writeStatusSummary(validation, outDir);

  // Persist machine-readable validation
  const validationPath = path.join(outDir, 'validation.json');
  fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2), 'utf8');

  console.log('\n--- Validation ---');
  console.log(`ok: ${validation.ok}`);
  console.log(`ready: ${validation.readyCount}/${validation.totalRecipes}`);
  console.log(`live: ${validation.liveCount}  draft: ${validation.draftCount}`);
  console.log(
    `missing assets — heroes: ${validation.missingHeroes.length}, ingredients: ${validation.missingIngredients.length}, steps: ${validation.missingSteps.length}`,
  );
  console.log(
    `duplicates — ids: ${validation.duplicateIds.length}, names: ${validation.duplicateNames.length}, heroes: ${validation.duplicateHeroKeys.length}`,
  );

  console.log('\n--- Outputs ---');
  console.log(`  ${batchIndex}`);
  console.log(`  ${report}`);
  console.log(`  ${dashboard}`);
  console.log(`  ${status}`);
  for (const m of manifests) console.log(`  ${m}`);
  console.log(`  ${path.relative(PATHS.appRoot, validationPath)}`);
  console.log('=======================================================\n');

  process.exitCode = validation.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
