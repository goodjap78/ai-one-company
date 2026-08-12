/**
 * npm run hero:validate
 * npm run hero:validate -- --recipe=003
 * npm run hero:validate -- --from=001 --to=050
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildImageQueue, loadImageQueue, writeImageQueue } from '../buildImageQueue';
import { PATHS } from '../config';
import { validateHeroProduction } from '../validateProduction';
import { validateRecipeHero } from '../validateRecipeHero';
import { validateHeroRange } from '../validateHeroRange';
import {
  buildProductionDashboardMarkdown,
  writeScopedDashboard,
} from '../writeProductionDashboard';

function parseArgs(argv: string[]) {
  const recipeId =
    argv.find((a) => a.startsWith('--recipe='))?.slice(9) ??
    argv.find((a) => a.startsWith('--id='))?.slice(5);
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  return { recipeId, fromId, toId };
}

function main(): void {
  console.log('\n========== hero:validate (IMG-3) ==========');

  const args = parseArgs(process.argv.slice(2));

  if (args.recipeId) {
    console.log(`Scoped to recipe: ${args.recipeId}\n`);
    const result = validateRecipeHero(args.recipeId);
    console.log(`Recipe: ${result.recipeId} ${result.recipeName}`);
    console.log(`heroImageKey: ${result.heroImageKey}`);
    console.log(`Validation: ${result.ok ? 'PASS' : 'FAIL'}\n`);
    for (const c of result.checks) {
      console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}: ${c.detail}`);
    }
    process.exitCode = result.ok ? 0 : 1;
    console.log('===========================================\n');
    return;
  }

  if (args.fromId && args.toId) {
    console.log(`Scoped range: ${args.fromId}–${args.toId}\n`);
    const result = validateHeroRange(args.fromId, args.toId);
    console.log(`Validation: ${result.ok ? 'PASS' : 'FAIL'}`);
    console.log(`Recipes checked: ${result.recipeCount}`);
    console.log(`Approved: ${result.approved}`);
    console.log(`Missing production: ${result.missingProduction}`);
    console.log(`Duplicate keys: ${result.duplicateHeroKeys.length}`);
    console.log(`Filename collisions: ${result.filenameCollisions.length}`);
    console.log(`Registry gaps: ${result.missingRegistry.length}`);
    console.log(`TypeScript: ${result.typescriptOk ? 'PASS' : 'FAIL'}`);
    if (result.issues.length) {
      console.log('\nIssues (sample):');
      for (const i of result.issues.slice(0, 25)) console.log(`  ! ${i}`);
    }

    const queue = loadImageQueue() ?? buildImageQueue();
    writeScopedDashboard(queue, validateHeroProduction(), args.fromId, args.toId);
    console.log(`\nDashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
    process.exitCode = result.ok ? 0 : 1;
    console.log('===========================================\n');
    return;
  }

  const queue = loadImageQueue() ?? buildImageQueue();
  if (!loadImageQueue()) writeImageQueue(queue);

  const validation = validateHeroProduction();
  console.log(`Validation: ${validation.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Broken files:              ${validation.brokenFiles.length}`);
  console.log(`Duplicate filenames:       ${validation.duplicateFilenames.length}`);
  console.log(`Duplicate heroImageKeys:   ${validation.duplicateHeroImageKeys.length}`);
  console.log(`Missing registry entries:  ${validation.missingRegistryEntries.length}`);

  fs.writeFileSync(
    PATHS.dashboard,
    buildProductionDashboardMarkdown({ queue, validation }),
    'utf8',
  );
  console.log(`\nDashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  console.log('===========================================\n');
  process.exitCode = validation.ok ? 0 : 1;
}

main();
