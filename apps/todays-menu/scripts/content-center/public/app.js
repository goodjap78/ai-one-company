/** HANKKI Content Center — client UI (CONTENT-CENTER-1 / REVIEW-2) */

let filter = 'all';
let selectedId = null;
let recipes = [];
let summary = null;
let scale = null;
let production = null;
let busy = false;
let detailRecipe = null;
let feedbackOptions = [
  { id: 'food_too_small', label: '음식이 너무 작음' },
  { id: 'too_much_margin', label: '여백이 너무 많음' },
  { id: 'too_many_sides', label: '반찬이 너무 많음' },
  { id: 'too_dark', label: '이미지가 너무 어두움' },
  { id: 'not_centered', label: '음식이 중앙에 없음' },
  { id: 'not_realistic', label: '실사 느낌이 부족함' },
  { id: 'other', label: '기타 의견' },
];

const $ = (sel) => document.querySelector(sel);

function toast(message, isError = false) {
  const el = $('#toast');
  el.hidden = false;
  el.textContent = message;
  el.style.borderColor = isError ? '#d47171' : '#2c3527';
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(s) {
  if (s === 'ready') return 'Ready';
  if (s === 'review_needed') return 'Review needed';
  if (s === 'missing_assets') return 'Missing assets';
  if (s === 'pending_review') return 'Pending Review';
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  if (s === 'missing') return 'Missing';
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

function collectFeedback() {
  const ids = [...document.querySelectorAll('.feedback-opt:checked')].map(
    (el) => el.value,
  );
  const otherText = ($('#feedback-other')?.value || '').trim();
  return { feedbackIds: ids, otherText };
}

/** Next recipe in the current filtered list (capture before list refresh). */
function findNextRecipeId(currentId) {
  const idx = recipes.findIndex((r) => r.recipeId === currentId);
  if (idx < 0) return null;
  if (idx + 1 < recipes.length) return recipes[idx + 1].recipeId;
  return null;
}

/**
 * After approve/reject: refresh list stats, then open the next recipe
 * without dumping the reviewer back to an empty detail pane.
 */
async function goToNextRecipe(currentId) {
  const nextId = findNextRecipeId(currentId);
  await loadList();
  if (nextId) {
    await loadDetail(nextId);
    return nextId;
  }
  if (recipes.length > 0) {
    await loadDetail(recipes[0].recipeId);
    toast('Queue end — opened first remaining recipe in this filter');
    return recipes[0].recipeId;
  }
  selectedId = null;
  renderList();
  renderDetail(null);
  toast('No more recipes in this filter');
  return null;
}

function openCompare(recipe) {
  const versions = recipe?.hero?.versions || [];
  if (versions.length < 2) {
    toast('비교하려면 버전이 2개 이상 필요합니다.', true);
    return;
  }
  const opts = versions
    .map(
      (v) =>
        `<option value="${v.version}">v${v.version} · ${escapeHtml(
          v.filename,
        )}</option>`,
    )
    .join('');
  $('#compare-a').innerHTML = opts;
  $('#compare-b').innerHTML = opts;
  $('#compare-a').value = String(versions[versions.length - 2].version);
  $('#compare-b').value = String(versions[versions.length - 1].version);
  updateCompareImages(recipe.recipeId);
  $('#compare-dialog').showModal();
}

function updateCompareImages(recipeId) {
  const a = $('#compare-a').value;
  const b = $('#compare-b').value;
  const bust = Date.now();
  $('#compare-cap-a').textContent = `A · v${a}`;
  $('#compare-cap-b').textContent = `B · v${b}`;
  $('#compare-img-a').src = `/api/history/${recipeId}/${a}?t=${bust}`;
  $('#compare-img-b').src = `/api/history/${recipeId}/${b}?t=${bust}`;
}

function renderScale() {
  const root = $('#scale');
  if (!root) return;
  if (!production) {
    root.innerHTML = '';
    return;
  }
  const p = production;
  root.innerHTML = `
    <div class="scale-card">
      <h3>Approved Hero Images</h3>
      <div class="count">${p.approvedHeroImages} / ${p.heroTarget}</div>
    </div>
    <div class="scale-card">
      <h3>Approved Ingredient Icons</h3>
      <div class="count">${p.approvedIngredientIcons} / ${p.ingredientTarget}</div>
    </div>
    <div class="scale-card">
      <h3>Remaining</h3>
      <div class="count">${p.remaining}</div>
    </div>`;
}

function renderSummary() {
  if (!summary) return;
  $('#summary').innerHTML = `
    <div class="stat"><span>Total recipes</span><strong>${summary.totalRecipes}</strong></div>
    <div class="stat"><span>Ready</span><strong>${summary.readyRecipes}</strong></div>
    <div class="stat"><span>Review needed</span><strong>${summary.reviewNeeded}</strong></div>
    <div class="stat"><span>Missing Hero</span><strong>${summary.missingHeroImages}</strong></div>
    <div class="stat"><span>Missing ingredient icons</span><strong>${summary.missingIngredientIcons}</strong></div>
    <div class="stat"><span>Prompt</span><strong>${escapeHtml(summary.promptVersion)}</strong></div>
  `;
}

function renderList() {
  const root = $('#recipe-list');
  root.innerHTML = recipes
    .map(
      (r) => `
    <button type="button" class="recipe-item ${
      r.recipeId === selectedId ? 'active' : ''
    }" data-id="${r.recipeId}" role="listitem">
      <span class="id">${r.recipeId}</span>
      <strong>${escapeHtml(r.recipeName)}</strong>
      <span class="badge ${r.listStatus}">${statusLabel(r.listStatus)}</span>
    </button>`,
    )
    .join('');
}

function renderDetail(recipe) {
  const pane = $('#detail');
  detailRecipe = recipe;
  if (!recipe) {
    pane.innerHTML = '<p class="empty">Select a recipe from the list.</p>';
    return;
  }

  const h = recipe.hero;
  const versionOptions = (h.versions || [])
    .map(
      (v) =>
        `<option value="${v.version}" ${
          v.version === h.currentVersion ? 'selected' : ''
        }>v${v.version} · ${escapeHtml(v.filename)}</option>`,
    )
    .join('');

  const versionList = (h.versions || [])
    .map(
      (v) => `
      <li class="${v.version === h.currentVersion ? 'current' : ''}">
        <span>v${v.version} · ${escapeHtml(v.filename)}</span>
        <span>${v.version === h.currentVersion ? '선택됨' : ''}</span>
      </li>`,
    )
    .join('');

  const feedbackChecks = feedbackOptions
    .map(
      (o) => `
      <label>
        <input type="checkbox" class="feedback-opt" value="${escapeHtml(
          o.id,
        )}" ${busy ? 'disabled' : ''} />
        <span>${escapeHtml(o.label)}</span>
      </label>`,
    )
    .join('');

  const canAct =
    h.status === 'pending_review' ||
    h.status === 'approved' ||
    (h.versions && h.versions.length > 0);

  pane.innerHTML = `
    <div class="detail-grid">
      <section class="info-card">
        <h2>${escapeHtml(recipe.recipeName)}</h2>
        <span class="badge ${recipe.readinessStatus}">${statusLabel(
          recipe.readinessStatus,
        )}</span>
        <ul class="facts" style="margin-top:0.75rem">
          <li>ID: <strong>${recipe.recipeId}</strong></li>
          <li>Hero image key: <strong>${escapeHtml(
            recipe.heroImageKey,
          )}</strong></li>
          <li>Ingredient count: <strong>${recipe.ingredientCount}</strong></li>
          <li>Recipe data valid: <strong>${
            recipe.recipeDataValid ? 'yes' : 'no'
          }</strong></li>
          <li>Hero approved: <strong>${
            recipe.heroApproved ? 'yes' : 'no'
          }</strong></li>
          <li>Ingredients OK: <strong>${
            recipe.ingredientsOk ? 'yes' : 'no'
          }</strong></li>
        </ul>
        ${
          recipe.validationIssues?.length
            ? `<details style="margin-top:0.75rem"><summary>Validation issues</summary><ul>${recipe.validationIssues
                .map((i) => `<li>${escapeHtml(i)}</li>`)
                .join('')}</ul></details>`
            : ''
        }
      </section>

      <section class="hero-card">
        <h3>Hero image</h3>
        <div class="hero-preview">
          ${
            h.previewUrl
              ? `<img src="${h.previewUrl}?t=${Date.now()}" alt="${escapeHtml(
                  recipe.recipeName,
                )}" />`
              : `<div class="missing">No review image</div>`
          }
        </div>
        <ul class="facts">
          <li>Status: <strong>${statusLabel(h.status)}</strong></li>
          <li>Current version: <strong>${
            h.currentVersion != null ? `v${h.currentVersion}` : '—'
          }</strong></li>
          <li>Generated: <strong>${formatDate(h.generationDate)}</strong></li>
          <li>Resolution: <strong>${h.resolution || '—'}</strong></li>
          <li>Prompt: <strong>${escapeHtml(h.promptVersion)}</strong></li>
          <li>Production: <strong>${escapeHtml(h.productionPath)}</strong> (${
            h.productionExists ? 'exists' : 'missing'
          })</li>
        </ul>
        <div class="version-row">
          <label>Version</label>
          <select id="version-select" ${busy ? 'disabled' : ''}>
            ${versionOptions || '<option value="">—</option>'}
          </select>
        </div>
        <ul class="version-list">${versionList || '<li>히스토리 없음</li>'}</ul>

        <div class="feedback-box">
          <h4>다시 생성 피드백 (다중 선택)</h4>
          <div class="feedback-options">${feedbackChecks}</div>
          <div class="feedback-other">
            <label for="feedback-other">기타 요청</label>
            <textarea id="feedback-other" placeholder="추가 요청을 입력하세요" ${
              busy ? 'disabled' : ''
            }></textarea>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="ghost" id="btn-compare" ${
            busy || !(h.versions && h.versions.length > 1) ? 'disabled' : ''
          }>비교</button>
          <button type="button" class="approve" id="btn-approve" ${
            busy || !canAct ? 'disabled' : ''
          }>승인</button>
          <button type="button" class="approve" id="btn-approve-next" ${
            busy || !canAct ? 'disabled' : ''
          }>Approve &amp; Next</button>
          <button type="button" class="regen" id="btn-regen" ${
            busy ? 'disabled' : ''
          }>다시 생성</button>
          <button type="button" class="reject" id="btn-reject" ${
            busy || !canAct ? 'disabled' : ''
          }>제외</button>
          <button type="button" class="reject" id="btn-reject-next" ${
            busy || !canAct ? 'disabled' : ''
          }>Reject &amp; Next</button>
        </div>
      </section>

      <section class="ing-card">
        <h3>Ingredient icons</h3>
        <p class="sub" style="margin-bottom:0.75rem">
          Status only — generation is not available from this screen.
        </p>
        <table class="ing-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Name</th>
              <th>iconKey</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${recipe.ingredients
              .map(
                (ing) => `
              <tr>
                <td>
                  ${
                    ing.previewUrl
                      ? `<img class="icon-thumb" src="${ing.previewUrl}?t=${Date.now()}" alt="" />`
                      : `<div class="icon-placeholder">n/a</div>`
                  }
                </td>
                <td>${escapeHtml(ing.name)}</td>
                <td><code>${escapeHtml(ing.iconKey || '—')}</code></td>
                <td><span class="status-pill ${ing.status}">${
                  ing.status
                }</span></td>
                <td>
                  ${
                    ing.status === 'review'
                      ? `<button type="button" class="approve" data-ing-approve="${escapeHtml(
                          ing.iconKey,
                        )}" ${busy ? 'disabled' : ''}>Approve</button>`
                      : ''
                  }
                </td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </section>
    </div>
  `;

  pane.querySelectorAll('[data-ing-approve]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const iconKey = btn.getAttribute('data-ing-approve');
      if (!iconKey) return;
      if (
        !confirm(
          `Approve ingredient icon "${iconKey}" → assets/ingredients/${iconKey}.png?`,
        )
      )
        return;
      busy = true;
      try {
        const result = await api('/api/ingredient-approve', {
          method: 'POST',
          body: JSON.stringify({ iconKey }),
        });
        toast(result.message || `Approved ${iconKey}`);
        await refreshAll(recipe.recipeId);
      } catch (err) {
        toast(err.message, true);
      } finally {
        busy = false;
      }
    });
  });

  $('#version-select')?.addEventListener('change', async (e) => {
    const version = Number(e.target.value);
    try {
      await api('/api/select-version', {
        method: 'POST',
        body: JSON.stringify({ recipeId: recipe.recipeId, version }),
      });
      await loadDetail(recipe.recipeId);
    } catch (err) {
      toast(err.message, true);
    }
  });

  $('#btn-compare')?.addEventListener('click', () => openCompare(recipe));

  async function approveCurrent(andNext) {
    const version = Number($('#version-select')?.value || h.currentVersion);
    const result = await api('/api/approve', {
      method: 'POST',
      body: JSON.stringify({
        recipeId: recipe.recipeId,
        version: Number.isFinite(version) ? version : undefined,
      }),
    });
    toast(result.message || '승인됨');
    if (andNext) {
      await goToNextRecipe(recipe.recipeId);
    } else {
      await refreshAll(recipe.recipeId);
    }
  }

  async function rejectCurrent(andNext) {
    const result = await api('/api/reject', {
      method: 'POST',
      body: JSON.stringify({ recipeId: recipe.recipeId }),
    });
    toast(result.message || '제외됨');
    if (andNext) {
      await goToNextRecipe(recipe.recipeId);
    } else {
      await refreshAll(recipe.recipeId);
    }
  }

  $('#btn-approve')?.addEventListener('click', async () => {
    if (
      !confirm(
        `승인: ${recipe.recipeId} 선택 버전 → ${h.productionPath}?`,
      )
    )
      return;
    busy = true;
    try {
      await approveCurrent(false);
    } catch (err) {
      toast(err.message, true);
    } finally {
      busy = false;
    }
  });

  $('#btn-approve-next')?.addEventListener('click', async () => {
    busy = true;
    try {
      await approveCurrent(true);
    } catch (err) {
      toast(err.message, true);
      await loadDetail(recipe.recipeId);
    } finally {
      busy = false;
    }
  });

  $('#btn-reject')?.addEventListener('click', async () => {
    if (!confirm(`제외: ${recipe.recipeId}? 히스토리는 유지됩니다.`)) return;
    busy = true;
    try {
      await rejectCurrent(false);
    } catch (err) {
      toast(err.message, true);
    } finally {
      busy = false;
    }
  });

  $('#btn-reject-next')?.addEventListener('click', async () => {
    busy = true;
    try {
      await rejectCurrent(true);
    } catch (err) {
      toast(err.message, true);
      await loadDetail(recipe.recipeId);
    } finally {
      busy = false;
    }
  });

  $('#btn-regen')?.addEventListener('click', async () => {
    const { feedbackIds, otherText } = collectFeedback();
    if (
      !confirm(
        `다시 생성: ${recipe.recipeId} (선택 피드백 ${feedbackIds.length}개, 스타일 v1.1). 이전 버전은 유지됩니다.`,
      )
    )
      return;
    busy = true;
    toast(`다시 생성하는 중… ${recipe.recipeId}`);
    renderDetail(recipe);
    try {
      const result = await api('/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          recipeId: recipe.recipeId,
          feedbackIds,
          otherText,
        }),
      });
      const appendHint = result.feedbackAppend
        ? ` · feedback in prompt`
        : '';
      toast((result.message || '생성됨') + appendHint);
      await refreshAll(recipe.recipeId);
    } catch (err) {
      toast(err.message, true);
      await loadDetail(recipe.recipeId);
    } finally {
      busy = false;
    }
  });
}

async function loadList() {
  const [data, scaleData] = await Promise.all([
    api(`/api/recipes?filter=${encodeURIComponent(filter)}`),
    api('/api/scale-progress'),
  ]);
  recipes = data.recipes || [];
  summary = data.summary;
  scale = scaleData.progress || null;
  production = scaleData.production || null;
  renderScale();
  renderSummary();
  renderList();
}

async function loadDetail(recipeId) {
  selectedId = recipeId;
  renderList();
  const data = await api(`/api/recipes/${recipeId}`);
  renderDetail(data.recipe);
}

async function refreshAll(keepId) {
  await loadList();
  if (keepId) await loadDetail(keepId);
}

$('#filters').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  [...$('#filters').querySelectorAll('button')].forEach((b) =>
    b.classList.toggle('active', b === btn),
  );
  await loadList();
  if (selectedId) await loadDetail(selectedId);
});

$('#recipe-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  await loadDetail(btn.dataset.id);
});

$('#btn-refresh')?.addEventListener('click', async () => {
  await refreshAll(selectedId);
  toast('Refreshed');
});

$('#compare-a')?.addEventListener('change', () => {
  if (detailRecipe) updateCompareImages(detailRecipe.recipeId);
});
$('#compare-b')?.addEventListener('change', () => {
  if (detailRecipe) updateCompareImages(detailRecipe.recipeId);
});

(async function init() {
  try {
    const fb = await api('/api/regen-feedback-options');
    if (fb.options?.length) feedbackOptions = fb.options;
  } catch {
    /* keep defaults */
  }
  await loadList();
})();
