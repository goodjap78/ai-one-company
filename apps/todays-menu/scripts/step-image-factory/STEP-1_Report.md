# Sprint STEP-1 — Cooking Step Image Factory Report

**Date:** 2026-07-14  
**Scope:** recipes `001`–`050`  
**Result:** **CONDITIONAL PASS** — factory prepared + validated; real generation blocked by missing `IMAGE_API_KEY`

## Queue report

| Metric | Count |
| --- | ---: |
| Total step images needed | **202** |
| Approved | **0** |
| Existing unregistered | **0** |
| Queued (missing) | **202** |
| Unresolved | **0** |

## Five-image smoke test

Keys:

- `kimchi_stew_step_01` … `_04`
- `jaeyuk_step_01`

| Metric | Value |
| --- | --- |
| Provider gate | `PROVIDER_NOT_CONFIGURED` |
| Generated | **0** |
| Status | pending / queued (safe stop) |

Did **not** approve placeholders. Did **not** continue full `--resume` with fake images.

## Commands executed

```bash
npm run step:queue -- --from=001 --to=050 --missing-only
npm run step:generate -- --keys=kimchi_stew_step_01,kimchi_stew_step_02,kimchi_stew_step_03,kimchi_stew_step_04,jaeyuk_step_01
npm run step:validate -- --from=001 --to=050
```

`npm run step:approve -- --approved-only` skipped (nothing in `completed` review).

## Final report

| Metric | Value |
| --- | ---: |
| Total step images needed | 202 |
| Generated | 0 |
| Approved | 0 |
| Rejected | 0 |
| Failed | 0 |
| Unresolved | 0 |
| Registry updates | 0 |
| Recipe coverage (assets) | 0% |
| Overall completion | 0% |
| Validation | **PASS** (structural; text-only fallback OK) |
| **Recipes 051–100 can begin?** | **NO** — finish 001–050 step generate → review → approve first |

## Artifacts

| Path | Role |
| --- | --- |
| `generated/step-image-factory/step-images.json` | Manifest |
| `generated/step-image-factory/image-queue.json` | Queue |
| `generated/step-image-factory/prompts/` | Per-step prompts |
| `generated/step-image-factory/review/index.html` | Review UI |
| `generated/step-image-factory/dashboard.md` | Dashboard |
| `scripts/step-image-factory/` | Factory engine |

## Engine features

- Collects steps with recipeId, order, title, instruction, imageKey, visible / not-yet ingredients
- Prompt includes now-happening, visible, not-yet, cookware, camera composition (16:9)
- Batches of **5**, concurrency **2**, fail-one-continues, `--resume` / `--missing-only`
- Review-only until `step:approve`
- Registry via static `require()` (alphabetical)
- Missing images → Recipe Detail text-only step card (by design)
- No UI / recipe data / hero / ingredient changes

## Unblock

```env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...
```

```bash
npm run step:generate -- --keys=kimchi_stew_step_01,kimchi_stew_step_02,kimchi_stew_step_03,kimchi_stew_step_04,jaeyuk_step_01
# review → approve each or:
npm run step:approve -- --approved-only
npm run step:validate -- --from=001 --to=050
# if five PASS:
npm run step:generate -- --from=001 --to=050 --missing-only --resume
```
