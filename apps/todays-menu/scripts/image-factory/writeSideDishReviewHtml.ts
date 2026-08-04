/**
 * Sprint 50-B — side-dish-only review page (recipe_0141–0160).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import {
  auditSideDishHeroes,
  type SideDishAuditGrade,
  v1HistoryRelative,
} from './auditSideDishHeroV2';
import { escapeHtml } from './writeReviewHtml';

function gradeClass(grade: SideDishAuditGrade): string {
  if (grade === 'PASS_CANDIDATE') return 'grade-pass';
  if (grade === 'MANUAL_REVIEW') return 'grade-manual';
  return 'grade-regen';
}

function cardHtml(row: Awaited<ReturnType<typeof auditSideDishHeroes>>[number]): string {
  const v2Rel = row.reviewPath
    ? path.relative(PATHS.reviewDir, path.join(PATHS.appRoot, row.reviewPath)).replace(/\\/g, '/')
    : '';
  const v1AbsRel = v1HistoryRelative(row.recipeId, row.heroImageKey);
  const v1Rel = v1AbsRel
    ? path.relative(PATHS.reviewDir, path.join(PATHS.appRoot, v1AbsRel)).replace(/\\/g, '/')
    : null;
  const approveCmd = `npm run hero:approve -- --recipe=${row.recipeId} --force`;
  const regenCmd = `npm run hero:approve -- --recipe=${row.recipeId} --decision=regenerate --force`;
  const rejectCmd = `npm run hero:approve -- --recipe=${row.recipeId} --decision=reject`;

  const compareBlock = v1Rel
    ? `<div class="compare">
        <figure><figcaption>v1 review</figcaption><img src="${escapeHtml(v1Rel)}" alt="v1" /></figure>
        <figure><figcaption>v2 review</figcaption><img src="${escapeHtml(v2Rel)}" alt="v2" /></figure>
      </div>`
    : `<div class="preview"><img src="${escapeHtml(v2Rel)}" alt="${escapeHtml(row.recipeName)}" /></div>`;

  return `<article class="card">
    <div class="preview-main">${compareBlock}</div>
    <div class="meta">
      <h2>${escapeHtml(row.recipeName)}</h2>
      <p class="ids"><code>${escapeHtml(row.recipeId)}</code> · <code>${escapeHtml(row.heroImageKey)}</code></p>
      <p class="status grade ${gradeClass(row.grade)}">${escapeHtml(row.grade)}</p>
      <ul class="reasons">${row.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      <p class="metrics">centroid ${(row.centroidX * 100).toFixed(0)}% × ${(row.centroidY * 100).toFixed(0)}% · fill ${(row.fillRatio * 100).toFixed(0)}% · margins top ${(row.topMargin * 100).toFixed(0)}% / bottom ${(row.bottomMargin * 100).toFixed(0)}%</p>
      ${row.manualChecks.length ? `<p class="manual">Manual: ${row.manualChecks.map(escapeHtml).join(' · ')}</p>` : ''}
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approveCmd)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regenCmd)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(rejectCmd)}">Reject</button>
      </div>
    </div>
  </article>`;
}

export async function writeSideDishReviewHtml(): Promise<string> {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const rows = await auditSideDishHeroes();
  const pass = rows.filter((r) => r.grade === 'PASS_CANDIDATE').length;
  const manual = rows.filter((r) => r.grade === 'MANUAL_REVIEW').length;
  const regen = rows.filter((r) => r.grade === 'REGENERATE').length;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI Side Dish Hero Review (0141–0160)</title>
  <style>
    :root {
      --bg: #fff4ec; --card: #fff; --ink: #2b2118; --muted: #7a6a5c;
      --accent: #e67e22; --border: #edd9c8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(180deg, var(--bg), #ffe8d6); color: var(--ink); padding: 24px; }
    header { max-width: 1200px; margin: 0 auto 24px; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; }
    .summary { color: var(--muted); font-size: 0.95rem; line-height: 1.5; }
    .grid { max-width: 1200px; margin: 0 auto; display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px;
      overflow: hidden; box-shadow: 0 8px 24px rgba(80,40,10,0.06); }
    .preview-main, .preview { background: #f0e4d8; }
    .preview img, .compare img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
    .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .compare figcaption { font-size: 0.7rem; color: var(--muted); padding: 4px 8px; }
    .meta { padding: 14px 16px 16px; }
    .meta h2 { margin: 0 0 6px; font-size: 1.1rem; }
    .ids { margin: 0 0 8px; color: var(--muted); font-size: 0.85rem; }
    .grade { font-weight: 700; font-size: 0.85rem; margin: 0 0 8px; }
    .grade-pass { color: #27ae60; }
    .grade-manual { color: #d68910; }
    .grade-regen { color: #c0392b; }
    .reasons { margin: 0 0 8px; padding-left: 18px; font-size: 0.8rem; color: var(--muted); }
    .metrics, .manual { font-size: 0.75rem; color: var(--muted); margin: 0 0 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button { appearance: none; border: 0; border-radius: 999px; padding: 8px 14px;
      font-weight: 600; cursor: pointer; background: var(--accent); color: #fff; }
    button.secondary { background: #5d6d7e; }
    button.danger { background: #c0392b; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #2b2118; color: #fff;
      padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; display: none; max-width: 420px; }
    .toast.show { display: block; }
    code { font-family: ui-monospace, Consolas, monospace; }
  </style>
</head>
<body>
  <header>
    <h1>Side Dish Hero v2 — Sprint 50-B</h1>
    <p class="summary">
      Scope: recipe_0141–0160 (20) · Side Dish Hero Style v2.1 — tight 86–92% framing · single dish only<br />
      PASS_CANDIDATE: <strong>${pass}</strong> · MANUAL_REVIEW: <strong>${manual}</strong> · REGENERATE: <strong>${regen}</strong><br />
      Open via HTTP: <code>http://127.0.0.1:8765/side-dishes.html</code> (not file://)<br />
      <a href="index.html">All heroes review</a>
    </p>
  </header>
  <section class="grid">
    ${rows.map(cardHtml).join('\n')}
  </section>
  <div class="toast" id="toast"></div>
  <script>
    const toast = document.getElementById('toast');
    document.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const cmd = btn.getAttribute('data-cmd') || '';
        try { await navigator.clipboard.writeText(cmd); toast.textContent = 'Copied: ' + cmd; }
        catch { toast.textContent = cmd; }
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      });
    });
  </script>
</body>
</html>`;

  const out = path.join(PATHS.reviewDir, 'side-dishes.html');
  fs.writeFileSync(out, html, 'utf8');
  return path.relative(PATHS.appRoot, out);
}
