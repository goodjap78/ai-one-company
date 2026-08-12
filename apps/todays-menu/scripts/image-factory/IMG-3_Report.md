# Sprint IMG-3 — Hero Images 001–050 Report

**Date:** 2026-07-14  
**Scope:** recipe IDs `001`–`050` only (051–100 not processed)  
**Result:** **CONDITIONAL PASS** — batch pipeline ready; real generation blocked by missing `IMAGE_API_KEY`

## Provider

| Variable | Value |
| --- | --- |
| `IMAGE_PROVIDER` | `mock` (process env) |
| `IMAGE_API_KEY` | **missing** |
| Gate | `PROVIDER_NOT_CONFIGURED` |

Required:

```env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...
```

No API keys logged. No fake production assets written for 012–050.

## Commands executed

```bash
npm run image-factory:prepare
npm run hero:generate -- --from=001 --to=050 --resume
npm run hero:validate -- --from=001 --to=050
```

Not run into production (no real review batch to approve):

```bash
# After real generate + human review:
npm run hero:approve -- --recipe=011
npm run hero:approve -- --from=001 --to=050 --approved-only
```

## Batch generate summary (001–050)

| Metric | Count |
| --- | ---: |
| Total recipes | 50 |
| Generated (new review) | **0** (provider gate) |
| Skipped | **11** |
| Pending (would generate) | **39** |
| Failed | 0 |
| Approved (existing) | 10 |
| Rejected | 0 |
| Missing production files | 40 |

### Skip reasons

- `001`–`010`: approved (existing Batch 01 production) — **not overwritten**
- `011`: awaiting review (`completed`; legacy candidate exists under review) — not regenerated

### Pending (queued) when credentials available

`012`–`050` (39 recipes)

## Engine capabilities added (IMG-3)

| Feature | Support |
| --- | --- |
| `--from` / `--to` range | yes |
| `--resume` | yes (queued + failed + stuck processing) |
| Batches of 5 | yes |
| Concurrency 2 | yes |
| Fail-one continues | yes |
| Review-only until approve | yes |
| `hero:approve -- --recipe=011` | yes |
| `hero:approve -- --from=001 --to=050 --approved-only` | yes (promotes `completed` only) |
| `recipeImageMap` update on approve | yes (mapping only; no recipe body edits) |
| `hero:validate -- --from=001 --to=050` | yes |
| Dashboard scoped metrics | yes → `generated/image-factory/dashboard.md` |

## Approval / registry

| Item | Status |
| --- | --- |
| New approvals this run | 0 |
| Registry updates | 0 |
| recipeImageMap updates | 0 |

## Validation (001–050)

| Check | Result |
| --- | --- |
| Structural validation | **PASS** |
| Duplicate heroImageKey | 0 |
| Filename collisions | 0 |
| Registry gaps (approved) | 0 |
| TypeScript | **PASS** |
| Missing production (expected) | 40 |

## Dashboard

Updated: `generated/image-factory/dashboard.md`

Shows for 001–050: total 50, existing, queued, processing, awaiting review, approved, rejected, failed, missing, completion %.

## Review queue contract

Path: `generated/image-factory/review/`

Each review package includes recipe ID, name, preview (`{id}-{key}.jpg` / legacy candidate), prompt used, status, and Approve / Reject / Regenerate CLI actions in `index.html`.

Rejected / unreviewed images are **not** copied to `assets/meals/`.

## PASS / FAIL

| Layer | Verdict |
| --- | --- |
| Range safety (no 051+) | **PASS** |
| Skip approved / existing / completed | **PASS** |
| Batch + concurrency + resume CLI | **PASS** |
| No overwrite without `--force` | **PASS** |
| Validation PASS | **PASS** |
| Real AI heroes for 012–050 | **BLOCKED** — set `.env` then re-run generate |

**Overall: CONDITIONAL PASS**

### Next step

```bash
# apps/todays-menu/.env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...

npm run hero:generate -- --from=001 --to=050 --resume
# review generated/image-factory/review/index.html
npm run hero:approve -- --from=001 --to=050 --approved-only
npm run hero:validate -- --from=001 --to=050
```
