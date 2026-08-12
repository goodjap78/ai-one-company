/**
 * Dashboard for step image factory.
 */
import fs from 'node:fs';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { expandRecipeIdRange } from '../image-factory/recipeIdRange';
import { PATHS } from './config';
import type { StepManifest, StepQueueFile } from './types';

export function writeStepDashboard(input: {
  manifest: StepManifest;
  queue: StepQueueFile;
  validationOk?: boolean;
  unresolved?: string[];
}): string {
  const { manifest, queue } = input;
  const ids = expandRecipeIdRange(manifest.fromId, manifest.toId);
  const idSet = new Set(ids);
  const recipes = HANKKI_RECIPES.filter((r) => idSet.has(r.id));
  const approvedKeys = new Set(
    queue.items.filter((i) => i.status === 'approved').map((i) => i.imageKey),
  );

  let covered = 0;
  for (const recipe of recipes) {
    const steps = recipe.recipe?.steps ?? [];
    if (steps.length === 0) continue;
    const ok = steps.every((s) => approvedKeys.has(s.imageKey));
    if (ok) covered += 1;
  }
  const recipeCoverage =
    recipes.length === 0
      ? 0
      : Math.round((covered / recipes.length) * 1000) / 10;

  const t = queue.totals;
  const overall =
    t.total === 0 ? 0 : Math.round((t.approved / t.total) * 1000) / 10;
  const missing = t.queued + t.missing + t.processing;

  const lines = [
    '# HANKKI Cooking Step Image Factory — Dashboard',
    '',
    `> Sprint STEP-1 · recipes ${manifest.fromId}–${manifest.toId} · ${queue.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Total cooking steps | ${manifest.totalSteps} |`,
    `| Approved | ${t.approved} |`,
    `| Awaiting review | ${t.completed} |`,
    `| Rejected | ${t.rejected} |`,
    `| Failed | ${t.failed} |`,
    `| Missing / queued | ${missing} |`,
    `| Recipe coverage | **${recipeCoverage}%** (${covered}/${recipes.length}) |`,
    `| Overall completion | **${overall}%** |`,
    `| Validation | ${input.validationOk == null ? '—' : input.validationOk ? 'PASS' : 'FAIL'} |`,
    '',
    '## Commands',
    '',
    '```bash',
    'npm run step:queue -- --from=001 --to=050 --missing-only',
    'npm run step:generate -- --keys=kimchi_stew_step_01,kimchi_stew_step_02,kimchi_stew_step_03,kimchi_stew_step_04,jaeyuk_step_01',
    'npm run step:generate -- --from=001 --to=050 --missing-only --resume',
    'npm run step:approve -- --key=kimchi_stew_step_01',
    'npm run step:approve -- --approved-only',
    'npm run step:validate -- --from=001 --to=050',
    '```',
    '',
    '## Queue',
    '',
    `| Key | Recipe | Step | Status |`,
    `| --- | --- | ---: | --- |`,
  ];

  for (const item of queue.items) {
    lines.push(
      `| \`${item.imageKey}\` | ${item.recipeName} | ${item.stepOrder} | ${item.status} |`,
    );
  }

  if (input.unresolved?.length) {
    lines.push('', '## Unresolved', '');
    for (const u of input.unresolved) lines.push(`- ${u}`);
  }

  lines.push('');
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.dashboard, lines.join('\n'), 'utf8');
  return PATHS.dashboard;
}
