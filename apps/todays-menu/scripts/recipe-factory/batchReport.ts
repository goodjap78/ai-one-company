/**
 * Sprint RF-1 — Batch report writers for Recipe Factory.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RecipeValidationRow, CompatibilityCheck, AssetScanResult } from './types';

export type { RecipeValidationRow, CompatibilityCheck, AssetScanResult };

export type BatchReportInput = {
  batchId: string;
  recipes: RecipeValidationRow[];
  assets: AssetScanResult;
  compatibility: CompatibilityCheck[];
  corrections: string[];
  generatedAt: string;
};

const REPORT_DIR = path.resolve(__dirname, '../../generated/recipe-reports');

export function ensureReportDir(): string {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  return REPORT_DIR;
}

export function writeBatch01Report(input: BatchReportInput): string {
  ensureReportDir();
  const outPath = path.join(REPORT_DIR, `batch-${input.batchId}-report.md`);

  const pass = input.recipes.filter((r) => r.verdict === 'PASS').length;
  const fail = input.recipes.filter((r) => r.verdict === 'FAIL').length;

  const lines: string[] = [
    `# Batch ${input.batchId} — Recipe Factory Report`,
    '',
    `Generated: ${input.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Recipes validated | ${input.recipes.length} |`,
    `| PASS | ${pass} |`,
    `| FAIL | ${fail} |`,
    `| Missing hero images | ${input.assets.missingHeroes.length} |`,
    `| Missing ingredient icons | ${input.assets.missingIngredients.length} |`,
    `| Missing step images | ${input.assets.missingSteps.length} |`,
    `| Filename mismatches | ${input.assets.filenameMismatches.length} |`,
    `| Broken registry keys | ${input.assets.brokenRegistryKeys.length} |`,
    '',
    '> Missing images do **not** fail recipe-data validation. They are listed separately for asset production.',
    '',
    '## Recipe validation',
    '',
  ];

  for (const row of input.recipes) {
    lines.push(`### ${row.id} ${row.name} — **${row.verdict}**`);
    if (row.failures.length === 0) {
      lines.push('- All required fields OK');
    } else {
      for (const f of row.failures) lines.push(`- FAIL: ${f}`);
    }
    lines.push('');
  }

  lines.push('## Compatibility (wiring, no UI redesign)');
  lines.push('');
  for (const check of input.compatibility) {
    lines.push(`- **${check.verdict}** — ${check.name}: ${check.detail}`);
  }
  lines.push('');

  lines.push('## Missing hero images');
  lines.push('');
  if (input.assets.missingHeroes.length === 0) {
    lines.push('_None_');
  } else {
    for (const h of input.assets.missingHeroes) lines.push(`- \`assets/meals/${h}.jpg\``);
  }
  lines.push('');

  lines.push('## Missing ingredient images');
  lines.push('');
  if (input.assets.missingIngredients.length === 0) {
    lines.push('_None_');
  } else {
    for (const k of input.assets.missingIngredients) {
      lines.push(`- \`assets/ingredients/${k}.png\``);
    }
  }
  lines.push('');

  lines.push('## Missing step images');
  lines.push('');
  if (input.assets.missingSteps.length === 0) {
    lines.push('_None_');
  } else {
    for (const k of input.assets.missingSteps) {
      lines.push(`- \`assets/recipe-steps/${k}.jpg\``);
    }
  }
  lines.push('');

  lines.push('## Fallback assets currently used');
  lines.push('');
  if (input.assets.fallbackAssetsUsed.length === 0) {
    lines.push(
      '_No ingredient/step PNGs registered. UI uses soft pastel / omit step media when unresolved (no broken Image)._',
    );
  } else {
    for (const f of input.assets.fallbackAssetsUsed) lines.push(`- ${f}`);
  }
  lines.push('');

  lines.push('## Filename mismatches');
  lines.push('');
  if (input.assets.filenameMismatches.length === 0) {
    lines.push('_None_');
  } else {
    for (const m of input.assets.filenameMismatches) lines.push(`- ${m}`);
  }
  lines.push('');

  lines.push('## Broken registry keys');
  lines.push('');
  if (input.assets.brokenRegistryKeys.length === 0) {
    lines.push(
      '_None — ingredient/step registries are empty (correct while files are missing)._',
    );
  } else {
    for (const b of input.assets.brokenRegistryKeys) lines.push(`- ${b}`);
  }
  lines.push('');

  lines.push('## Fields automatically corrected by master template');
  lines.push('');
  if (input.corrections.length === 0) {
    lines.push('_No corrections needed on load_');
  } else {
    for (const c of input.corrections) lines.push(`- ${c}`);
  }
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}

export function writeBatch02PlanMarkdown(
  entries: ReadonlyArray<{ id: string; name: string; heroImageKey: string }>,
): string {
  ensureReportDir();
  const outPath = path.join(REPORT_DIR, 'batch-02-plan.md');
  const lines = [
    '# Batch 02 — Production Plan (NOT inserted)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Do **not** append these to `HANKKI_RECIPES` until Batch 01 assets + RF-1 sign-off.',
    '',
    '| ID | Name | Proposed heroImageKey | Status |',
    '| --- | --- | --- | --- |',
    ...entries.map(
      (e) =>
        `| ${e.id} | ${e.name} | \`${e.heroImageKey}\` | planned |`,
    ),
    '',
    '## Next actions',
    '',
    '1. Author drafts via `createHankkiRecipe()`',
    '2. Reserve meal JPG filenames under `assets/meals/`',
    '3. `npm run recipes:validate -- --batch=02` after insert',
    '4. Run `recipe-assets:dry` for new keys',
    '',
  ];
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}
