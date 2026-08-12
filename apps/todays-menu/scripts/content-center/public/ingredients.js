/** Ingredient Library — review + Approve All (ingredients only). */

let filter = 'all';
let cards = [];
let summary = null;
let busy = false;

function toast(message, isError = false) {
  const el = document.querySelector('#toast');
  el.hidden = false;
  el.textContent = message;
  el.style.borderColor = isError ? '#d47171' : '#2c3527';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 4200);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(s) {
  if (s === 'review') return 'review';
  if (s === 'exists') return 'approved';
  if (s === 'missing') return 'missing';
  return s;
}

function visibleCards() {
  if (filter === 'all') return cards;
  return cards.filter((c) => c.status === filter);
}

function render() {
  const list = visibleCards();
  const reviewCount =
    summary?.review ?? cards.filter((c) => c.status === 'review').length;

  document.querySelector('#stats').innerHTML = `
    <span>Total <strong>${summary?.total ?? cards.length}</strong></span>
    <span>Review <strong>${reviewCount}</strong></span>
    <span>Approved <strong>${summary?.exists ?? 0}</strong></span>
    <span>Missing <strong>${summary?.missing ?? 0}</strong></span>
    <span>Showing <strong>${list.length}</strong></span>
  `;

  document.querySelector('#meta').textContent =
    reviewCount > 0
      ? `${reviewCount} reviewed icon(s) ready — use Approve All to promote to assets/ingredients/`
      : 'No reviewed icons awaiting approval';

  const approveAllBtn = document.querySelector('#btn-approve-all');
  approveAllBtn.disabled = busy || reviewCount === 0;

  document.querySelector('#grid').innerHTML = list
    .map((c) => {
      const preview = c.previewUrl
        ? `<img src="${c.previewUrl}?t=${Date.now()}" alt="${escapeHtml(
            c.koreanName,
          )}" />`
        : `<div style="color:#888">No preview</div>`;
      const approveBtn =
        c.status === 'review'
          ? `<button type="button" class="approve" data-approve="${escapeHtml(
              c.iconKey,
            )}" ${busy ? 'disabled' : ''}>Approve</button>`
          : '';
      return `
      <article class="ing-card">
        <div class="shot">${preview}</div>
        <div class="body">
          <span class="status-pill ${c.status}">${statusLabel(c.status)}</span>
          <h2>${escapeHtml(c.koreanName)}</h2>
          <p class="ids"><code>${escapeHtml(c.iconKey)}</code></p>
          <p class="ids">${escapeHtml(c.productionRelative)}</p>
          <div class="card-actions">${approveBtn}</div>
        </div>
      </article>`;
    })
    .join('');

  document.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const iconKey = btn.getAttribute('data-approve');
      if (!iconKey || busy) return;
      busy = true;
      try {
        const res = await fetch('/api/ingredient-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iconKey }),
        });
        const data = await res.json();
        if (!res.ok || data.ok === false) {
          throw new Error(data.message || `Approve failed (${res.status})`);
        }
        toast(data.message || `Approved ${iconKey}`);
        await load();
      } catch (err) {
        toast(err.message, true);
      } finally {
        busy = false;
        render();
      }
    });
  });
}

async function load() {
  const res = await fetch('/api/ingredient-reviews?all=1');
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || 'Failed to load Ingredient Library');
  }
  cards = data.cards || [];
  summary = data.summary || null;
  render();
}

document.querySelector('#filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  [...document.querySelectorAll('#filters button')].forEach((b) =>
    b.classList.toggle('active', b === btn),
  );
  render();
});

document.querySelector('#btn-refresh').addEventListener('click', () =>
  load().catch((err) => toast(err.message, true)),
);

document.querySelector('#btn-approve-all').addEventListener('click', async () => {
  const reviewCount = cards.filter((c) => c.status === 'review').length;
  if (reviewCount === 0 || busy) return;
  if (
    !confirm(
      `Approve All: promote ${reviewCount} reviewed ingredient icon(s) → assets/ingredients/?\n\nHero Images are not affected.`,
    )
  )
    return;

  busy = true;
  render();
  toast(`Approving ${reviewCount} ingredient icons…`);
  try {
    const res = await fetch('/api/ingredient-approve-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok && !(data.promoted && data.promoted.length)) {
      throw new Error(data.message || `Approve All failed (${res.status})`);
    }
    const failed = (data.failed || []).length;
    toast(
      failed
        ? `${data.message} · failed: ${data.failed.join(', ')}`
        : data.message || 'Approve All complete',
      failed > 0,
    );
    await load();
  } catch (err) {
    toast(err.message, true);
  } finally {
    busy = false;
    render();
  }
});

load().catch((err) => toast(err.message, true));
