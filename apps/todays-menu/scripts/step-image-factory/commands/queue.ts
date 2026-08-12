/**
 * npm run step:queue -- --from=001 --to=050 --missing-only
 */
import path from 'node:path';
import { writeAllStepPrompts } from '../buildPrompts';
import { buildStepQueue, writeStepQueue } from '../buildQueue';
import { collectStepManifest, writeStepManifest } from '../collectSteps';
import { PATHS } from '../config';
import { writeStepDashboard } from '../writeDashboard';
import { writeStepReviewHtml } from '../writeReviewHtml';

function parseArgs(argv: string[]) {
  const fromId = argv.find((a) => a.startsWith('--from='))?.split('=')[1] ?? '001';
  const toId = argv.find((a) => a.startsWith('--to='))?.split('=')[1] ?? '050';
  const missingOnly = argv.includes('--missing-only');
  return { fromId, toId, missingOnly };
}

function main(): void {
  console.log('\n========== step:queue (STEP-1) ==========');
  const { fromId, toId, missingOnly } = parseArgs(process.argv.slice(2));
  console.log(`Range: ${fromId}–${toId}`);
  console.log(`missing-only: ${missingOnly}`);

  const manifest = collectStepManifest(fromId, toId);
  writeStepManifest(manifest);
  writeAllStepPrompts(manifest.items);

  const queue = buildStepQueue(
    manifest,
    process.env.IMAGE_PROVIDER ?? 'disabled',
    { missingOnly },
  );
  writeStepQueue(queue);
  writeStepReviewHtml(queue);
  writeStepDashboard({ manifest, queue });

  const approved = queue.totals.approved;
  const existing = queue.totals.existing_unregistered;
  const queued = queue.items.filter(
    (i) => i.status === 'queued' || i.status === 'missing',
  ).length;
  const actionable = queue.items.filter(
    (i) =>
      i.status === 'queued' ||
      i.status === 'missing' ||
      i.status === 'failed' ||
      i.status === 'processing',
  ).length;

  console.log(`\n--- Queue report ---`);
  console.log(`Total cooking steps: ${manifest.totalSteps}`);
  console.log(`Approved: ${approved}`);
  console.log(`Existing unregistered: ${existing}`);
  console.log(`Queued (missing): ${queued}`);
  console.log(`Actionable for generate: ${actionable}`);
  console.log(`\nManifest → ${path.relative(PATHS.appRoot, PATHS.manifest)}`);
  console.log(`Queue → ${path.relative(PATHS.appRoot, PATHS.imageQueue)}`);
  console.log(`Prompts → ${path.relative(PATHS.appRoot, PATHS.promptsDir)}`);
  console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  console.log('=========================================\n');
}

main();
