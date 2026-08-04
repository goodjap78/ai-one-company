/**
 * npm run ingredient:approve -- --key=onion
 * npm run ingredient:approve -- --approved-only
 */
import path from 'node:path';
import { loadIngredientManifest } from '../collectIngredients';
import { loadIngredientQueue } from '../buildQueue';
import { PATHS } from '../config';
import { runIngredientApprove } from '../runApprove';
import { writeIngredientDashboard } from '../writeDashboard';

function parseArgs(argv: string[]) {
  const decisionArg =
    argv.find((a) => a.startsWith('--decision='))?.split('=')[1] ??
    argv.find((a) => a.startsWith('--action='))?.split('=')[1];
  const iconKey = argv.find((a) => a.startsWith('--key='))?.split('=')[1];
  const approvedOnly = argv.includes('--approved-only');
  const force = argv.includes('--force');
  const decision =
    (decisionArg as 'approve' | 'reject' | 'regenerate' | undefined) ??
    (iconKey || approvedOnly ? 'approve' : undefined);
  return { decision, iconKey, approvedOnly, force };
}

function main(): void {
  console.log('\n========== ingredient:approve (ING-1) ==========');
  const args = parseArgs(process.argv.slice(2));
  if (!args.decision) {
    console.error(
      'Usage:\n' +
        '  npm run ingredient:approve -- --key=onion\n' +
        '  npm run ingredient:approve -- --approved-only\n' +
        '  npm run ingredient:approve -- --key=onion --decision=reject',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = runIngredientApprove({
      decision: args.decision,
      iconKey: args.iconKey,
      approvedOnly: args.approvedOnly,
      force: args.force,
    });
    console.log(`Touched: ${result.touched.join(', ') || '—'}`);
    console.log(`Promoted: ${result.promoted.join(', ') || '—'}`);
    console.log(`Registry updated: ${result.registryUpdated}`);

    const manifest = loadIngredientManifest();
    const queue = loadIngredientQueue();
    if (manifest && queue) {
      writeIngredientDashboard({ manifest, queue });
      console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
  console.log('===============================================\n');
}

main();
