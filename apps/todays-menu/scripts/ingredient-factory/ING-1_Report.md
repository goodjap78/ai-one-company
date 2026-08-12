# Sprint ING-1 — Ingredient Image Factory Report

**Date:** 2026-07-14  
**Scope:** recipes `001`–`050`  
**Result:** **CONDITIONAL PASS** — factory prepared + validated; real generation blocked by missing `IMAGE_API_KEY`

## Summary

| Metric | Value |
| --- | ---: |
| Total unique ingredients | **42** |
| Reused across ≥2 recipes | **38** |
| Generated (review) | **0** |
| Approved | **0** |
| Failed | **0** |
| Unresolved (resolution chain) | **0** |
| Registry updates | **0** |
| Recipe coverage (safe resolve) | **100%** |
| Structural validation | **PASS** |

## Provider

| Variable | Status |
| --- | --- |
| `IMAGE_PROVIDER` | `mock` (process env) |
| `IMAGE_API_KEY` | **missing** |
| Gate | `PROVIDER_NOT_CONFIGURED` |

Required in `apps/todays-menu/.env`:

```env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...
```

No fake production PNGs were written. No API keys logged.

## Commands executed

```bash
npm run ingredient:queue -- --from=001 --to=050
npm run ingredient:generate -- --keys=onion,green_onion,garlic,pork,egg
npm run ingredient:validate -- --from=001 --to=050
```

Five-item smoke test (`onion`, `green_onion`, `garlic`, `pork`, `egg`) stopped safely at provider gate — **did not** approve placeholders or continue full `--resume` generation.

## First test (5 keys)

| Key | Korean | Status after generate attempt |
| --- | --- | --- |
| onion | 양파 | pending / queued |
| green_onion | 대파 | pending / queued |
| garlic | 다진마늘 | pending / queued |
| pork | 돼지고기 | pending / queued |
| egg | 계란 | pending / queued |

Next (when credentials exist):

```bash
npm run ingredient:generate -- --keys=onion,green_onion,garlic,pork,egg
# review generated/ingredient-factory/review/index.html
npm run ingredient:approve -- --key=onion
# … or after reviewing all five:
npm run ingredient:approve -- --approved-only
npm run ingredient:validate -- --from=001 --to=050
# if PASS:
npm run ingredient:generate -- --missing-only --resume
```

## Artifacts

| Path | Role |
| --- | --- |
| `generated/ingredient-factory/ingredient-images.json` | Unique iconKey manifest |
| `generated/ingredient-factory/image-queue.json` | Generation queue |
| `generated/ingredient-factory/prompts/` | Per-key prompt markdown |
| `generated/ingredient-factory/review/` | Preview + approve/reject/regenerate UI |
| `generated/ingredient-factory/dashboard.md` | Live dashboard |
| `scripts/ingredient-factory/` | Factory engine |

## Engine features

- Alias-normalized unique `iconKey` collection (달걀/계란→egg, 파/대파→green_onion, 다진 마늘→garlic, 돼지 앞다리살→pork, 국간장/진간장→soy_sauce, …)
- One image shared across all recipes using the same key
- Status: approved / existing_unregistered / queued / missing / failed / completed / rejected
- Batches of **10**, concurrency **2**, fail-one-continues, `--resume` / `--missing-only`
- Review-only until `ingredient:approve`
- Registry via static `require()` (alphabetical, no duplicates)
- Resolution order verified: explicit iconKey → name → alias → category fallback → generic
- No UI / recipe data changes

## Validation (001–050)

| Check | Result |
| --- | --- |
| Duplicate iconKeys | PASS (0) |
| Casing / key pattern | PASS |
| Broken approved images | PASS (n/a) |
| Recipe ingredient resolves safely | PASS (0 unresolved) |
| TypeScript | PASS |

## PASS / FAIL

| Layer | Verdict |
| --- | --- |
| Collect + queue + prompts + dashboard | **PASS** |
| Five-item provider smoke (safe stop) | **PASS** |
| Real generate → approve → registry | **BLOCKED** (no API key) |
| Overall | **CONDITIONAL PASS** |
