/**
 * Sprint IMG-4 — hero:approve
 *
 * Review → Production:
 *   npm run hero:approve -- --recipe=003 --force
 *   npm run hero:approve -- --from=001 --to=050 --approved-only
 *
 * Copies review → assets/meals/{heroImageKey}.jpg, verifies SHA-256,
 * refreshes meal registry / recipeImageMap when needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadImageQueue } from '../buildImageQueue';
import { PATHS } from '../config';
import { runHeroApprove, type ApprovalDecision } from '../runApprove';
import { validateHeroProduction } from '../validateProduction';
import {
  buildProductionDashboardMarkdown,
  writeScopedDashboard,
} from '../writeProductionDashboard';

function parseArgs(argv: string[]) {
  const decisionArg =
    argv.find((a) => a.startsWith('--decision='))?.split('=')[1] ??
    argv.find((a) => a.startsWith('--action='))?.split('=')[1];
  const recipeId =
    argv.find((a) => a.startsWith('--id='))?.split('=')[1] ??
    argv.find((a) => a.startsWith('--recipe='))?.split('=')[1];
  const heroImageKey = argv.find((a) => a.startsWith('--key='))?.split('=')[1];
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1];
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1];
  const force = argv.includes('--force');
  const allCompleted = argv.includes('--all-completed');
  const approvedOnly = argv.includes('--approved-only');

  const decision =
    (decisionArg as ApprovalDecision | undefined) ??
    (recipeId || heroImageKey || fromId || allCompleted || approvedOnly
      ? 'approve'
      : undefined);

  return {
    decision,
    recipeId,
    heroImageKey,
    fromId,
    toId,
    force,
    allCompleted,
    approvedOnly,
  };
}

function main(): void {
  console.log('\n========== hero:approve (IMG-4 Review → Production) ==========');
  const args = parseArgs(process.argv.slice(2));
  if (!args.decision || !['approve', 'reject', 'regenerate'].includes(args.decision)) {
    console.error(
      'Usage:\n' +
        '  npm run hero:approve -- --recipe=003 --force\n' +
        '  npm run hero:approve -- --from=001 --to=050 --approved-only\n' +
        '  npm run hero:approve -- --decision=reject --recipe=003\n' +
        '  npm run hero:rollback -- --recipe=003',
    );
    process.exitCode = 1;
    return;
  }

  if (
    !args.recipeId &&
    !args.heroImageKey &&
    !args.allCompleted &&
    !(args.fromId && args.toId)
  ) {
    console.error('Pass --recipe=003 or --from=001 --to=050 [--approved-only]');
    process.exitCode = 1;
    return;
  }

  try {
    const result = runHeroApprove({
      decision: args.decision,
      recipeId: args.recipeId,
      heroImageKey: args.heroImageKey,
      force: args.force,
      allCompleted: args.allCompleted,
      fromId: args.fromId,
      toId: args.toId,
      approvedOnly: args.approvedOnly,
    });

    console.log('\n--- Result ---');
    console.log(`Decision: ${args.decision}`);
    console.log(`Touched: ${result.touched.length}`);
    console.log(`Promoted: ${result.promoted.length}`);
    console.log(`Failed: ${result.failed.length}`);
    console.log(`Registry updated: ${result.registryUpdated}`);
    console.log(`recipeImageMap updates: ${result.mappingUpdatedCount}`);

    for (const p of result.promotions) {
      console.log(
        `  ✓ ${p.recipeId} ${p.filename} | hashMatch=${p.verify.hashMatch} | ${p.productionRelative}`,
      );
    }

    if (result.failed.length > 0) {
      console.log(`FAILED recipes: ${result.failed.join(', ')}`);
      process.exitCode = 1;
    } else if (args.decision === 'approve' && result.promotions.length > 0) {
      console.log('SUCCESS: Review → Production promote verified.');
    }

    if (!args.force && args.decision === 'approve') {
      console.log('Tip: use --force to overwrite an existing production JPG (backup created first).');
    }

    const queue = loadImageQueue();
    if (queue) {
      const validation = validateHeroProduction();
      fs.writeFileSync(
        PATHS.dashboard,
        buildProductionDashboardMarkdown({
          queue,
          validation,
          scope:
            args.fromId && args.toId
              ? { fromId: args.fromId, toId: args.toId, label: 'IMG-4' }
              : undefined,
        }),
        'utf8',
      );
      if (args.fromId && args.toId) {
        writeScopedDashboard(queue, validation, args.fromId, args.toId);
      }
      console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
  console.log('==============================================================\n');
}

main();
