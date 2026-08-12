# Sprint IMG-2B — End-to-End Hero Image Test Report

**Recipe:** `003` 김치찌개 (`heroImageKey: kimchi_stew`)  
**Date:** 2026-07-14  
**Result:** **CONDITIONAL PASS** (pipeline + safety + app wiring) / **generation blocked**

## Provider status

| Variable | Observed | Notes |
| --- | --- | --- |
| `IMAGE_PROVIDER` | `mock` (process env; no `.env` file) | Present but not a real photo provider |
| `IMAGE_API_KEY` | **missing** | Required for `hero:generate` |

**Gate result:** `PROVIDER_NOT_CONFIGURED`

Required `.env` (apps/todays-menu/.env):

```env
IMAGE_PROVIDER=openai
IMAGE_API_KEY=sk-...
```

No API keys were logged. No fake production images were written.

## Commands executed

```bash
npm run hero:generate -- --recipe=003
npm run hero:approve -- --recipe=003
npm run hero:validate -- --recipe=003
```

Only recipe **003** was processed. Recipes 001–002 and 004+ were not touched. Existing `assets/meals/kimchi_stew.jpg` was **not** overwritten (no `--force`).

## Generated file path

| Path | Status |
| --- | --- |
| `generated/image-factory/review/003-kimchi-stew.jpg` | **Not created** (provider not configured) |
| `assets/meals/kimchi_stew.jpg` | Unchanged (existing Batch 01 asset) |

## Approval status

- `npm run hero:approve -- --recipe=003` → **approved** via existing production file path
- Queue status for 003: `approved`
- Did not copy a new review candidate (none existed)

## Registry update status

- `mealImageAssets.ts`: **unchanged** (`Registry updated: false`)
- Key already present: `kimchi_stew: require('../../assets/meals/kimchi_stew.jpg')`
- Static require path valid

## App connection status

`npm run hero:validate -- --recipe=003` → **PASS**

| Check | Result |
| --- | --- |
| image file exists | PASS (`assets/meals/kimchi_stew.jpg`) |
| aspect / geometry | PASS (`1619x971`, PNG-bytes-named-jpg warn — legacy) |
| registry key | PASS |
| require path matches filename | PASS |
| recipeImageMap → local `kimchi_stew` | PASS |
| TypeScript (`tsc --noEmit`) | PASS |

## Pipeline verification (003)

```
Recipe data 003
 → hero manifest (hero-images.json)
 → prompt (generated/image-factory/prompts/kimchi_stew.md)
 → image queue (scoped --recipe=003)
 → provider gate → PROVIDER_NOT_CONFIGURED (stopped safely)
 → (skipped) generated review image
 → approve uses existing assets/meals/kimchi_stew.jpg
 → mealImageAssets.ts already wired
 → app display via recipeImageMap + MEAL_LOCAL_IMAGES
```

## Engine changes (IMG-2B)

- `hero:generate -- --recipe=003` single-recipe filter
- Review path: `generated/image-factory/review/{id}-{key}.jpg` (no production write on generate)
- Provider gate requires **both** `IMAGE_PROVIDER` and `IMAGE_API_KEY`
- Safe stop: exit 0, recipe returned to `queued`, no fake assets
- `hero:approve -- --recipe=003` defaults to `approve`
- `hero:validate -- --recipe=003` scoped checks
- Never overwrite production without `--force`

## PASS / FAIL

| Layer | Verdict |
| --- | --- |
| Safe stop without API key | **PASS** |
| Single-recipe scoping | **PASS** |
| No overwrite / no fake production | **PASS** |
| Approval + registry + app wiring (legacy asset) | **PASS** |
| New AI review image `003-kimchi-stew.jpg` | **FAIL / blocked** — set `IMAGE_PROVIDER=openai` + `IMAGE_API_KEY` then re-run generate |

**Overall:** **CONDITIONAL PASS** — E2E automation and safety verified; real image generation pending API credentials.
