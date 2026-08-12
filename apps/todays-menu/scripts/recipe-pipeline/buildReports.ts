/**
 * Sprint R7 — Production report + asset progress dashboard.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../recipe-assets/config';
import {
  getBatchRecipes,
  PIPELINE_BATCH_META,
  PIPELINE_RECIPES,
  PIPELINE_TARGET_COUNT,
} from '../../data/recipes/pipeline/pipelineRecipes';
import type { PipelineValidationResult } from './validatePipeline';
import { buildImageManifests } from './buildImageManifests';

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 1000) / 10;
}

function bar(done: number, total: number): string {
  const p = total <= 0 ? 0 : done / total;
  const filled = Math.round(p * 20);
  return `\`${'█'.repeat(filled)}${'░'.repeat(20 - filled)}\` ${pct(done, total)}%`;
}

export function writeProductionReport(
  validation: PipelineValidationResult,
  outDir = path.join(PATHS.appRoot, 'generated/recipe-pipeline'),
): string {
  fs.mkdirSync(outDir, { recursive: true });
  const manifests = buildImageManifests();
  const heroHave = manifests.heroes.filter((h) => h.exists).length;
  const ingHave = manifests.ingredients.filter((i) => i.exists).length;
  const stepHave = manifests.steps.filter((s) => s.exists).length;

  const lines: string[] = [
    '# HANKKI Recipe Production Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '> Sprint R7 pipeline. Live Home catalog remains Batch 01–02 only.',
    '',
    '## Recipe count',
    '',
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Target | ${PIPELINE_TARGET_COUNT} |`,
    `| Pipeline total | ${validation.totalRecipes} |`,
    `| Live in production (Home) | ${validation.liveCount} |`,
    `| Draft (Batches 03–10) | ${validation.draftCount} |`,
    `| Field-complete (ready) | ${validation.readyCount} |`,
    `| Missing required fields | ${validation.missingFieldCount} |`,
    '',
    '## Batches 01–10',
    '',
    '| Batch | Focus | IDs | Live? | Recipes |',
    '| --- | --- | --- | --- | ---: |',
  ];

  for (const meta of PIPELINE_BATCH_META) {
    const recipes = getBatchRecipes(meta.batchId);
    lines.push(
      `| ${meta.batchId} | ${meta.cuisineFocus} — ${meta.label} | ${String(meta.idStart).padStart(3, '0')}–${String(meta.idEnd).padStart(3, '0')} | ${meta.liveInProduction ? 'YES' : 'draft'} | ${recipes.length} |`,
    );
  }

  lines.push(
    '',
    '## Assets needed',
    '',
    `| Asset type | Unique keys | On disk | Missing |`,
    `| --- | ---: | ---: | ---: |`,
    `| Hero images | ${manifests.heroes.length} | ${heroHave} | ${manifests.heroes.length - heroHave} |`,
    `| Ingredient icons | ${manifests.ingredients.length} | ${ingHave} | ${manifests.ingredients.length - ingHave} |`,
    `| Cooking step images | ${manifests.steps.length} | ${stepHave} | ${manifests.steps.length - stepHave} |`,
    '',
    '## Duplicate checks',
    '',
    `| Check | Result |`,
    `| --- | --- |`,
    `| Duplicate IDs | ${validation.duplicateIds.length ? validation.duplicateIds.join(', ') : 'none'} |`,
    `| Duplicate names | ${validation.duplicateNames.length ? validation.duplicateNames.join(', ') : 'none'} |`,
    `| Duplicate hero keys | ${validation.duplicateHeroKeys.length ? validation.duplicateHeroKeys.join(', ') : 'none'} |`,
    '',
    '## Validation',
    '',
    `- Pipeline data OK: **${validation.ok ? 'YES' : 'NO'}**`,
    `- Issues: ${validation.issues.length}`,
    '',
  );

  if (validation.issues.length) {
    lines.push('### Issues', '');
    for (const issue of validation.issues.slice(0, 40)) {
      lines.push(
        `- **${issue.severity}** \`${issue.code}\`${issue.recipeId ? ` (${issue.recipeId})` : ''}: ${issue.message}`,
      );
    }
    if (validation.issues.length > 40) {
      lines.push(`- … +${validation.issues.length - 40} more`);
    }
    lines.push('');
  }

  lines.push(
    '## Overall production status',
    '',
    `| Status | Value |`,
    `| --- | --- |`,
    `| Recipes ready (fields) | ${validation.readyCount} / ${validation.totalRecipes} |`,
    `| Recipes missing fields | ${validation.missingFieldCount} |`,
    `| Live vs draft | ${validation.liveCount} live / ${validation.draftCount} draft |`,
    `| Assets needed (heroes+icons+steps missing) | ${validation.missingHeroes.length + validation.missingIngredients.length + validation.missingSteps.length} unique files |`,
    `| Home wiring | Batch 01–02 only (unchanged) |`,
    '',
    '## Sample draft recipes (021–030)',
    '',
  );

  for (const recipe of PIPELINE_RECIPES.filter((r) => Number(r.id) >= 21 && Number(r.id) <= 30)) {
    lines.push(
      `- \`${recipe.id}\` ${recipe.name} — hero \`${recipe.heroImageKey}\`, ${recipe.ingredients.length} ingredients, ${recipe.recipe.steps.length} steps`,
    );
  }

  lines.push('');

  const reportPath = path.join(outDir, 'production-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return path.relative(PATHS.appRoot, reportPath);
}

export function writeAssetDashboard(
  validation: PipelineValidationResult,
  outDir = path.join(PATHS.appRoot, 'generated/recipe-pipeline'),
): string {
  fs.mkdirSync(outDir, { recursive: true });
  const manifests = buildImageManifests();
  const heroHave = manifests.heroes.filter((h) => h.exists).length;
  const ingHave = manifests.ingredients.filter((i) => i.exists).length;
  const stepHave = manifests.steps.filter((s) => s.exists).length;
  const recipeHave = validation.liveCount; // completed = live in Home
  const recipeTotal = PIPELINE_TARGET_COUNT;

  const assetDone = heroHave + ingHave + stepHave;
  const assetTotal =
    manifests.heroes.length + manifests.ingredients.length + manifests.steps.length;
  const overallDone = recipeHave + assetDone;
  const overallTotal = recipeTotal + assetTotal;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI Asset Progress Dashboard</title>
  <style>
    :root { --bg:#1a1612; --card:#2a241c; --text:#f5efe6; --muted:#b9a99a; --accent:#e8a87c; --ok:#7dcea0; }
    body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; background:var(--bg); color:var(--text); padding:32px; }
    h1 { font-size:1.6rem; margin:0 0 8px; }
    p { color:var(--muted); margin:0 0 24px; }
    .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
    .card { background:var(--card); border-radius:16px; padding:20px; }
    .label { color:var(--muted); font-size:.85rem; }
    .value { font-size:2rem; font-weight:700; margin:8px 0; }
    .bar { height:10px; background:#3d3429; border-radius:999px; overflow:hidden; margin-top:12px; }
    .fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--ok)); }
    .overall { margin-top:24px; }
  </style>
</head>
<body>
  <h1>HANKKI Asset Progress Dashboard</h1>
  <p>Sprint R7 · Generated ${new Date().toISOString()} · Live Home = ${validation.liveCount} recipes</p>
  <div class="grid">
    <div class="card"><div class="label">Recipes Completed (live)</div><div class="value">${recipeHave}/${recipeTotal}</div><div class="bar"><div class="fill" style="width:${pct(recipeHave, recipeTotal)}%"></div></div></div>
    <div class="card"><div class="label">Hero Images</div><div class="value">${heroHave}/${manifests.heroes.length}</div><div class="bar"><div class="fill" style="width:${pct(heroHave, manifests.heroes.length)}%"></div></div></div>
    <div class="card"><div class="label">Ingredient Icons</div><div class="value">${ingHave}/${manifests.ingredients.length}</div><div class="bar"><div class="fill" style="width:${pct(ingHave, manifests.ingredients.length)}%"></div></div></div>
    <div class="card"><div class="label">Cooking Step Images</div><div class="value">${stepHave}/${manifests.steps.length}</div><div class="bar"><div class="fill" style="width:${pct(stepHave, manifests.steps.length)}%"></div></div></div>
  </div>
  <div class="card overall">
    <div class="label">Overall production %</div>
    <div class="value">${pct(overallDone, overallTotal)}%</div>
    <div class="bar"><div class="fill" style="width:${pct(overallDone, overallTotal)}%"></div></div>
    <p style="margin-top:16px">Field-complete recipes (pipeline): ${validation.readyCount}/${validation.totalRecipes}. Draft recipes are prepared but not live in Home.</p>
  </div>
</body>
</html>`;

  const md = [
    '# HANKKI Asset Progress Dashboard',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Track | Progress | Bar |',
    '| --- | ---: | --- |',
    `| Recipes completed (live in Home) | ${recipeHave}/${recipeTotal} | ${bar(recipeHave, recipeTotal)} |`,
    `| Hero images | ${heroHave}/${manifests.heroes.length} | ${bar(heroHave, manifests.heroes.length)} |`,
    `| Ingredient icons | ${ingHave}/${manifests.ingredients.length} | ${bar(ingHave, manifests.ingredients.length)} |`,
    `| Cooking step images | ${stepHave}/${manifests.steps.length} | ${bar(stepHave, manifests.steps.length)} |`,
    `| **Overall** | ${overallDone}/${overallTotal} | ${bar(overallDone, overallTotal)} |`,
    '',
    `Field-complete pipeline recipes: **${validation.readyCount}/${validation.totalRecipes}**`,
    '',
    'Open `asset-dashboard.html` for a visual card layout.',
    '',
  ].join('\n');

  const htmlPath = path.join(outDir, 'asset-dashboard.html');
  const mdPath = path.join(outDir, 'asset-dashboard.md');
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(mdPath, md, 'utf8');
  return path.relative(PATHS.appRoot, mdPath);
}
