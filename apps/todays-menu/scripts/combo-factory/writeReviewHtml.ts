/**
 * Review HTML for combo hero candidates (Sprint 48-C).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import { reviewImagePath } from './reviewStore';
import type { ComboQueueFile, ComboQueueItem } from './types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardHtml(item: ComboQueueItem): string {
  const abs = reviewImagePath(item.imageKey);
  const has = fs.existsSync(abs);
  const imgSrc = has ? `${item.imageKey}.jpg` : '';
  const promptFile = path.join(PATHS.promptsDir, `${item.imageKey}.md`);
  let promptSnippet = '';
  if (fs.existsSync(promptFile)) {
    const raw = fs.readFileSync(promptFile, 'utf8');
    const body =
      raw.match(/```(?:[^\n]*)\r?\n([\s\S]*?)```/)?.[1]?.trim() ?? raw;
    promptSnippet = body.slice(0, 280) + (body.length > 280 ? '…' : '');
  }

  const approve = `npm run combo:approve -- --key=${item.imageKey}`;
  const reject = `npm run combo:approve -- --key=${item.imageKey} --decision=reject`;
  const regen = `npm run combo:approve -- --key=${item.imageKey} --decision=regenerate --force`;

  return `
  <article class="card" data-status="${escapeHtml(item.status)}">
    <div class="preview">${
      has
        ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" />`
        : `<div class="missing">No preview</div>`
    }</div>
    <div class="meta">
      <h2>${escapeHtml(item.title)}</h2>
      <p><code>${escapeHtml(item.imageKey)}</code></p>
      <p class="combo-id">comboId: ${escapeHtml(item.comboId)}</p>
      <p class="status">Status: <strong>${escapeHtml(item.status)}</strong></p>
      ${
        promptSnippet
          ? `<details><summary>Prompt</summary><pre>${escapeHtml(promptSnippet)}</pre></details>`
          : ''
      }
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approve)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regen)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(reject)}">Reject</button>
      </div>
    </div>
  </article>`;
}

function section(title: string, items: ComboQueueItem[]): string {
  if (items.length === 0) return '';
  return `<h2 style="max-width:1100px;margin:28px auto 10px">${escapeHtml(title)} (${items.length})</h2>
<section class="grid">${items.map(cardHtml).join('\n')}</section>`;
}

export function writeComboReviewHtml(queue: ComboQueueFile): string {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const waiting = queue.items.filter((i) => i.status === 'completed');
  const rejected = queue.items.filter((i) => i.status === 'rejected');
  const failed = queue.items.filter((i) => i.status === 'failed');
  const queued = queue.items.filter(
    (i) => i.status === 'queued' || i.status === 'missing',
  );

  const body = [
    section('Awaiting review', waiting) ||
      `<p class="empty">No combos awaiting review.</p>`,
    section('Queued (pending generate)', queued),
    section('Rejected', rejected),
    section('Failed', failed),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><title>HANKKI Combo Hero Review</title>
<style>
body{font-family:Segoe UI,system-ui,sans-serif;background:#fff8f1;color:#2b2118;margin:0;padding:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;max-width:1100px;margin:0 auto}
.card{background:#fff;border:1px solid #edd9c8;border-radius:14px;overflow:hidden}
.preview{aspect-ratio:16/9;background:#f3e7db;display:grid;place-items:center}
.preview img{width:100%;height:100%;object-fit:cover}
.missing{color:#7a6a5c;font-size:.85rem}
.meta{padding:12px 14px}
.actions{display:flex;flex-wrap:wrap;gap:8px}
button{border:0;border-radius:999px;padding:8px 12px;background:#e67e22;color:#fff;font-weight:600;cursor:pointer}
button.secondary{background:#5d6d7e}button.danger{background:#c0392b}
details pre{white-space:pre-wrap;background:#f7eee6;padding:8px;border-radius:8px;max-height:120px;overflow:auto;font-size:.75rem}
.toast{position:fixed;bottom:16px;right:16px;background:#2b2118;color:#fff;padding:10px 12px;border-radius:8px;display:none;max-width:420px}
.toast.show{display:block}
.empty{max-width:1100px;margin:12px auto;color:#7a6a5c}
.combo-id{font-size:.8rem;color:#7a6a5c}
</style></head><body>
<header style="max-width:1100px;margin:0 auto 18px">
<h1>HANKKI Convenience Combo Hero Review</h1>
<p>
  Awaiting: <strong>${waiting.length}</strong> ·
  Approved: <strong>${queue.totals.approved}</strong> ·
  Queued: <strong>${queued.length}</strong> ·
  Rejected: <strong>${rejected.length}</strong> ·
  Failed: <strong>${failed.length}</strong>
</p>
<p>Pilot only — 3 HACK_COMBO heroes. Never auto-copied to <code>assets/convenience-combos/</code> until approve.</p>
</header>
${body}
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
</body></html>`;

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
  return PATHS.reviewIndex;
}
