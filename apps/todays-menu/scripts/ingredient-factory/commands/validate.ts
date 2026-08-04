/**
 * npm run ingredient:validate -- --from=001 --to=050
 */
import '../nodePngRequireStub';
import path from 'node:path';
import { loadIngredientManifest } from '../collectIngredients';
import { loadIngredientQueue } from '../buildQueue';
import { PATHS } from '../config';
import { validateIngredients } from '../validateIngredients';
import { writeIngredientDashboard } from '../writeDashboard';

function parseArgs(argv: string[]) {
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1] ?? '001';
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? '160';
  return { fromId, toId };
}

function main(): void {
  console.log('\n========== ingredient:validate (ING-2) ==========');
  const { fromId, toId } = parseArgs(process.argv.slice(2));
  console.log(`Range: ${fromId}–${toId}\n`);

  const result = validateIngredients(fromId, toId);
  console.log(`Validation: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Unique ingredients: ${result.totalUnique}`);
  console.log(`Approved (assets): ${result.approved}`);
  console.log(`Missing files (approved): ${result.missingFiles.length}`);
  console.log(`Missing registry: ${result.missingRegistry.length}`);
  console.log(`Require mismatches: ${result.requireMismatches.length}`);
  console.log(`Duplicate keys: ${result.duplicateKeys.length}`);
  console.log(`Casing issues: ${result.casingIssues.length}`);
  console.log(`Broken images: ${result.brokenImages.length}`);
  console.log(`Unresolved (resolve chain): ${result.unresolved.length}`);
  console.log(
    `Recipe coverage (resolve-safe): ${result.recipeCoveragePercent}%`,
  );
  console.log(
    `Overall completion (approved/unique): ${
      result.totalUnique === 0
        ? 0
        : Math.round((result.approved / result.totalUnique) * 1000) / 10
    }%`,
  );
  console.log(`TypeScript: ${result.typescriptOk ? 'PASS' : 'FAIL'}`);

  if (result.issues.length) {
    console.log('\nIssues (sample):');
    for (const i of result.issues.slice(0, 20)) console.log(`  ! ${i}`);
  }

  const manifest = loadIngredientManifest();
  const queue = loadIngredientQueue();
  if (manifest && queue) {
    writeIngredientDashboard({
      manifest,
      queue,
      validationOk: result.ok,
      unresolved: result.unresolved,
    });
    console.log(`\nDashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  }

  process.exitCode = result.ok ? 0 : 1;
  console.log('================================================\n');
}

main();
