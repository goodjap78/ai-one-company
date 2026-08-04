/**
 * Sprint Combo v2 — v1 vs v2 pilot comparison review page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { COMBO_IMAGE_PILOT_MAP } from '../../data/content/combos/convenienceComboImagePilots';
import { loadComboQueue } from './buildQueue';
import { COMBO_IMAGE_PILOT_IDS } from './comboHeroHints';
import { PATHS } from './config';
import {
  v1ProductionHistoryRelative,
  v1ReviewHistoryRelative,
} from './prepareComboV2Rereview';
import { reviewImagePath } from './reviewStore';
import type { ComboQueueItem } from './types';

const REVIEW_HTML = path.join(PATHS.reviewDir, 'combo-pilots-v2.html');
const REVIEW_PORT = Number(process.env.HANKKI_COMBO_REVIEW_PORT || 8766);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relFromReview(absRel: string): string {
  return path
    .relative(PATHS.reviewDir, path.join(PATHS.appRoot, absRel))
    .replace(/\\/g, '/');
}

function cardHtml(item: ComboQueueItem): string {
  const v2Abs = reviewImagePath(item.imageKey);
  const v2Has = fs.existsSync(v2Abs);
  const v2Rel = v2Has ? `${item.imageKey}.jpg` : '';

  const v1ProdRel = v1ProductionHistoryRelative(item.comboId, item.imageKey);
  const v1ReviewRel = v1ReviewHistoryRelative(item.imageKey);
  const v1Rel = v1ProdRel
    ? relFromReview(v1ProdRel)
    : v1ReviewRel
      ? relFromReview(v1ReviewRel)
      : null;

  const compareBlock =
    v1Rel && v2Has
      ? `<div class="compare">
          <figure><figcaption>v1 (backup)</figcaption><img src="${escapeHtml(v1Rel)}" alt="v1" /></figure>
          <figure><figcaption>v2 (review)</figcaption><img src="${escapeHtml(v2Rel)}" alt="v2" /></figure>
        </div>`
      : v2Has
        ? `<div class="preview"><img src="${escapeHtml(v2Rel)}" alt="${escapeHtml(item.title)}" /></div>`
        : `<div class="missing">No v2 preview yet</div>`;

  const approve = `npm run combo:approve -- --key=${item.imageKey}`;
  const reject = `npm run combo:approve -- --key=${item.imageKey} --decision=reject`;
  const regen = `npm run combo:approve -- --key=${item.imageKey} --decision=regenerate --force`;

  return `<article class="card" data-status="${escapeHtml(item.status)}">
    <div class="preview-main">${compareBlock}</div>
    <div class="meta">
      <h2>${escapeHtml(item.title)}</h2>
      <p class="ids"><code>${escapeHtml(item.comboId)}</code> · <code>${escapeHtml(item.imageKey)}</code></p>
      <p class="status">Status: <strong>${escapeHtml(item.status)}</strong></p>
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approve)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regen)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(reject)}">Reject</button>
      </div>
    </div>
  </article>`;
}

export function writeComboV2ReviewHtml(): string {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true});
  const queue = loadComboQueue();
  const items = COMBO_IMAGE_PILOT_IDS.map((comboId) => {
    const imageKey = COMBO_IMAGE_PILOT_MAP[comboId];
    return queue?.items.find((i) => i.imageKey === imageKey);
  }).filter((i): i is ComboQueueItem => Boolean(i));

  const awaiting = items.filter((i) => i.status === 'completed').length;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI Combo Hero v2 — Pilot Review</title>
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
    .preview-main,.preview { background:#f0e4d8; }
    .preview img,.compare img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; }
    .compare { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
    .compare figcaption { font-size:0.7rem; color:var(--muted); padding:4px 8px; }
    .missing { padding:40px; text-align:center; color:var(--muted); }
    .meta { padding:14px 16px 16px; }
    .meta h2 { margin:0 0 6px; font-size:1.1rem; }
    .ids { margin:0 0 8px; color:var(--muted); font-size:0.85rem; }
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
    <h1>Convenience Combo Hero v2.0 — Pilot (3)</h1>
    <p class="summary">
      Style: HANKKI Convenience Combo Hero Style v2.0 · 86–92% framing · combo-only subjects<br />
      Awaiting review: <strong>${awaiting}</strong> / 3 ·
      Open via HTTP: <code>http://127.0.0.1:${REVIEW_PORT}/combo-pilots-v2.html</code> (not file://)<br />
      <a href="index.html">Standard review index</a>
    </p>
  </header>
  <section class="grid">
    ${items.map(cardHtml).join('\n')}
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

  fs.writeFileSync(REVIEW_HTML, html, 'utf8');
  return path.relative(PATHS.appRoot, REVIEW_HTML);
}

export function getComboReviewPort(): number {
  return REVIEW_PORT;
}
