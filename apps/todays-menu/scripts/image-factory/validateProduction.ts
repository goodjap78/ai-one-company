/**
 * STEP 9 — Production engine validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadImageQueue, loadHeroManifest } from './buildImageQueue';
import { HERO_SIZE_EXPECT, PATHS } from './config';
import { inspectImageFile } from './engine';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';

export type ProductionValidation = {
  ok: boolean;
  brokenFiles: string[];
  duplicateFilenames: Array<{ filename: string; recipeIds: string[] }>;
  duplicateHeroImageKeys: Array<{ key: string; recipeIds: string[] }>;
  missingRegistryEntries: string[];
  invalidImageSizes: string[];
  unsupportedExtensions: string[];
  /** e.g. .jpg filename containing PNG bytes (legacy Batch 01 debt) */
  formatMismatches: string[];
  issues: string[];
};

function groupDupes(
  pairs: Array<{ key: string; id: string }>,
): Array<{ key: string; recipeIds: string[] }> {
  const map = new Map<string, string[]>();
  for (const p of pairs) {
    const list = map.get(p.key) ?? [];
    list.push(p.id);
    map.set(p.key, list);
  }
  return [...map.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, recipeIds]) => ({ key, recipeIds }));
}

export function validateHeroProduction(): ProductionValidation {
  const manifest = loadHeroManifest();
  const queue = loadImageQueue();
  const issues: string[] = [];
  const brokenFiles: string[] = [];
  const invalidImageSizes: string[] = [];
  const unsupportedExtensions: string[] = [];
  const formatMismatches: string[] = [];

  const duplicateHeroImageKeys = groupDupes(
    manifest.items.map((i) => ({ key: i.heroImageKey, id: i.recipeId })),
  ).map(({ key, recipeIds }) => ({ key, recipeIds }));

  const duplicateFilenames = groupDupes(
    manifest.items.map((i) => ({ key: i.outputFilename, id: i.recipeId })),
  ).map(({ key, recipeIds }) => ({ filename: key, recipeIds }));

  if (duplicateHeroImageKeys.length) {
    issues.push(`duplicate heroImageKey: ${duplicateHeroImageKeys.length}`);
  }
  if (duplicateFilenames.length) {
    issues.push(`duplicate filenames: ${duplicateFilenames.length}`);
  }

  // Production files on disk
  for (const entry of manifest.items) {
    const abs = path.join(PATHS.mealAssetsDir, entry.outputFilename);
    if (!fs.existsSync(abs)) continue;

    const check = inspectImageFile(abs, {
      minWidth: HERO_SIZE_EXPECT.minWidth,
      minHeight: HERO_SIZE_EXPECT.minHeight,
      aspectHint: HERO_SIZE_EXPECT.aspectHint,
    });

    if (!check.extensionOk) {
      unsupportedExtensions.push(entry.outputFilename);
    }
    if (check.formatMismatch) {
      formatMismatches.push(
        `${entry.outputFilename}: ${check.issues.filter((i) => i.includes('mismatch')).join('; ')}`,
      );
    }
    if (check.broken) {
      brokenFiles.push(`${entry.outputFilename}: ${check.issues.join('; ')}`);
    } else {
      const sizeIssues = check.issues.filter(
        (i) =>
          i.includes('aspect') ||
          i.includes('width') ||
          i.includes('height') ||
          i.includes('could not parse'),
      );
      if (sizeIssues.length) {
        invalidImageSizes.push(
          `${entry.outputFilename}: ${sizeIssues.join('; ')}`,
        );
      }
    }
  }

  // Approved queue items must be registered
  const registered = new Set(parseRegisteredMealKeys());
  const missingRegistryEntries: string[] = [];
  const approvedKeys =
    queue?.items.filter((i) => i.status === 'approved').map((i) => i.heroImageKey) ??
    manifest.items
      .filter((i) => fs.existsSync(path.join(PATHS.mealAssetsDir, i.outputFilename)))
      .map((i) => i.heroImageKey);

  for (const key of approvedKeys) {
    if (!registered.has(key)) {
      missingRegistryEntries.push(key);
    }
  }

  if (brokenFiles.length) issues.push(`broken files: ${brokenFiles.length}`);
  if (formatMismatches.length) {
    issues.push(`format mismatches (warn): ${formatMismatches.length}`);
  }
  if (missingRegistryEntries.length) {
    issues.push(`missing registry: ${missingRegistryEntries.length}`);
  }
  if (unsupportedExtensions.length) {
    issues.push(`bad extension: ${unsupportedExtensions.length}`);
  }

  // Format mismatch is legacy debt (PNG bytes named .jpg) — warn, do not block engine.
  const ok =
    duplicateHeroImageKeys.length === 0 &&
    duplicateFilenames.length === 0 &&
    brokenFiles.length === 0 &&
    missingRegistryEntries.length === 0 &&
    unsupportedExtensions.length === 0;

  return {
    ok,
    brokenFiles,
    duplicateFilenames,
    duplicateHeroImageKeys,
    missingRegistryEntries,
    invalidImageSizes,
    unsupportedExtensions,
    formatMismatches,
    issues,
  };
}
