/** HANKKI Image Review Dashboard — client UI (REVIEW-1) */

let cards = [];
let promptVersion = 'v1.1';
let busy = new Set();

const $ = (sel) => document.querySelector(sel);

function toast(message, isError = false) {
  const el = $('#toast');
  el.hidden = false;
  el.textContent = message;
  el.style.borderColor = isError ? '#d47171' : '#2f3728';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 4200);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

function statusLabel(s) {
  if (s === 'pending_review') return 'Pending Review';
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return s;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function starsHtml(recipeId, value) {
  const v = value || 0;
  return [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button type="button" class="${n <= v ? 'on' : ''}" data-star="${n}" data-id="${recipeId}" aria-label="${n} stars">★</button>`,
    )
    .join('');
}

function renderStats() {
  const pending = cards.filter((c) => c.reviewStatus === 'pending_review').length;
  const approved = cards.filter((c) => c.reviewStatus === 'approved').length;
  const rejected = cards.filter((c) => c.reviewStatus === 'rejected').length;
  $('#stats').innerHTML = `
    <div class="stat"><span>Pending</span><strong>${pending}</strong></div>
    <div class="stat"><span>Approved</span><strong>${approved}</strong></div>
    <div class="stat"><span>Rejected</span><strong>${rejected}</strong></div>
    <div class="stat"><span>Prompt</span><strong>${promptVersion}</strong></div>
    <div class="stat"><span>Cards</span><strong>${cards.length}</strong></div>
  `;
}

function renderCards() {
  const root = $('#queue');
  if (!cards.length) {
    root.innerHTML =
      '<p style="color:var(--muted);padding:1rem 0">No review images found. Generate heroes into the review folder first.</p>';
    renderStats();
    return;
  }

  root.innerHTML = cards
    .map((c) => {
      const disabled = busy.has(c.recipeId) ? 'disabled' : '';
      const versionOptions = c.versions
        .map(
          (v) =>
            `<option value="${v.version}" ${
              v.version === c.selectedVersion ? 'selected' : ''
            }>v${v.version} · ${formatDate(v.createdAt)}</option>`,
        )
        .join('');

      return `
      <article class="card ${c.reviewStatus}" data-id="${c.recipeId}">
        <div class="preview">
          ${
            c.previewUrl
              ? `<img src="${c.previewUrl}?t=${Date.now()}" alt="${c.recipeName}" />`
              : `<div class="missing">No preview</div>`
          }
        </div>
        <div class="meta">
          <span class="badge ${c.reviewStatus}">${statusLabel(c.reviewStatus)}</span>
          <h2>${escapeHtml(c.recipeName)}</h2>
          <p class="ids"><code>${c.recipeId}</code> · <code>${c.heroImageKey}</code></p>
          <ul class="facts">
            <li>Generated: <strong>${formatDate(c.generationDate)}</strong></li>
            <li>Prompt version: <strong>${escapeHtml(c.promptVersion)}</strong></li>
            <li>Resolution: <strong>${c.resolution || '—'}</strong></li>
            <li>Est. cost: <strong>${
              c.estimatedCostUsd != null
                ? `$${c.estimatedCostUsd.toFixed(2)}`
                : '—'
            }</strong></li>
          </ul>
          <div class="version-row">
            <label>History</label>
            <select data-action="select-version" data-id="${c.recipeId}" ${disabled}>
              ${versionOptions || '<option value="">—</option>'}
            </select>
          </div>
          <div class="score-row">
            <div class="stars" data-id="${c.recipeId}">${starsHtml(
              c.recipeId,
              c.starScore,
            )}</div>
            <label>
              /100
              <input type="number" min="0" max="100" value="${
                c.pointScore ?? ''
              }" placeholder="0–100"
                data-action="point-score" data-id="${c.recipeId}" ${disabled} />
            </label>
          </div>
          <div class="actions">
            ${
              c.reviewStatus === 'rejected'
                ? `<button type="button" class="reopen" data-action="reopen" data-id="${c.recipeId}" ${disabled}>Reopen</button>`
                : `
              <button type="button" class="approve" data-action="approve" data-id="${c.recipeId}" ${disabled}>Approve</button>
              <button type="button" class="regen" data-action="regenerate" data-id="${c.recipeId}" ${disabled}>Regenerate</button>
              <button type="button" class="reject" data-action="reject" data-id="${c.recipeId}" ${disabled}>Reject</button>
            `
            }
          </div>
        </div>
      </article>`;
    })
    .join('');

  renderStats();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadCards() {
  const includeRejected = $('#show-rejected').checked ? '1' : '0';
  const data = await api(`/api/cards?includeRejected=${includeRejected}`);
  cards = data.cards || [];
  promptVersion = data.promptVersion || promptVersion;
  renderCards();
  fillCompareRecipes();
}

async function withBusy(recipeId, fn) {
  busy.add(recipeId);
  renderCards();
  try {
    await fn();
  } finally {
    busy.delete(recipeId);
    await loadCards();
  }
}

$('#queue').addEventListener('click', async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  if (t.dataset.star) {
    const recipeId = t.dataset.id;
    const starScore = Number(t.dataset.star);
    try {
      await api('/api/score', {
        method: 'POST',
        body: JSON.stringify({ recipeId, starScore }),
      });
      toast(`Saved ★${starScore} for ${recipeId}`);
      await loadCards();
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  const action = t.dataset.action;
  const recipeId = t.dataset.id;
  if (!action || !recipeId) return;

  if (action === 'approve') {
    if (!confirm(`Approve ${recipeId} → production assets?`)) return;
    await withBusy(recipeId, async () => {
      const card = cards.find((c) => c.recipeId === recipeId);
      const result = await api('/api/approve', {
        method: 'POST',
        body: JSON.stringify({
          recipeId,
          version: card?.selectedVersion ?? undefined,
        }),
      });
      toast(result.message || `Approved ${recipeId}`);
    }).catch((err) => toast(err.message, true));
    return;
  }

  if (action === 'reject') {
    if (!confirm(`Reject ${recipeId}? History is kept.`)) return;
    await withBusy(recipeId, async () => {
      const result = await api('/api/reject', {
        method: 'POST',
        body: JSON.stringify({ recipeId }),
      });
      toast(result.message || `Rejected ${recipeId}`);
    }).catch((err) => toast(err.message, true));
    return;
  }

  if (action === 'regenerate') {
    if (
      !confirm(
        `Regenerate ONE new hero for ${recipeId}? Current versions stay in history.`,
      )
    )
      return;
    toast(`Regenerating ${recipeId}…`);
    await withBusy(recipeId, async () => {
      const result = await api('/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({ recipeId }),
      });
      toast(result.message || `Regenerated ${recipeId}`);
    }).catch((err) => toast(err.message, true));
    return;
  }

  if (action === 'reopen') {
    await withBusy(recipeId, async () => {
      await api('/api/reopen', {
        method: 'POST',
        body: JSON.stringify({ recipeId }),
      });
      toast(`Reopened ${recipeId}`);
    }).catch((err) => toast(err.message, true));
  }
});

$('#queue').addEventListener('change', async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLSelectElement) && !(t instanceof HTMLInputElement))
    return;
  const recipeId = t.dataset.id;
  const action = t.dataset.action;
  if (!recipeId || !action) return;

  try {
    if (action === 'select-version') {
      await api('/api/select-version', {
        method: 'POST',
        body: JSON.stringify({ recipeId, version: Number(t.value) }),
      });
      await loadCards();
    }
    if (action === 'point-score' && t.value !== '') {
      await api('/api/score', {
        method: 'POST',
        body: JSON.stringify({
          recipeId,
          pointScore: Number(t.value),
        }),
      });
      toast(`Saved score ${t.value}/100 for ${recipeId}`);
    }
  } catch (err) {
    toast(err.message, true);
  }
});

function fillCompareRecipes() {
  const sel = $('#compare-recipe');
  const prev = sel.value;
  sel.innerHTML = cards
    .filter((c) => c.versions.length > 0)
    .map(
      (c) =>
        `<option value="${c.recipeId}">${c.recipeId} · ${escapeHtml(
          c.recipeName,
        )}</option>`,
    )
    .join('');
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  fillCompareVersions();
}

function fillCompareVersions() {
  const recipeId = $('#compare-recipe').value;
  const card = cards.find((c) => c.recipeId === recipeId);
  const opts = (card?.versions || [])
    .map((v) => `<option value="${v.version}">v${v.version}</option>`)
    .join('');
  $('#compare-a').innerHTML = opts;
  $('#compare-b').innerHTML = opts;
  if (card && card.versions.length >= 2) {
    $('#compare-a').value = String(card.versions[card.versions.length - 2].version);
    $('#compare-b').value = String(card.versions[card.versions.length - 1].version);
  }
  updateCompareImages();
}

function updateCompareImages() {
  const recipeId = $('#compare-recipe').value;
  const a = $('#compare-a').value;
  const b = $('#compare-b').value;
  if (!recipeId || !a || !b) return;
  const bust = Date.now();
  $('#compare-img-a').src = `/api/history/${recipeId}/${a}?t=${bust}`;
  $('#compare-img-b').src = `/api/history/${recipeId}/${b}?t=${bust}`;
}

$('#btn-compare').addEventListener('click', () => {
  fillCompareRecipes();
  $('#compare-dialog').showModal();
});

$('#compare-recipe').addEventListener('change', fillCompareVersions);
$('#compare-a').addEventListener('change', updateCompareImages);
$('#compare-b').addEventListener('change', updateCompareImages);

async function approveFromCompare(which) {
  const recipeId = $('#compare-recipe').value;
  const version = Number(
    which === 'a' ? $('#compare-a').value : $('#compare-b').value,
  );
  if (!recipeId || !version) return;
  if (!confirm(`Approve ${recipeId} v${version} → production?`)) return;
  try {
    const result = await api('/api/approve', {
      method: 'POST',
      body: JSON.stringify({ recipeId, version }),
    });
    toast(result.message || `Approved ${recipeId} v${version}`);
    $('#compare-dialog').close();
    await loadCards();
  } catch (err) {
    toast(err.message, true);
  }
}

$('#approve-a').addEventListener('click', () => approveFromCompare('a'));
$('#approve-b').addEventListener('click', () => approveFromCompare('b'));
$('#btn-refresh').addEventListener('click', () =>
  loadCards().catch((err) => toast(err.message, true)),
);
$('#show-rejected').addEventListener('change', () =>
  loadCards().catch((err) => toast(err.message, true)),
);

loadCards().catch((err) => toast(err.message, true));
