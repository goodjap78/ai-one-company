/**
 * CONTENT-3 — batch approve Hero Images awaiting review.
 * Requires explicit --confirm. Never auto-approves.
 *
 *   npm run produce:heroes:approve -- --confirm
 *   npm run produce:heroes:approve -- --confirm --limit=20
 *   npm run produce:heroes:approve -- --confirm --from=031 --to=050
 */
import { runHeroApprove } from '../../image-factory/runApprove';
import {
  getProductionProgress,
  listHeroIdsAwaitingApproval,
  printProductionDashboard,
} from '../productionProgress';
import { upsertRecipeState } from '../../image-factory/review-dashboard/dashboardState';

function parseArgs(argv: string[]) {
  const confirm = argv.includes('--confirm');
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry');
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 20;
  return { confirm, dryRun, fromId, toId, limit };
}

function main(): void {
  console.log('\n========== produce:heroes:approve (CONTENT-3) ==========');
  const args = parseArgs(process.argv.slice(2));

  let ids =
    args.fromId && args.toId
      ? listHeroIdsAwaitingApproval().filter((id) => {
          const n = Number(id);
          return n >= Number(args.fromId) && n <= Number(args.toId);
        })
      : listHeroIdsAwaitingApproval(args.limit);

  if (args.fromId && args.toId && Number.isFinite(args.limit)) {
    ids = ids.slice(0, args.limit);
  }

  console.log(`Awaiting approval selected: ${ids.length}`);
  console.log(ids.length ? `IDs: ${ids.join(', ')}` : 'None');

  if (ids.length === 0) {
    printProductionDashboard();
    return;
  }

  if (!args.confirm) {
    console.log(
      '\nDry preview only. Re-run with --confirm after human review to promote to production.',
    );
    console.log('Example: npm run produce:heroes:approve -- --confirm --limit=20');
    printProductionDashboard();
    return;
  }

  if (args.dryRun) {
    console.log('Dry-run — no copies.');
    return;
  }

  let promoted = 0;
  for (const recipeId of ids) {
    try {
      const result = runHeroApprove({
        decision: 'approve',
        recipeId,
        force: true,
      });
      if (result.promoted.length > 0) {
        promoted += 1;
        upsertRecipeState(recipeId, { reviewStatus: 'approved' });
      }
    } catch (err) {
      console.error(
        `  [fail] ${recipeId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\nBatch approved: ${promoted}`);
  printProductionDashboard(getProductionProgress());
}

main();
