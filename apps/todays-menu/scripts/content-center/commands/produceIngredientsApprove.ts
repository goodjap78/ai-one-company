/**
 * CONTENT-3 — batch approve Ingredient Icons awaiting review.
 * Requires explicit --confirm. Never auto-approves.
 *
 *   npm run produce:ingredients:approve -- --confirm
 *   npm run produce:ingredients:approve -- --confirm --limit=20
 */
import { runIngredientApprove } from '../../ingredient-factory/runApprove';
import {
  getProductionProgress,
  listIngredientKeysAwaitingApproval,
  printProductionDashboard,
} from '../productionProgress';

function parseArgs(argv: string[]) {
  const confirm = argv.includes('--confirm');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 20;
  const keysArg = argv.find((a) => a.startsWith('--keys='))?.slice(7);
  const keys = keysArg
    ? keysArg.split(',').map((k) => k.trim()).filter(Boolean)
    : undefined;
  return { confirm, dryRun, limit, keys };
}

function main(): void {
  console.log('\n========== produce:ingredients:approve (CONTENT-3) ==========');
  const args = parseArgs(process.argv.slice(2));
  const keys =
    args.keys ?? listIngredientKeysAwaitingApproval(args.limit);

  console.log(`Awaiting approval selected: ${keys.length}`);
  console.log(keys.length ? `Keys: ${keys.join(', ')}` : 'None');

  if (keys.length === 0) {
    printProductionDashboard();
    return;
  }

  if (!args.confirm) {
    console.log(
      '\nDry preview only. Re-run with --confirm after human review to promote to production.',
    );
    console.log(
      'Example: npm run produce:ingredients:approve -- --confirm --limit=20',
    );
    printProductionDashboard();
    return;
  }

  if (args.dryRun) {
    console.log('Dry-run — no copies.');
    return;
  }

  let promoted = 0;
  for (const iconKey of keys) {
    try {
      const result = runIngredientApprove({
        decision: 'approve',
        iconKey,
        force: true,
      });
      if (result.promoted.includes(iconKey)) promoted += 1;
    } catch (err) {
      console.error(
        `  [fail] ${iconKey}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\nBatch approved: ${promoted}`);
  printProductionDashboard(getProductionProgress());
}

main();
