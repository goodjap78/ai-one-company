/**
 * npm run ingredient:restore-approvals [-- --dry-run] [-- --apply]
 */
import path from 'node:path';
import { PATHS } from '../config';
import { runRestoreIngredientApprovals } from '../restoreIngredientApprovals';

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply');
  const dryRun = argv.includes('--dry-run') || !apply;
  return { dryRun };
}

function main(): void {
  console.log('\n========== ingredient:restore-approvals ==========');
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    console.log('Mode: dry-run (pass --apply to execute)\n');
  } else {
    console.log('Mode: apply\n');
  }

  try {
    const result = runRestoreIngredientApprovals({ dryRun });
    console.log('\n--- Result ---');
    console.log(`Restored (hash match): ${result.restored.length}`);
    console.log(`Approved from review: ${result.approvedFromReview.length}`);
    console.log(`Already complete: ${result.skipped.length}`);
    console.log(`Skipped/failed: ${result.failed.length}`);
    console.log(`Audit → ${result.auditPath}`);
    if (result.failed.length > 0) {
      console.log(`Failed keys: ${result.failed.join(', ')}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
  console.log('==================================================\n');
}

main();
