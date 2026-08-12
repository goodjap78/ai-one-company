/**
 * Sprint IMG-1 — HANKKI Hero Image Factory (developer automation).
 *
 * Prepares hero image production artifacts only — does NOT generate images.
 *
 * npm run image-factory:prepare
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildHeroFactoryManifest, buildHeroManifestEntries } from './buildHeroManifest';
import { buildHeroPromptMarkdown } from './buildHeroPrompts';
import { collectHankkiRecipes } from './collectRecipes';
import { PATHS } from './config';
import { validateHeroFactory } from './validateHeroFactory';
import { buildDashboardMarkdown } from './writeDashboard';

function ensureDirs(): void {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(PATHS.promptsDir, { recursive: true });
}

function writePromptFiles(
  recipes: ReturnType<typeof collectHankkiRecipes>,
): string[] {
  const written: string[] = [];
  for (const recipe of recipes) {
    const filename = `${recipe.heroImageKey}.md`;
    const abs = path.join(PATHS.promptsDir, filename);
    fs.writeFileSync(abs, buildHeroPromptMarkdown(recipe), 'utf8');
    written.push(path.relative(PATHS.appRoot, abs));
  }
  return written;
}

function main(): void {
  console.log('\n========== Sprint IMG-1 · Hero Image Factory ==========');
  console.log('Mode: prepare only (no image generation)\n');

  ensureDirs();

  // STEP 1 — collect
  const recipes = collectHankkiRecipes();
  console.log(`STEP 1  Collected ${recipes.length} HANKKI recipes`);

  // STEP 2 / 4 — preliminary items for validation after prompts
  const preliminaryItems = buildHeroManifestEntries(recipes);

  // STEP 3 — prompts first so validation can see them
  const promptFiles = writePromptFiles(recipes);
  console.log(`STEP 3  Wrote ${promptFiles.length} prompt files → generated/image-factory/prompts/`);

  // STEP 5 — validate (after prompts exist)
  const validation = validateHeroFactory(recipes, preliminaryItems);
  console.log(
    `STEP 5  Validation ${validation.ok ? 'PASS' : 'ISSUES'} · missing JPGs: ${validation.missingHeroImages.length}`,
  );

  // STEP 2 — final manifest with validation embedded
  const manifest = buildHeroFactoryManifest(recipes, validation);
  fs.writeFileSync(
    PATHS.heroManifest,
    JSON.stringify(manifest, null, 2),
    'utf8',
  );
  console.log(`STEP 2  Manifest → ${path.relative(PATHS.appRoot, PATHS.heroManifest)}`);

  // STEP 6 — dashboard
  const dashboard = buildDashboardMarkdown(manifest);
  fs.writeFileSync(PATHS.dashboard, dashboard, 'utf8');
  console.log(`STEP 6  Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);

  // Report
  console.log('\n---------- Report ----------');
  console.log(`Recipes:              ${manifest.total}`);
  console.log(`Completed (on disk):  ${manifest.completed}`);
  console.log(`Missing hero images:  ${manifest.missing}`);
  console.log(`Progress:             ${manifest.progressPercent}%`);
  console.log(
    `Duplicate heroImageKey: ${validation.duplicateHeroImageKeys.length}`,
  );
  console.log(
    `Duplicate filenames:    ${validation.duplicateFilenames.length}`,
  );
  console.log(`Missing prompts:       ${validation.missingPrompts.length}`);
  console.log(
    `Production readiness:  ${
      validation.ok && validation.duplicateHeroImageKeys.length === 0
        ? 'READY (prompts + manifest prepared; images not generated)'
        : 'BLOCKED — fix validation issues'
    }`,
  );

  if (validation.missingHeroImages.length > 0) {
    console.log('\nMissing hero JPGs (ready for generation):');
    for (const f of validation.missingHeroImages.slice(0, 15)) {
      console.log(`  - ${f}`);
    }
    if (validation.missingHeroImages.length > 15) {
      console.log(`  … +${validation.missingHeroImages.length - 15} more`);
    }
  }

  console.log('\nCreated files:');
  console.log(`  + ${path.relative(PATHS.appRoot, PATHS.heroManifest)}`);
  console.log(`  + ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  console.log(`  + ${promptFiles.length} prompts under generated/image-factory/prompts/`);
  console.log('===============================================\n');

  process.exitCode = validation.ok ? 0 : 1;
}

main();
