/**
 * Sprint IMG-2A STEP 5 — Preview report (index.html).
 * Shows generated candidates with Approve / Regenerate command helpers.
 * Does NOT publish (registry update happens only via hero:approve).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import type { ImageQueueFile, ImageQueueItem } from './queueTypes';
import { flatReviewImagePath, resolveCandidatePath } from './reviewStore';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relativeFromReview(abs: string): string {
  return path.relative(PATHS.reviewDir, abs).split(path.sep).join('/');
}

function cardHtml(item: ImageQueueItem): string {
  const candidateAbs = resolveCandidatePath(item.recipeId, item.heroImageKey);
  const flatAbs = flatReviewImagePath(item.recipeId, item.heroImageKey);
  const previewAbs = fs.existsSync(flatAbs)
    ? flatAbs
    : fs.existsSync(candidateAbs)
      ? candidateAbs
      : null;
  const hasCandidate = Boolean(previewAbs);
  const imgSrc = previewAbs ? relativeFromReview(previewAbs) : '';

  const promptFile = path.join(
    PATHS.appRoot,
    'generated/image-factory/prompts',
    `${item.heroImageKey}.md`,
  );
  const promptUsed = path.join(
    PATHS.reviewDir,
    item.heroImageKey,
    'prompt-used.md',
  );
  let promptSnippet = '';
  const promptSource = fs.existsSync(promptUsed)
    ? promptUsed
    : fs.existsSync(promptFile)
      ? promptFile
      : null;
  if (promptSource) {
    const raw = fs.readFileSync(promptSource, 'utf8');
    const body =
      raw.match(/```(?:[^\n]*)\r?\n([\s\S]*?)```/)?.[1]?.trim() ??
      raw.slice(0, 280);
    promptSnippet = body.slice(0, 280) + (body.length > 280 ? '…' : '');
  }

  const approveCmd = `npm run hero:approve -- --recipe=${item.recipeId}`;
  const regenCmd = `npm run hero:approve -- --recipe=${item.recipeId} --decision=regenerate --force`;
  const rejectCmd = `npm run hero:approve -- --recipe=${item.recipeId} --decision=reject`;

  const preview = hasCandidate
    ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.recipeName)}" loading="lazy" />`
    : `<div class="missing">No candidate image</div>`;

  return `
  <article class="card" data-id="${escapeHtml(item.recipeId)}" data-status="${escapeHtml(item.status)}">
    <div class="preview">${preview}</div>
    <div class="meta">
      <h2>${escapeHtml(item.recipeName)}</h2>
      <p class="ids"><code>${escapeHtml(item.recipeId)}</code> · <code>${escapeHtml(item.heroImageKey)}</code></p>
      <p class="status">Status: <strong>${escapeHtml(item.status)}</strong></p>
      ${
        promptSnippet
          ? `<details><summary>Prompt</summary><pre>${escapeHtml(promptSnippet)}</pre></details>`
          : ''
      }
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approveCmd)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regenCmd)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(rejectCmd)}">Reject</button>
      </div>
      <p class="hint">Buttons copy the CLI command. Images stay in review until approve copies to assets/meals.</p>
    </div>
  </article>`;
}

export function writeReviewIndexHtml(queue: ImageQueueFile): string {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const waiting = queue.items.filter((i) => i.status === 'completed');
  const failed = queue.items.filter((i) => i.status === 'failed');
  const approved = queue.items.filter((i) => i.status === 'approved');
  const queued = queue.items.filter((i) => i.status === 'queued');

  const cards =
    waiting.length > 0
      ? waiting.map(cardHtml).join('\n')
      : `<p class="empty">No images waiting approval. Run <code>npm run hero:generate</code> with IMAGE_PROVIDER set.</p>`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI Hero Image Review</title>
  <style>
    :root {
      --bg: #fff4ec;
      --card: #ffffff;
      --ink: #2b2118;
      --muted: #7a6a5c;
      --accent: #e67e22;
      --border: #edd9c8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(180deg, var(--bg), #ffe8d6);
      color: var(--ink);
      padding: 24px;
    }
    header { max-width: 1100px; margin: 0 auto 24px; }
    h1 { margin: 0 0 8px; font-size: 1.6rem; }
    .summary { color: var(--muted); font-size: 0.95rem; }
    .summary strong { color: var(--ink); }
    .grid {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(80, 40, 10, 0.06);
    }
    .preview {
      aspect-ratio: 16 / 9;
      background: #f0e4d8;
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .preview img { width: 100%; height: 100%; object-fit: cover; }
    .missing { color: var(--muted); font-size: 0.9rem; }
    .meta { padding: 14px 16px 16px; }
    .meta h2 { margin: 0 0 6px; font-size: 1.15rem; }
    .ids { margin: 0 0 6px; color: var(--muted); font-size: 0.85rem; }
    .status { margin: 0 0 12px; font-size: 0.9rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      background: var(--accent);
      color: #fff;
    }
    button.secondary { background: #5d6d7e; }
    button.danger { background: #c0392b; }
    .hint { margin: 10px 0 0; font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
    details { margin: 0 0 10px; font-size: 0.8rem; color: var(--muted); }
    details pre {
      white-space: pre-wrap; background: #f7eee6; padding: 8px;
      border-radius: 8px; max-height: 120px; overflow: auto;
    }
    .empty { max-width: 1100px; margin: 24px auto; color: var(--muted); }
    .toast {
      position: fixed; bottom: 20px; right: 20px;
      background: #2b2118; color: #fff; padding: 10px 14px;
      border-radius: 10px; font-size: 0.85rem; display: none;
      max-width: 420px; word-break: break-all;
    }
    .toast.show { display: block; }
    code { font-family: ui-monospace, Consolas, monospace; }
  </style>
</head>
<body>
  <header>
    <h1>HANKKI Hero Image Review</h1>
    <p class="summary">
      Waiting approval: <strong>${waiting.length}</strong> ·
      Queued: <strong>${queued.length}</strong> ·
      Approved: <strong>${approved.length}</strong> ·
      Failed: <strong>${failed.length}</strong>
      <br />Generated ${escapeHtml(queue.generatedAt)} · provider hint <code>${escapeHtml(queue.providerHint)}</code>
      <br /><strong>Not published</strong> until <code>hero:approve</code> updates <code>mealImageAssets.ts</code>.
    </p>
  </header>
  <section class="grid">
    ${cards}
  </section>
  <div class="toast" id="toast"></div>
  <script>
    const toast = document.getElementById('toast');
    document.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const cmd = btn.getAttribute('data-cmd') || '';
        try {
          await navigator.clipboard.writeText(cmd);
          toast.textContent = 'Copied: ' + cmd;
        } catch {
          toast.textContent = cmd;
        }
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      });
    });
  </script>
</body>
</html>
`;

  const out = path.join(PATHS.reviewDir, 'index.html');
  fs.writeFileSync(out, html, 'utf8');
  return path.relative(PATHS.appRoot, out);
}
