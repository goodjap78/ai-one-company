/**
 * Sprint 51-B — HACK batch review HTML (batch 1 only for now).
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadComboAuditJson, type ComboAuditRow } from './auditComboHeroV2';
import { loadComboQueue } from './buildQueue';
import { PATHS } from './config';
import { hackBatchComboIds, type HackBatchNumber } from './hackBatchScope';
import { reviewImagePath } from './reviewStore';
import type { ComboQueueItem } from './types';
import { getComboReviewPort } from './writeComboV2ReviewHtml';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gradeClass(grade: string): string {
  if (grade === 'PASS_CANDIDATE') return 'grade-pass';
  if (grade === 'MANUAL_REVIEW') return 'grade-manual';
  return 'grade-regen';
}

function cardHtml(item: ComboQueueItem, audit?: ComboAuditRow): string {
  const v2Abs = reviewImagePath(item.imageKey);
  const v2Has = fs.existsSync(v2Abs);
  const v2Rel = v2Has ? `${item.imageKey}.jpg` : '';
  const transformationName = audit?.transformationName ?? '';

  const preview = v2Has
    ? `<div class="preview"><img src="${escapeHtml(v2Rel)}" alt="${escapeHtml(item.title)}" /></div>`
    : `<div class="missing">No review image yet</div>`;

  const grade = audit?.grade ?? 'PENDING';
  const reasons =
    audit?.reasons?.length
      ? `<ul class="reasons">${audit.reasons
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join('')}</ul>`
      : '';

  const approve = `npm run combo:approve -- --key=${item.imageKey}`;
  const reject = `npm run combo:approve -- --key=${item.imageKey} --decision=reject`;
  const regen = `npm run combo:generate -- --combo=${item.comboId} --force`;

  return `<article class="card" data-status="${escapeHtml(item.status)}">
    <div class="preview-wrap">${preview}</div>
    <div class="meta">
      <h2>${escapeHtml(item.title)}</h2>
      <p class="ids"><code>${escapeHtml(item.comboId)}</code> · <code>${escapeHtml(item.imageKey)}</code></p>
      ${transformationName ? `<p class="transform">${escapeHtml(transformationName)}</p>` : ''}
      <p class="audit ${gradeClass(grade)}">Audit: <strong>${escapeHtml(grade)}</strong></p>
      ${reasons}
      <p class="status">Queue: <strong>${escapeHtml(item.status)}</strong></p>
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approve)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regen)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(reject)}">Reject</button>
      </div>
    </div>
  </article>`;
}

export function writeHackBatchReviewHtml(batch: HackBatchNumber): string {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const comboIds = hackBatchComboIds(batch);
  const queue = loadComboQueue();
  const auditRows = loadComboAuditJson(batch) ?? [];
  const auditByCombo = new Map(auditRows.map((r) => [r.comboId, r]));

  const items = comboIds
    .map((comboId) => {
      const queueItem = queue?.items.find((i) => i.comboId === comboId);
      if (!queueItem) return null;
      return { queueItem, audit: auditByCombo.get(comboId) };
    })
    .filter((x): x is { queueItem: ComboQueueItem; audit?: ComboAuditRow } => Boolean(x));

  const awaiting = items.filter((i) => i.queueItem.status === 'completed').length;
  const port = getComboReviewPort();
  const fileName = `hack-batch-${batch}.html`;
  const outAbs = path.join(PATHS.reviewDir, fileName);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI HACK Combo Batch ${batch} Review</title>
  <style>
    :root { --bg:#fff4ec; --card:#fff; --ink:#2b2118; --muted:#7a6a5c; --accent:#e67e22; --border:#edd9c8; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:Segoe UI,system-ui,sans-serif;
      background:linear-gradient(180deg,var(--bg),#ffe8d6); color:var(--ink); padding:24px; }
    header { max-width:1200px; margin:0 auto 24px; }
    h1 { margin:0 0 8px; font-size:1.5rem; }
    .summary { color:var(--muted); font-size:0.95rem; line-height:1.5; }
    .grid { max-width:1200px; margin:0 auto; display:grid;
      grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:16px; }
    .card { background:var(--card); border:1px solid var(--border); border-radius:16px;
      overflow:hidden; box-shadow:0 8px 24px rgba(80,40,10,0.06); }
    .preview-wrap,.preview { background:#f0e4d8; }
    .preview img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; }
    .missing { padding:40px; text-align:center; color:var(--muted); }
    .meta { padding:14px 16px 16px; }
    .meta h2 { margin:0 0 6px; font-size:1.1rem; }
    .ids,.transform { margin:0 0 8px; color:var(--muted); font-size:0.85rem; }
    .audit { margin:8px 0; font-size:0.9rem; }
    .grade-pass strong { color:#27ae60; }
    .grade-manual strong { color:#f39c12; }
    .grade-regen strong { color:#c0392b; }
    .reasons { margin:6px 0 10px; padding-left:18px; color:var(--muted); font-size:0.8rem; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    button { border:0; border-radius:999px; padding:8px 14px; font-weight:600; cursor:pointer;
      background:var(--accent); color:#fff; }
    button.secondary { background:#5d6d7e; }
    button.danger { background:#c0392b; }
    .toast { position:fixed; bottom:20px; right:20px; background:#2b2118; color:#fff;
      padding:10px 14px; border-radius:10px; font-size:0.85rem; display:none; max-width:420px; }
    .toast.show { display:block; }
    code { font-family:ui-monospace,Consolas,monospace; }
  </style>
</head>
<body>
  <header>
    <h1>HACK Combo Batch ${batch} — Convenience Combo Hero v2.0</h1>
    <p class="summary">
      Style: HANKKI Convenience Combo Hero Style v2.0 · 1344×768 JPG · 86–92% framing<br />
      Awaiting review: <strong>${awaiting}</strong> / ${items.length} ·
      HTTP: <code>http://127.0.0.1:${port}/${fileName}</code><br />
      <a href="index.html">Standard review index</a> ·
      <a href="combo-pilots-v2.html">Pilot v2 comparison</a>
    </p>
  </header>
  <section class="grid">
    ${items.map(({ queueItem, audit }) => cardHtml(queueItem, audit)).join('\n')}
  </section>
  <div class="toast" id="toast"></div>
  <script>
    const toast=document.getElementById('toast');
    document.querySelectorAll('button[data-cmd]').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        const cmd=btn.getAttribute('data-cmd')||'';
        try{await navigator.clipboard.writeText(cmd);toast.textContent='Copied: '+cmd;}
        catch{toast.textContent=cmd;}
        toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outAbs, html, 'utf8');
  return path.relative(PATHS.appRoot, outAbs);
}
