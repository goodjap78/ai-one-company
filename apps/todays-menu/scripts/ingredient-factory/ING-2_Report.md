# Sprint ING-2 — Generate All Missing Ingredient Images

**Date:** 2026-07-14  
**Scope:** recipes `001`–`050`  
**Result:** **CONDITIONAL PASS** — missing queue + pipeline ready; generation blocked by `PROVIDER_NOT_CONFIGURED`

## Queue report (`--missing-only`)

| Metric | Count |
| --- | ---: |
| Total unique ingredients | **42** |
| Approved | **0** |
| Existing (unregistered) | **0** |
| Queued (missing) | **42** |
| Unresolved aliases | **0** |

Duplicates removed via unique `iconKey`. Approved/registered assets would be skipped (none present yet).

## Generation

```bash
npm run ingredient:queue -- --from=001 --to=050 --missing-only
npm run ingredient:generate -- --from=001 --to=050 --missing-only --resume
```

| Metric | Count |
| --- | ---: |
| Generated (review) | **0** |
| Approved | **0** |
| Rejected | **0** |
| Failed | **0** |
| Registry updates | **0** |

**Provider:** `IMAGE_PROVIDER=mock`, `IMAGE_API_KEY` missing → **`PROVIDER_NOT_CONFIGURED`**  
No review previews written. No production copies. No fake assets.

`npm run ingredient:approve -- --approved-only` **not run** (nothing in `completed` review state).

## Validation

```bash
npm run ingredient:validate -- --from=001 --to=050
```

| Check | Result |
| --- | --- |
| Structural / resolve-safe | **PASS** |
| Unresolved (fallback chain) | 0 |
| Duplicate iconKeys | 0 |
| TypeScript | PASS |
| Recipe coverage (approved assets) | **0%** (0/50 — no PNGs yet) |
| Overall completion | **0%** |

## Dashboard

Updated: `generated/ingredient-factory/dashboard.md`

Shows: total unique, approved, awaiting review, rejected, failed, unresolved, recipe coverage %, overall completion %.

## Review UI

Updated: `generated/ingredient-factory/review/index.html`  
Cards expose: name, iconKey, preview, prompt, recipes, approve / reject / regenerate, status.  
Rejected images stay outside `assets/ingredients/`.

## Final counts

| Metric | Value |
| --- | ---: |
| Generated | 0 |
| Approved | 0 |
| Rejected | 0 |
| Failed | 0 |
| Unresolved aliases | 0 |
| Registry updates | 0 |
| Recipe coverage (assets) | 0% |
| Validation | **PASS** (structural) |
| **Step Image Factory can begin?** | **NO** — wait until missing ingredients are generated, reviewed, approved, and coverage validates with real assets |

## Unblock generation

```env
# apps/todays-menu/.env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...
```

```bash
npm run ingredient:generate -- --from=001 --to=050 --missing-only --resume
# review generated/ingredient-factory/review/index.html
npm run ingredient:approve -- --approved-only
npm run ingredient:validate -- --from=001 --to=050
```

When validation shows high approved coverage and PASS with real files, Step Image Factory may begin.
