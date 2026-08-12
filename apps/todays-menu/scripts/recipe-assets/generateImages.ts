import fs from 'node:fs';
import { DISABLED_PROVIDER_MESSAGE, INGREDIENT_IMAGE, STEP_IMAGE } from './config';
import type { ImageProvider } from './providers/ImageProvider';
import { saveGeneratedImage } from './saveGeneratedImages';
import type { AssetManifest, RunReport } from './types';

export type GenerateOptions = {
  force: boolean;
  /** When true, only prepare — never call provider. */
  dryRun: boolean;
};

/**
 * Attempt generation for missing assets.
 * With DisabledImageProvider, stops safely after preparing prompts/manifest.
 */
export async function generateImages(
  manifest: AssetManifest,
  provider: ImageProvider,
  options: GenerateOptions,
): Promise<RunReport> {
  const report: RunReport = {
    mode: options.dryRun ? 'dry' : 'generate',
    createdFiles: [],
    skippedFiles: [],
    missingAssets: [],
    updatedMappingFiles: [],
    errors: [],
    providerStatus: provider.isConfigured
      ? `configured:${provider.name}`
      : `disabled:${provider.name}`,
  };

  const missingIngredients = manifest.ingredients.filter((i) => !i.fileExists);
  const missingSteps = manifest.steps.filter((s) => !s.fileExists);
  const existingIngredients = manifest.ingredients.filter((i) => i.fileExists);
  const existingSteps = manifest.steps.filter((s) => s.fileExists);

  for (const item of existingIngredients) {
    report.skippedFiles.push(item.relativePath);
  }
  for (const item of existingSteps) {
    report.skippedFiles.push(item.relativePath);
  }
  for (const item of missingIngredients) {
    report.missingAssets.push(item.relativePath);
  }
  for (const item of missingSteps) {
    report.missingAssets.push(item.relativePath);
  }

  if (options.dryRun) {
    return report;
  }

  if (!provider.isConfigured) {
    report.errors.push(DISABLED_PROVIDER_MESSAGE);
    return report;
  }

  for (const item of missingIngredients) {
    if (fs.existsSync(item.absolutePath) && !options.force) {
      report.skippedFiles.push(item.relativePath);
      continue;
    }

    const result = await provider.generateImage({
      prompt: item.prompt,
      width: INGREDIENT_IMAGE.width,
      height: INGREDIENT_IMAGE.height,
      format: 'png',
      outputPath: item.absolutePath,
    });

    if (result.status === 'disabled') {
      report.errors.push(result.error ?? DISABLED_PROVIDER_MESSAGE);
      return report;
    }

    if (result.status === 'created' && result.outputPath) {
      const saved = saveGeneratedImage({
        sourcePath: result.outputPath,
        destinationPath: item.absolutePath,
        force: options.force,
      });
      if (saved.status === 'created') {
        report.createdFiles.push(item.relativePath);
      } else if (saved.status === 'skipped') {
        report.skippedFiles.push(item.relativePath);
      } else {
        report.errors.push(saved.error ?? `Failed to save ${item.relativePath}`);
      }
    } else if (result.status === 'skipped') {
      report.skippedFiles.push(item.relativePath);
    } else {
      report.errors.push(
        result.error ?? `Failed to generate ${item.relativePath}`,
      );
    }
  }

  for (const item of missingSteps) {
    if (fs.existsSync(item.absolutePath) && !options.force) {
      report.skippedFiles.push(item.relativePath);
      continue;
    }

    const result = await provider.generateImage({
      prompt: item.prompt,
      width: STEP_IMAGE.width,
      height: STEP_IMAGE.height,
      format: 'jpg',
      outputPath: item.absolutePath,
    });

    if (result.status === 'disabled') {
      report.errors.push(result.error ?? DISABLED_PROVIDER_MESSAGE);
      return report;
    }

    if (result.status === 'created' && result.outputPath) {
      const saved = saveGeneratedImage({
        sourcePath: result.outputPath,
        destinationPath: item.absolutePath,
        force: options.force,
      });
      if (saved.status === 'created') {
        report.createdFiles.push(item.relativePath);
      } else if (saved.status === 'skipped') {
        report.skippedFiles.push(item.relativePath);
      } else {
        report.errors.push(saved.error ?? `Failed to save ${item.relativePath}`);
      }
    } else if (result.status === 'skipped') {
      report.skippedFiles.push(item.relativePath);
    } else {
      report.errors.push(
        result.error ?? `Failed to generate ${item.relativePath}`,
      );
    }
  }

  return report;
}
