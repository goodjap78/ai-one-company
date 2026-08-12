/**
 * STEP 8 — IMG-2 / IMG-3 production dashboard.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { ImageQueueFile, ImageQueueItem } from './queueTypes';
import type { ProductionDashboardStats } from './queueTypes';
import { expandRecipeIdRange } from './recipeIdRange';
import type { ProductionValidation } from './validateProduction';

export function computeDashboardStats(
  items: ImageQueueItem[],
): ProductionDashboardStats {
  const totals = {
    recipes: items.length,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    approved: 0,
    rejected: 0,
  };
  for (const item of items) totals[item.status] += 1;

  const imagesGenerated = totals.completed + totals.approved + totals.rejected;
  const waitingApproval = totals.completed;
  const missing = totals.queued + totals.failed + totals.processing;
  const existing = totals.approved;
  const progressPercent =
    totals.recipes === 0
      ? 0
      : Math.round((totals.approved / totals.recipes) * 1000) / 10;

  return {
    recipes: totals.recipes,
    imagesGenerated,
    waitingApproval,
    approved: existing,
    rejected: totals.rejected,
    missing,
    failed: totals.failed,
    progressPercent,
  };
}

function bar(percent: number): string {
  const width = 40;
  const filled = Math.round((percent / 100) * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${percent}%`;
}

function statusBreakdown(items: ImageQueueItem[]) {
  const counts = {
    existing: 0,
    queued: 0,
    processing: 0,
    awaitingReview: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
    missing: 0,
  };
  for (const item of items) {
    if (item.status === 'approved') {
      counts.approved += 1;
      counts.existing += 1;
    } else if (item.status === 'queued') {
      counts.queued += 1;
      counts.missing += 1;
    } else if (item.status === 'processing') {
      counts.processing += 1;
      counts.missing += 1;
    } else if (item.status === 'completed') {
      counts.awaitingReview += 1;
    } else if (item.status === 'rejected') {
      counts.rejected += 1;
    } else if (item.status === 'failed') {
      counts.failed += 1;
      counts.missing += 1;
    }
  }
  return counts;
}

export function buildProductionDashboardMarkdown(input: {
  queue: ImageQueueFile;
  validation: ProductionValidation;
  scope?: { fromId: string; toId: string; label?: string };
}): string {
  const scopeIds = input.scope
    ? new Set(expandRecipeIdRange(input.scope.fromId, input.scope.toId))
    : null;
  const items = scopeIds
    ? input.queue.items.filter((i) => scopeIds.has(i.recipeId))
    : input.queue.items;

  const stats = computeDashboardStats(items);
  const counts = statusBreakdown(items);
  const { validation } = input;
  const titleScope = input.scope
    ? `${input.scope.label ?? 'scoped'} ${input.scope.fromId}–${input.scope.toId}`
    : 'full catalog';

  const lines: string[] = [
    '# HANKKI Hero Image Production — Dashboard',
    '',
    `> Sprint IMG-3 · ${titleScope} · queue ${input.queue.generatedAt} · provider hint: \`${input.queue.providerHint}\``,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Total recipes | ${stats.recipes} |`,
    `| Existing (approved) | ${counts.existing} |`,
    `| Queued | ${counts.queued} |`,
    `| Processing | ${counts.processing} |`,
    `| Awaiting review | ${counts.awaitingReview} |`,
    `| Approved | ${counts.approved} |`,
    `| Rejected | ${counts.rejected} |`,
    `| Failed | ${counts.failed} |`,
    `| Missing | ${counts.missing} |`,
    `| Completion % | **${stats.progressPercent}%** |`,
    `| Validation | ${validation.ok ? 'PASS' : 'FAIL'} |`,
    '',
    '## Progress',
    '',
    '```',
    bar(stats.progressPercent),
    '```',
    '',
    '## Status legend',
    '',
    '`queued` → `processing` → `completed` (review) → `approved` | `rejected` · or `failed`',
    '',
    'Production rule: **only `approved` images** live in `assets/meals/` + registry.',
    'Rejected / unreviewed images stay under `generated/image-factory/review/` only.',
    '',
    '## Validation',
    '',
    `| Check | Count |`,
    `| --- | ---: |`,
    `| Broken files | ${validation.brokenFiles.length} |`,
    `| Duplicate filenames | ${validation.duplicateFilenames.length} |`,
    `| Duplicate heroImageKeys | ${validation.duplicateHeroImageKeys.length} |`,
    `| Missing registry entries | ${validation.missingRegistryEntries.length} |`,
    `| Format mismatch (warn) | ${validation.formatMismatches.length} |`,
    `| Invalid image size (warn) | ${validation.invalidImageSizes.length} |`,
    `| Unsupported extension | ${validation.unsupportedExtensions.length} |`,
    '',
  ];

  if (validation.formatMismatches.length) {
    lines.push(
      '### Format mismatches (legacy)',
      '',
      'Batch 01 heroes use `.jpg` names but PNG bytes. Re-encode to real JPEG in a later optimize pass.',
      '',
    );
    for (const m of validation.formatMismatches.slice(0, 20)) {
      lines.push(`- ${m}`);
    }
    lines.push('');
  }

  if (validation.issues.length) {
    lines.push('### Issues', '');
    for (const issue of validation.issues) lines.push(`- ${issue}`);
    lines.push('');
  }

  lines.push(
    '## Queue (scoped)',
    '',
    `| ID | Name | Key | Status |`,
    `| --- | --- | --- | --- |`,
  );
  for (const item of items) {
    lines.push(
      `| ${item.recipeId} | ${item.recipeName} | \`${item.heroImageKey}\` | ${item.status} |`,
    );
  }

  lines.push(
    '',
    '## Commands',
    '',
    '```bash',
    'npm run hero:generate -- --from=001 --to=050 --resume',
    'npm run hero:approve -- --recipe=011',
    'npm run hero:approve -- --from=001 --to=050 --approved-only',
    'npm run hero:validate -- --from=001 --to=050',
    '```',
    '',
    'Set `IMAGE_PROVIDER=openai` + `IMAGE_API_KEY` in `.env` for real generation.',
    '',
  );

  return lines.join('\n');
}

export function writeScopedDashboard(
  queue: ImageQueueFile,
  validation: ProductionValidation,
  fromId: string,
  toId: string,
): string {
  const md = buildProductionDashboardMarkdown({
    queue,
    validation,
    scope: { fromId, toId, label: 'IMG-3' },
  });
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.dashboard, md, 'utf8');
  return path.relative(PATHS.appRoot, PATHS.dashboard);
}
