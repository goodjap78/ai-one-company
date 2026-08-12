/**
 * Sprint 60 — Batch-scoped hero expansion review HTML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import { loadImageQueue } from './buildImageQueue';
import { PATHS } from './config';
import type { HeroExpansionAuditRow } from './auditMealHeroExpansion';
import {
  HERO_EXPANSION_REVIEW_PORT,
  mealHeroExpansionHumanReviewPath,
  type MealHeroExpansionBatch,
  type MealHeroExpansionBatchId,
} from './mealHeroExpansionConfig';
import { MEAL_HERO_EXPANSION_PATHS } from './mealHeroExpansionConfig';
import { flatReviewImagePath } from './reviewStore';
import { escapeHtml } from './writeReviewHtml';

function ingredientSummary(recipeId: string): string {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return '';
  return recipe.ingredients
    .filter((i) => i.group === 'main')
    .slice(0, 4)
    .map((i) => i.name)
    .join(', ');
}

function reviewImageFilename(recipeId: string, imageKey: string): string {
  return `${recipeId}-${imageKey}.jpg`;
}

/**
 * Copy review JPG into meal-hero-expansion/review/images/ for static serve.
 * Original Gemini review file in image-factory/review/ is never modified.
 */
export function syncMealHeroExpansionReviewImage(
  recipeId: string,
  imageKey: string,
): string | null {
  if (!imageKey) return null;
  const src = flatReviewImagePath(recipeId, imageKey);
  if (!fs.existsSync(src)) return null;

  const destDir = MEAL_HERO_EXPANSION_PATHS.reviewImagesDir;
  fs.mkdirSync(destDir, { recursive: true });
  const filename = reviewImageFilename(recipeId, imageKey);
  const dest = path.join(destDir, filename);
  fs.copyFileSync(src, dest);

  return `images/${filename}`;
}

function reviewImageRel(recipeId: string, imageKey: string): string | null {
  return syncMealHeroExpansionReviewImage(recipeId, imageKey);
}

export type MealHeroExpansionHumanReviewStatus =
  | 'APPROVED_BY_USER'
  | 'REGENERATED_PENDING_REVIEW'
  | 'PENDING_REVIEW';

export type MealHeroExpansionHumanReviewFile = {
  batchId: MealHeroExpansionBatchId;
  sprint: string;
  updatedAt: string;
  entries: Record<string, MealHeroExpansionHumanReviewStatus>;
};

export function loadMealHeroExpansionHumanReview(
  batchId: MealHeroExpansionBatchId,
): Map<string, MealHeroExpansionHumanReviewStatus> {
  const path = mealHeroExpansionHumanReviewPath(batchId);
  if (!fs.existsSync(path)) return new Map();
  try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8')) as MealHeroExpansionHumanReviewFile;
    return new Map(Object.entries(data.entries ?? {}));
  } catch {
    return new Map();
  }
}

export function writeMealHeroExpansionHumanReview(
  batchId: MealHeroExpansionBatchId,
  entries: Record<string, MealHeroExpansionHumanReviewStatus>,
  sprint = 'Sprint 60.11.1',
): string {
  const outPath = mealHeroExpansionHumanReviewPath(batchId);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const payload: MealHeroExpansionHumanReviewFile = {
    batchId,
    sprint,
    updatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

function cardHtml(
  batchId: string,
  recipeId: string,
  recipeName: string,
  imageKey: string,
  audit?: HeroExpansionAuditRow,
  humanReview?: MealHeroExpansionHumanReviewStatus,
): string {
  const imgRel = reviewImageRel(recipeId, imageKey);
  const preview = imgRel
    ? `<img src="${escapeHtml(imgRel)}" alt="${escapeHtml(recipeName)}" loading="lazy" />`
    : `<div class="missing">Awaiting generation</div>`;

  const grade = audit?.grade ?? 'REGENERATE';
  const gradeClass = grade.toLowerCase().replace('_', '-');
  const reasons = audit?.reasons?.join('; ') ?? 'not audited';
  const provider = audit?.provider ?? '—';
  const humanReviewHtml = humanReview
    ? `<p class="human-review">Human review: <strong>${escapeHtml(humanReview)}</strong></p>`
    : '';

  const approveCmd = `npm run hero:approve -- --recipe=${recipeId}`;
  const regenCmd = `npm run hero:expansion -- generate --batch=${batchId} --recipe=${recipeId} --force`;
  const rejectCmd = `npm run hero:approve -- --recipe=${recipeId} --decision=reject`;

  return `
  <article class="card" data-grade="${escapeHtml(grade)}">
    <div class="preview">${preview}</div>
    <div class="fallback-note">Fallback until approve: category / bundled default</div>
    <div class="meta">
      <h2>${escapeHtml(recipeName)}</h2>
      <p class="ids"><code>${escapeHtml(recipeId)}</code> · <code>${escapeHtml(imageKey)}</code></p>
      <p class="ingredients">${escapeHtml(ingredientSummary(recipeId))}</p>
      <p class="provider">Provider: <strong>${escapeHtml(provider)}</strong></p>
      ${humanReviewHtml}
      <p class="audit grade-${gradeClass}">Audit: <strong>${escapeHtml(grade)}</strong></p>
      <p class="audit-reasons">${escapeHtml(reasons)}</p>
      <div class="actions">
        <button type="button" data-cmd="${escapeHtml(approveCmd)}">Approve</button>
        <button type="button" class="secondary" data-cmd="${escapeHtml(regenCmd)}">Regenerate</button>
        <button type="button" class="danger" data-cmd="${escapeHtml(rejectCmd)}">Reject</button>
      </div>
      <div class="cmd-block">
        <p class="cmd-label">Approve</p>
        <code class="cmd">${escapeHtml(approveCmd)}</code>
        <p class="cmd-label">Regenerate</p>
        <code class="cmd">${escapeHtml(regenCmd)}</code>
        <p class="cmd-label">Reject</p>
        <code class="cmd">${escapeHtml(rejectCmd)}</code>
      </div>
      <p class="hint">Click button to copy CLI. Production promote only after dedicated approval sprint.</p>
    </div>
  </article>`;
}

export function syncMealHeroExpansionBatchReviewImages(
  batch: MealHeroExpansionBatch,
): { copied: number; missing: number } {
  const queue = loadImageQueue();
  let copied = 0;
  let missing = 0;

  for (const recipeId of batch.recipeIds) {
    const recipe = getHankkiRecipeById(recipeId);
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const imageKey = item?.heroImageKey ?? recipe?.heroImageKey ?? '';
    if (!imageKey) {
      missing += 1;
      continue;
    }
    const rel = syncMealHeroExpansionReviewImage(recipeId, imageKey);
    if (rel) copied += 1;
    else missing += 1;
  }

  return { copied, missing };
}

export function writeMealHeroExpansionBatchReview(
  batch: MealHeroExpansionBatch,
  auditRows: HeroExpansionAuditRow[] = [],
): string {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.reviewDir, { recursive: true });
  const imageSync = syncMealHeroExpansionBatchReviewImages(batch);
  console.log(
    `Review images synced → images/ (${imageSync.copied} copied, ${imageSync.missing} missing)`,
  );

  const auditMap = new Map(auditRows.map((r) => [r.recipeId, r]));
  const humanReviewMap = loadMealHeroExpansionHumanReview(batch.id);
  const queue = loadImageQueue();

  const cards = batch.recipeIds.map((recipeId) => {
    const recipe = getHankkiRecipeById(recipeId);
    const item = queue?.items.find((i) => i.recipeId === recipeId);
    const imageKey = item?.heroImageKey ?? recipe?.heroImageKey ?? '';
    const name = item?.recipeName ?? recipe?.name ?? recipeId;
    return cardHtml(
      batch.id,
      recipeId,
      name,
      imageKey,
      auditMap.get(recipeId),
      humanReviewMap.get(recipeId),
    );
  });

  const sprintLabel =
    batch.id === 'batch-7'
      ? 'Sprint 60.13'
      : batch.id === 'batch-6'
      ? 'Sprint 60.11.1'
      : batch.id === 'batch-5'
        ? 'Sprint 60.9'
        : batch.id === 'batch-4'
        ? 'Sprint 60.7'
        : batch.id === 'batch-3'
        ? 'Sprint 60.5'
        : batch.id === 'batch-2'
          ? 'Sprint 60.3'
          : batch.id === 'batch-1'
            ? 'Sprint 60.1'
            : 'Sprint 60';

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HANKKI Hero Expansion · ${escapeHtml(batch.label)}</title>
  <style>
    :root { --bg:#fff4ec; --card:#fff; --ink:#2b2118; --muted:#7a6a5c; --accent:#e67e22; --border:#edd9c8; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, sans-serif; background:var(--bg); color:var(--ink); padding:20px; }
    h1 { font-size:1.35rem; }
    .sub { color:var(--muted); margin-bottom:20px; }
    .grid { display:grid; gap:20px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .card { background:var(--card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .preview img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#f5ebe0; }
    .missing { aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; background:#f0e6da; color:var(--muted); }
    .meta { padding:14px; }
    .ids code { font-size:12px; }
    .ingredients { font-size:13px; color:var(--muted); }
    .audit { font-size:13px; margin-top:8px; }
    .grade-pass-candidate strong { color:#2d6a4f; }
    .grade-manual-review strong { color:#e67e22; }
    .grade-regenerate strong { color:#c0392b; }
    .human-review { font-size:13px; margin-top:6px; }
    .human-review strong { color:#1565c0; }
    .audit-reasons { font-size:12px; color:var(--muted); }
    .fallback-note { font-size:11px; color:var(--muted); padding:4px 14px; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    button { border:1px solid var(--accent); background:var(--accent); color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; }
    button.secondary { background:#fff; color:var(--accent); }
    button.danger { background:#fff; color:#c0392b; border-color:#c0392b; }
    .hint { font-size:11px; color:var(--muted); margin-top:8px; }
    .cmd-block { margin-top:10px; font-size:11px; }
    .cmd-label { margin:6px 0 2px; color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:0.04em; }
    .cmd { display:block; padding:6px 8px; background:#f8f0e8; border:1px solid var(--border); border-radius:6px; font-size:11px; word-break:break-all; user-select:all; cursor:pointer; }
    .cmd.copied { background:#e8f5e9; border-color:#2d6a4f; }
    .banner { background:#fff8e6; border:1px solid #e6c200; padding:10px 14px; border-radius:8px; margin-bottom:16px; font-size:13px; }
    .serve { margin-top:16px; font-size:13px; }
  </style>
</head>
<body>
  <h1>Hero Expansion · ${escapeHtml(batch.label)}</h1>
  <p class="sub">${sprintLabel} · ${batch.recipeIds.length} recipes · Gemini review only · human approve required · Style lock v1.2</p>
  <p class="banner"><strong>Review server required.</strong> Open via <code>http://127.0.0.1:${HERO_EXPANSION_REVIEW_PORT}/${escapeHtml(batch.id)}.html</code> after <code>npm run hero:expansion:serve</code>. Do not open this file directly (<code>file://</code> breaks images).</p>
  <p class="serve">Serve: <code>npm run hero:expansion:serve</code> → <a href="http://127.0.0.1:${HERO_EXPANSION_REVIEW_PORT}/${batch.id}.html">http://127.0.0.1:${HERO_EXPANSION_REVIEW_PORT}/${batch.id}.html</a></p>
  <div class="grid">
    ${cards.join('\n')}
  </div>
  <script>
    function copyText(text, el) {
      const isBtn = el.tagName === 'BUTTON';
      const label = isBtn
        ? el.classList.contains('danger')
          ? 'Reject'
          : el.classList.contains('secondary')
            ? 'Regenerate'
            : 'Approve'
        : null;
      const done = () => {
        if (isBtn && label) {
          el.textContent = 'Copied!';
          setTimeout(() => { el.textContent = label; }, 1200);
        } else {
          el.classList.add('copied');
          setTimeout(() => el.classList.remove('copied'), 1200);
        }
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      }
    }
    document.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd) copyText(cmd, btn);
      });
    });
    document.querySelectorAll('code.cmd').forEach((el) => {
      el.addEventListener('click', () => copyText(el.textContent || '', el);
    });
  </script>
</body>
</html>`;

  const outPath = path.join(MEAL_HERO_EXPANSION_PATHS.reviewDir, `${batch.id}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

export function writeMealHeroExpansionBatchIndex(): string {
  const batches = ['batch-1', 'batch-2', 'batch-3', 'batch-4', 'batch-5', 'batch-6', 'batch-7'];
  const links = batches
    .map(
      (id) =>
        `<li><a href="${id}.html">${id}</a> · <a href="http://127.0.0.1:${HERO_EXPANSION_REVIEW_PORT}/${id}.html">:${HERO_EXPANSION_REVIEW_PORT}</a></li>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hero Expansion Batches</title></head><body><h1>Hero Expansion Review Batches</h1><ul>${links}</ul></body></html>`;
  const outPath = path.join(MEAL_HERO_EXPANSION_PATHS.reviewDir, 'index.html');
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.reviewDir, { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}
