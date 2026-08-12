/**
 * npm run step:approve -- --key=kimchi_stew_step_01
 * npm run step:approve -- --approved-only
 */
import path from 'node:path';
import { loadStepManifest } from '../collectSteps';
import { loadStepQueue } from '../buildQueue';
import { PATHS } from '../config';
import { runStepApprove } from '../runApprove';
import { writeStepDashboard } from '../writeDashboard';

function parseArgs(argv: string[]) {
  const decisionArg =
    argv.find((a) => a.startsWith('--decision='))?.split('=')[1] ??
    argv.find((a) => a.startsWith('--action='))?.split('=')[1];
  const imageKey = argv.find((a) => a.startsWith('--key='))?.split('=')[1];
  const approvedOnly = argv.includes('--approved-only');
  const force = argv.includes('--force');
  const decision =
    (decisionArg as 'approve' | 'reject' | 'regenerate' | undefined) ??
    (imageKey || approvedOnly ? 'approve' : undefined);
  return { decision, imageKey, approvedOnly, force };
}

function main(): void {
  console.log('\n========== step:approve (STEP-1) ==========');
  const args = parseArgs(process.argv.slice(2));
  if (!args.decision) {
    console.error(
      'Usage:\n' +
        '  npm run step:approve -- --key=kimchi_stew_step_01\n' +
        '  npm run step:approve -- --approved-only\n' +
        '  npm run step:approve -- --key=kimchi_stew_step_01 --decision=reject',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = runStepApprove({
      decision: args.decision,
      imageKey: args.imageKey,
      approvedOnly: args.approvedOnly,
      force: args.force,
    });
    console.log(`Touched: ${result.touched.join(', ') || '—'}`);
    console.log(`Promoted: ${result.promoted.join(', ') || '—'}`);
    console.log(`Registry updated: ${result.registryUpdated}`);

    const manifest = loadStepManifest();
    const queue = loadStepQueue();
    if (manifest && queue) {
      writeStepDashboard({ manifest, queue });
      console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
  console.log('==========================================\n');
}

main();
