/**
 * Dashboard — write production-dashboard.md + production-report.md + state JSON.
 */
import fs from 'node:fs';
import { PIPELINE_PATHS } from '../config';
import type { PipelineState, PipelineStats, PipelineValidation } from '../types';

function ensureOutDir(): void {
  fs.mkdirSync(PIPELINE_PATHS.outRoot, { recursive: true });
}

export function writePipelineState(state: PipelineState): string {
  ensureOutDir();
  fs.writeFileSync(PIPELINE_PATHS.state, JSON.stringify(state, null, 2), 'utf8');
  return PIPELINE_PATHS.state;
}

export function writeProductionDashboard(
  stats: PipelineStats,
  validation: PipelineValidation,
): string {
  ensureOutDir();
  const lines = [
    '# HANKKI Production Dashboard',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Sprint: **AUTO-1** — Production Pipeline (prepare only, no AI image generation)',
    '',
    '## Progress',
    '',
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Recipes | ${stats.recipes} |`,
    `| Hero images present | ${stats.heroPresent} |`,
    `| Hero images missing | ${stats.heroMissing} |`,
    `| Ingredient icons present | ${stats.ingredientPresent} |`,
    `| Ingredient icons missing | ${stats.ingredientMissing} |`,
    `| Step images present | ${stats.stepPresent} |`,
    `| Step images missing | ${stats.stepMissing} |`,
    `| Ready recipes (all assets) | ${stats.readyRecipes} |`,
    `| Overall progress | ${stats.progressPercent}% |`,
    '',
    '## Status',
    '',
    `| Check | Result |`,
    `| --- | --- |`,
    `| Structural validation | ${validation.ok ? 'PASS' : 'FAIL'} |`,
    `| Recipe schema issues | ${validation.recipeIssues} |`,
    `| Duplicate IDs | ${validation.duplicateIds.length} |`,
    `| Duplicate names | ${validation.duplicateNames.length} |`,
    `| Duplicate hero keys | ${validation.duplicateHeroKeys.length} |`,
    `| Broken registry keys | ${validation.brokenRegistryKeys.length} |`,
    `| Broken / soft references | ${validation.brokenReferences.length} |`,
    '',
    '## Ready vs Missing',
    '',
    `- **Ready recipes:** ${stats.readyRecipes} / ${stats.recipes}`,
    `- **Missing heroes:** ${stats.heroMissing}`,
    `- **Missing ingredient icons:** ${stats.ingredientMissing}`,
    `- **Missing step images:** ${stats.stepMissing}`,
    '',
    '## Commands',
    '',
    '```bash',
    'npm run pipeline:recipe',
    'npm run pipeline:hero',
    'npm run pipeline:ingredients',
    'npm run pipeline:steps',
    'npm run pipeline:validate',
    '```',
    '',
    '## Notes',
    '',
    '- This dashboard does **not** generate real AI images.',
    '- Use Image Factory (`hero:generate`) only after queue + provider setup.',
    '- Missing asset counts are expected until asset production completes.',
    '',
  ];

  fs.writeFileSync(PIPELINE_PATHS.dashboard, lines.join('\n'), 'utf8');
  fs.writeFileSync(PIPELINE_PATHS.dashboardTracked, lines.join('\n'), 'utf8');
  return PIPELINE_PATHS.dashboard;
}

export function writeProductionReport(
  stats: PipelineStats,
  validation: PipelineValidation,
  modulesRun: PipelineState['lastModules'],
): string {
  ensureOutDir();

  const lines = [
    '# HANKKI Production Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Sprint AUTO-1',
    '',
    'Production automation engine prepared. No real AI images were generated.',
    '',
    '## Modules last run',
    '',
    Object.entries(modulesRun)
      .map(([k, v]) => `- **${k}:** ${v ?? '—'}`)
      .join('\n') || '- (none)',
    '',
    '## Architecture',
    '',
    '```',
    'Recipe Name',
    '  → Recipe Generator (catalog validate)',
    '  → Hero Prompt Generator',
    '  → Hero Queue Generator',
    '  → Ingredient Queue Generator',
    '  → Step Queue Generator',
    '  → Registry Updater (disk → static require)',
    '  → Validation Engine',
    '  → Ready',
    '```',
    '',
    '## Stats',
    '',
    '```json',
    JSON.stringify(stats, null, 2),
    '```',
    '',
    '## Validation',
    '',
    `- **ok:** ${validation.ok}`,
    `- **recipeIssues:** ${validation.recipeIssues}`,
    '',
    '### Duplicate IDs',
    '',
    ...bullets(validation.duplicateIds),
    '',
    '### Duplicate names',
    '',
    ...bullets(validation.duplicateNames),
    '',
    '### Duplicate hero keys',
    '',
    ...bullets(validation.duplicateHeroKeys),
    '',
    '### Missing hero images (sample)',
    '',
    ...bullets(validation.missingHeroImages),
    '',
    '### Missing ingredient icons (sample)',
    '',
    ...bullets(validation.missingIngredientIcons),
    '',
    '### Missing step images (sample)',
    '',
    ...bullets(validation.missingStepImages),
    '',
    '### Broken registry keys',
    '',
    ...bullets(validation.brokenRegistryKeys),
    '',
    '### Broken / soft references (sample)',
    '',
    ...bullets(validation.brokenReferences, 30),
    '',
    '### Issue list (sample)',
    '',
    ...bullets(validation.issues, 30),
    '',
    '## Production readiness',
    '',
    validation.ok
      ? '- **Structural pipeline:** READY (catalog + registries consistent).'
      : '- **Structural pipeline:** NOT READY — fix duplicate / registry / schema issues.',
    `- **Asset completeness:** ${stats.progressPercent}% (${stats.readyRecipes}/${stats.recipes} fully ready).`,
    '- **AI image generation:** NOT part of AUTO-1 — use Image Factory providers separately.',
    '',
  ];

  fs.writeFileSync(PIPELINE_PATHS.report, lines.join('\n'), 'utf8');
  fs.writeFileSync(PIPELINE_PATHS.reportTracked, lines.join('\n'), 'utf8');
  return PIPELINE_PATHS.report;
}

function bullets(arr: string[], n = 40): string[] {
  const items = arr.length <= n ? arr : [...arr.slice(0, n), `…and ${arr.length - n} more`];
  return items.length ? items.map((x) => `- ${x}`) : ['- (none)'];
}

export function loadPipelineState(): PipelineState | null {
  if (!fs.existsSync(PIPELINE_PATHS.state)) return null;
  try {
    return JSON.parse(fs.readFileSync(PIPELINE_PATHS.state, 'utf8')) as PipelineState;
  } catch {
    return null;
  }
}

export function mergeAndPersistState(
  patch: Partial<PipelineState['lastModules']>,
  stats: PipelineStats,
  validation: PipelineValidation,
): PipelineState {
  const prev = loadPipelineState();
  const state: PipelineState = {
    generatedAt: new Date().toISOString(),
    sprint: 'AUTO-1',
    stats,
    validation,
    lastModules: { ...(prev?.lastModules ?? {}), ...patch },
  };
  writePipelineState(state);
  writeProductionDashboard(stats, validation);
  writeProductionReport(stats, validation, state.lastModules);
  return state;
}
