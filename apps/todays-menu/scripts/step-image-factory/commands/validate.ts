/**
 * npm run step:validate -- --from=001 --to=050
 */
import path from 'node:path';
import { loadStepManifest } from '../collectSteps';
import { loadStepQueue } from '../buildQueue';
import { PATHS } from '../config';
import { validateSteps } from '../validateSteps';
import { writeStepDashboard } from '../writeDashboard';

function parseArgs(argv: string[]) {
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1] ?? '001';
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? '050';
  return { fromId, toId };
}

function main(): void {
  console.log('\n========== step:validate (STEP-1) ==========');
  const { fromId, toId } = parseArgs(process.argv.slice(2));
  console.log(`Range: ${fromId}–${toId}\n`);

  const result = validateSteps(fromId, toId);
  console.log(`Validation: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Total steps: ${result.totalSteps}`);
  console.log(`Approved: ${result.approved}`);
  console.log(`Missing files (approved): ${result.missingFiles.length}`);
  console.log(`Missing registry: ${result.missingRegistry.length}`);
  console.log(`Require mismatches: ${result.requireMismatches.length}`);
  console.log(`Duplicate keys: ${result.duplicateKeys.length}`);
  console.log(`Casing issues: ${result.casingIssues.length}`);
  console.log(`Key mismatches: ${result.keyMismatches.length}`);
  console.log(`Unresolved: ${result.unresolved.length}`);
  console.log(`Recipe coverage (assets): ${result.recipeCoveragePercent}%`);
  console.log(
    `Overall completion: ${
      result.totalSteps === 0
        ? 0
        : Math.round((result.approved / result.totalSteps) * 1000) / 10
    }%`,
  );
  console.log(`TypeScript: ${result.typescriptOk ? 'PASS' : 'FAIL'}`);
  console.log(
    'Note: missing step images fall back to text-only step cards in Recipe Detail.',
  );

  if (result.issues.length) {
    console.log('\nIssues (sample):');
    for (const i of result.issues.slice(0, 20)) console.log(`  ! ${i}`);
  }

  const manifest = loadStepManifest();
  const queue = loadStepQueue();
  if (manifest && queue) {
    writeStepDashboard({
      manifest,
      queue,
      validationOk: result.ok,
      unresolved: result.unresolved,
    });
    console.log(`\nDashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  }

  process.exitCode = result.ok ? 0 : 1;
  console.log('===========================================\n');
}

main();
