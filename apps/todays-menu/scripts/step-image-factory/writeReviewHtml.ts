/**
 * Review HTML for cooking-step candidates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import { reviewImagePath } from './reviewStore';
import type { StepQueueFile, StepQueueItem } from './types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardHtml(item: StepQueueItem): string {
  const abs = reviewImagePath(item.imageKey);
  const has = fs.existsSync(abs);
  const imgSrc = has ? `${item.imageKey}.jpg` : '';
  const promptPath = path.join(PATHS.reviewDir, item.imageKey, 'prompt-used.md');
  const promptFile = path.join(PATHS.promptsDir, `${item.imageKey}.md`);
  let promptSnippet = '';
  const src = fs.existsSync(promptPath)
    ? promptPath
    : fs.existsSync(promptFile)
      ? promptFile
      : null;
  if (src) {
    const raw = fs.readFileSync(src, 'utf8');
    const body =
      raw.match(/```(?:[^\n]*)\r?\n([\s\S]*?)```/)?.[1]?.trim() ?? raw;
    promptSnippet = body.slice(0, 260) + (body.length > 260 ? '…' : '');
  }

  const approve = `npm run step:approve -- --key=${item.imageKey}`;
  const reject = `npm run step:approve -- --key=${item.imageKey} --decision=reject`;
  const regen = `npm run step:approve -- --key=${item.imageKey} --decision=regenerate --force`;

  return `
  <article class="card" data-status="${escapeHtml(item.status)}">
    <div class="preview">${
      has
        ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.stepTitle)}" />`
        : `<div class="missing">No preview</div>`
    }</div>
    <div class="meta">
      <h2>${escapeHtml(item.recipeName)}</h2>
      <p class="step">Step ${item.stepOrder}: ${escapeHtml(item.stepTitle)}</p>
      <p><code>${escapeHtml(item.imageKey)}</code></p>
      <p class="status">Status: <strong>${escapeHtml(item.status)}</strong></p>
      <p class="inst">${escapeHtml(item.stepInstruction)}</p>
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

function section(title: string, items: StepQueueItem[]): string {
  if (!items.length) return '';
  return `<h2 style="max-width:1100px;margin:28px auto 10px">${escapeHtml(title)} (${items.length})</h2>
<section class="grid">${items.map(cardHtml).join('\n')}</section>`;
}

export function writeStepReviewHtml(queue: StepQueueFile): string {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const waiting = queue.items.filter((i) => i.status === 'completed');
  const rejected = queue.items.filter((i) => i.status === 'rejected');
  const failed = queue.items.filter((i) => i.status === 'failed');
  const queued = queue.items.filter(
    (i) => i.status === 'queued' || i.status === 'missing',
  );

  const body =
    waiting.length + rejected.length + failed.length === 0
      ? `<p class="empty">${queued.length} steps queued. Run <code>npm run step:generate -- --from=001 --to=050 --missing-only --resume</code> or <code>--keys=...</code> for the five-image test.</p>`
      : [
          section('Awaiting review', waiting) ||
            `<p class="empty">No steps awaiting review.</p>`,
          section('Rejected (outside production)', rejected),
          section('Failed', failed),
        ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><title>HANKKI Step Image Review</title>
<style>
body{font-family:Segoe UI,system-ui,sans-serif;background:#f4f7fb;color:#1f2a37;margin:0;padding:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;max-width:1100px;margin:0 auto}
.card{background:#fff;border:1px solid #d7e0ea;border-radius:14px;overflow:hidden}
.preview{aspect-ratio:16/9;background:#e8eef5;display:grid;place-items:center}
.preview img{width:100%;height:100%;object-fit:cover}
.meta{padding:12px 14px}
.inst{font-size:.85rem;color:#526173;line-height:1.4}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
button{border:0;border-radius:999px;padding:8px 12px;background:#2f80ed;color:#fff;font-weight:600;cursor:pointer}
button.secondary{background:#5d6d7e}button.danger{background:#c0392b}
details pre{white-space:pre-wrap;background:#eef3f8;padding:8px;border-radius:8px;max-height:110px;overflow:auto;font-size:.75rem}
.toast{position:fixed;bottom:16px;right:16px;background:#1f2a37;color:#fff;padding:10px 12px;border-radius:8px;display:none;max-width:420px}
.toast.show{display:block}
.empty{max-width:1100px;margin:12px auto;color:#627384}
</style></head><body>
<header style="max-width:1100px;margin:0 auto 18px">
<h1>HANKKI Cooking Step Image Review</h1>
<p>Awaiting: <strong>${waiting.length}</strong> · Approved: <strong>${queue.totals.approved}</strong> · Queued: <strong>${queued.length}</strong> · Rejected: <strong>${rejected.length}</strong> · Failed: <strong>${failed.length}</strong></p>
<p>Each card: recipe · step · title · instruction · preview · prompt · approve / reject / regenerate · status.</p>
<p>Unapproved images stay in review — never auto-copied to <code>assets/recipe-steps/</code>.</p>
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
