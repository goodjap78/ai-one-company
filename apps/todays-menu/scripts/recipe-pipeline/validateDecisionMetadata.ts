/**
 * Sprint R8 — Decision metadata validation report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { PIPELINE_RECIPES } from '../../data/recipes/pipeline/pipelineRecipes';
import { validateHankkiRecipe } from '../../data/recipes/validateHankkiProduction';
import { PATHS } from '../recipe-assets/config';

type Row = {
  id: string;
  name: string;
  ok: boolean;
  missing: string[];
  priority: number;
  reasons: number;
  searchTags: number;
};

function audit(recipes: typeof PIPELINE_RECIPES): {
  rows: Row[];
  updated: number;
  missingFieldRecipes: number;
} {
  const rows: Row[] = [];
  let updated = 0;
  let missingFieldRecipes = 0;

  for (const recipe of recipes) {
    const issues = validateHankkiRecipe(recipe);
    const decisionIssues = issues.filter(
      (i) =>
        i.code.startsWith('decisionTags') ||
        i.code === 'recommendationReasons' ||
        i.code === 'searchTags' ||
        i.code === 'recommendationPriority',
    );
    const hasDecision =
      Boolean(recipe.decisionTags) &&
      recipe.recommendationReasons?.length === 3 &&
      (recipe.searchTags?.length ?? 0) > 0 &&
      typeof recipe.recommendationPriority === 'number';

    if (hasDecision) updated += 1;
    if (decisionIssues.length > 0) missingFieldRecipes += 1;

    rows.push({
      id: recipe.id,
      name: recipe.name,
      ok: decisionIssues.length === 0,
      missing: decisionIssues.map((i) => i.message),
      priority: recipe.recommendationPriority ?? 0,
      reasons: recipe.recommendationReasons?.length ?? 0,
      searchTags: recipe.searchTags?.length ?? 0,
    });
  }

  return { rows, updated, missingFieldRecipes };
}

function main(): void {
  const live = audit(HANKKI_RECIPES);
  const pipeline = audit(PIPELINE_RECIPES);
  const allIssues = PIPELINE_RECIPES.flatMap((r) => validateHankkiRecipe(r));
  const tscNote = 'Run `npx tsc --noEmit` separately (see CI / local).';

  const outDir = path.join(PATHS.appRoot, 'generated/recipe-reports');
  fs.mkdirSync(outDir, { recursive: true });

  const sample = HANKKI_RECIPES[0];
  const lines = [
    '# Sprint R8 — Decision Recipe Database Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '> Recipe DB structure only. Home / Detail / Recommendation Engine unchanged.',
    '',
    '## Summary',
    '',
    '| Scope | Updated (decision fields present) | Missing decision fields | Total |',
    '| --- | ---: | ---: | ---: |',
    `| Live Home (HANKKI_RECIPES) | ${live.updated} | ${live.missingFieldRecipes} | ${HANKKI_RECIPES.length} |`,
    `| Full pipeline | ${pipeline.updated} | ${pipeline.missingFieldRecipes} | ${PIPELINE_RECIPES.length} |`,
    '',
    '## Validation result',
    '',
    `| Check | Result |`,
    `| --- | --- |`,
    `| Decision Tags on every recipe | ${pipeline.missingFieldRecipes === 0 ? 'PASS' : 'FAIL'} |`,
    `| Recommendation Reasons (3) | ${pipeline.rows.every((r) => r.reasons === 3) ? 'PASS' : 'FAIL'} |`,
    `| Search Tags | ${pipeline.rows.every((r) => r.searchTags > 0) ? 'PASS' : 'FAIL'} |`,
    `| Priority Score 1–100 | ${pipeline.rows.every((r) => r.priority >= 1 && r.priority <= 100) ? 'PASS' : 'FAIL'} |`,
    `| Production field validator issues | ${allIssues.length === 0 ? 'PASS (0)' : `FAIL (${allIssues.length})`} |`,
    `| TypeScript | ${tscNote} |`,
    '',
    '## Sample — 001 제육볶음',
    '',
  ];

  if (sample) {
    lines.push(
      '### decisionTags',
      '',
      '```json',
      JSON.stringify(sample.decisionTags, null, 2),
      '```',
      '',
      '### recommendationReasons',
      '',
      ...sample.recommendationReasons.map((r) => `- ${r}`),
      '',
      '### searchTags',
      '',
      sample.searchTags.map((t) => `\`${t}\``).join(', '),
      '',
      `### recommendationPriority: **${sample.recommendationPriority}**`,
      '',
    );
  }

  const failed = pipeline.rows.filter((r) => !r.ok);
  lines.push('## Missing fields', '');
  if (failed.length === 0) {
    lines.push('_None — all pipeline recipes have Decision Tags, Reasons, Search Tags, Priority._', '');
  } else {
    for (const row of failed.slice(0, 30)) {
      lines.push(`- \`${row.id}\` ${row.name}: ${row.missing.join('; ')}`);
    }
  }

  lines.push(
    '## Compatibility',
    '',
    '- Legacy `situation: string[]` kept for Home confidence copy',
    '- `decisionTags.situation` is the structured decision enum (alone/family/…)',
    '- Home / Recipe Detail / Favorites / Recommendation Engine not modified',
    '',
  );

  const reportPath = path.join(outDir, 'r8-decision-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log('\n========== R8 Decision DB ==========');
  console.log(`live updated: ${live.updated}/${HANKKI_RECIPES.length}`);
  console.log(`pipeline updated: ${pipeline.updated}/${PIPELINE_RECIPES.length}`);
  console.log(`missing decision fields: ${pipeline.missingFieldRecipes}`);
  console.log(`validator issues: ${allIssues.length}`);
  console.log(`report: ${path.relative(PATHS.appRoot, reportPath)}`);
  console.log('====================================\n');

  process.exitCode = pipeline.missingFieldRecipes === 0 && allIssues.length === 0 ? 0 : 1;
}

main();
