# Architecture Validation — AI Image Production Engine

**Sprint:** IMG-2A (Validate Architecture)  
**Date:** 2026-07-14  
**Scope:** Validate complete Hero Image Production flow — **no image generation**, no UI changes  
**App:** HANKKI (`apps/todays-menu`)  
**Related:** [AI_Image_Production_Engine.md](./AI_Image_Production_Engine.md) · DEC-0002 · LESSON-0002 · LESSON-0003

---

## Verdict

| Metric | Result |
| --- | --- |
| **Production Score** | **61 / 100** |
| **Ready for AI Connection** | **NO** |

Scaffolding is strong enough for dry-runs and a **guarded pilot** after fixes.  
It is **not** ready for unrestricted OpenAI / paid bulk generation until staging, registry, and app map gaps are closed.

---

# 1. Architecture Report

## 1.1 Intended production flow

```
Recipe (HANKKI_RECIPES)
  → Hero Image Manifest     (hero-images.json)
  → Prompt                  (prompts/{heroImageKey}.md)
  → Image Queue             (image-queue.json)
  → Image Provider          (OpenAI | Mock | future)
  → Generated Image         (review/{key}/candidate.jpg)
  → Asset Folder            (assets/meals/{key}.jpg)
  → Asset Registry          (mealImageAssets.ts + mealImageTypes.ts)
  → Application             (resolveMealHeroImage / RECIPE_IMAGE_MAP)
```

## 1.2 Stage validation

### A. Recipe → Manifest

| Item | Status |
| --- | --- |
| Source | `HANKKI_RECIPES` via `collectRecipes.ts` |
| Manifest | `buildHeroManifest.ts` → `generated/image-factory/hero-images.json` |
| Naming | `{heroImageKey}.jpg` — correct SoT |
| Gap | Manifest “completed” = **file on disk**, not “approved & published” |

**Pass** for 50-recipe inventory. Heuristic `cookingStyle` (no field on Recipe) is acceptable.

### B. Manifest → Prompt

| Item | Status |
| --- | --- |
| Prepare | `buildHeroPrompts.ts` → `prompts/*.md` |
| Generate | `engine/buildHeroPrompt.ts` + parse `## Prompt` block |
| Gap | **Two** prompt builders with duplicated shot requirements |

**Pass** with weak DRY (duplication risk).

### C. Prompt → Queue

| Item | Status |
| --- | --- |
| Queue | `buildImageQueue.ts` → `image-queue.json` |
| Statuses | `queued → processing → completed → approved|rejected|failed` |
| Gap | No job IDs, retries, concurrency, cost accounting |

**Pass** for sequential MVP batches (≤50).

### D. Queue → Provider

| Item | Status |
| --- | --- |
| Interface | `engine/providers/ImageProvider.ts` — clean |
| Factory | `createProvider.ts` — `IMAGE_PROVIDER` / `IMAGE_API_KEY` from `.env` |
| Shipped | OpenAI (DALL·E 3), Mock, Disabled |
| Missing | Gemini, Local SDXL, plugin registry |
| Parallel debt | `scripts/recipe-assets/providers/` still has stub Disabled path |

**Pass** for pluggability design. **Fail** for multi-provider production set.

### E. Provider → Generated Image → Review

| Item | Status |
| --- | --- |
| Candidate | `review/{key}/candidate.jpg` + `meta.json` + `PREVIEW.md` |
| HTML | `review/index.html` (Approve/Regenerate = copy CLI) |
| Gap | No one-click approve server; human must run terminal |

**Pass** for human-in-the-loop preview.

### F. Generated → Asset Folder

| Item | Status |
| --- | --- |
| Path | `assets/meals/{heroImageKey}.jpg` |
| Overwrite | Blocked unless `--force` |
| Critical gap | **OpenAI generate writes assets before approve** |

Contradicts OS best practice *Approval Before Production Assets*  
(ARCHITECTURE.md documents this; Best Practice doc says generate never writes production).

**Conditional pass** — policy hole.

### G. Asset Folder → Registry

| Item | Status |
| --- | --- |
| Writer | `updateMealImageRegistry.ts` |
| Alphabetical static `require()` | Yes |
| Types union | Updated |
| Critical gap | Registers **all** on-disk `*.jpg`, not only approved keys |

Any prior unreviewed file in `assets/meals/` can enter Metro registry on the next approve.

**Fail** for safe publish semantics.

### H. Registry → Application

| Item | Status |
| --- | --- |
| Registry | `mealImageAssets.ts` |
| Runtime map | `recipeImageMap.ts` maps **011–050 → `category_korean`** |
| Critical gap | Approved + registered hero **still not shown** for 011–050 without map edit |

**Fail** — end-to-end publish path incomplete.

---

## 1.3 Folder & naming validation

| Check | Result |
| --- | --- |
| `scripts/image-factory/engine/` portable | Pass |
| `generated/image-factory/` gitignored | Pass |
| `heroImageKey` snake_case → filename | Pass |
| RF-2A alternate names | Debt only (LESSON-0003) — factory correctly ignores |
| Batch 01 `.jpg` that are PNG bytes | Warn (LESSON-0002) |

---

## 1.4 Generated reports validation

| Artifact | Designed | Materialized in repo |
| --- | --- | --- |
| `hero-images.json` | Yes | Only after local prepare (gitignored) |
| `prompts/*.md` | Yes | Local only |
| `image-queue.json` | Yes | Local only |
| `dashboard.md` | Yes | Local only |
| `review/index.html` | Yes | Local only |

**Pass** as design. CI cannot assert artifacts unless prepare is run in pipeline.

---

## 1.5 Scale design (100 / 500 / 1000)

| Scale | Current engine | Assessment |
| --- | --- | --- |
| **100** | Sequential CLI + Metro static requires | Feasible with map sync + staging fix |
| **500** | Regex TS rewrite + every JPG in bundle | Risky — git churn, bundle size, rate limits |
| **1000** | Same model | **Not viable** without CDN/`remoteUrl`, codegen from JSON, batch concurrency |

Provider switch alone does not solve scale; asset delivery model must evolve.

---

## 1.6 Provider change design

```
ImageProvider (interface)
  ├── OpenAIProvider     ✅
  ├── MockProvider       ✅
  ├── GeminiProvider     ❌ missing
  └── LocalSdxlProvider  ❌ missing
```

| Requirement | Status |
| --- | --- |
| No hardcoded keys | Pass (`.env`) |
| Swap via env | Pass |
| No code duplication for call sites | Pass (`createImageProvider`) |
| Zero code to add provider | Fail — need new class + one `createProvider` branch |
| Shared retry / JPEG encode | Missing |

Duplication risk remains between `image-factory` and legacy `recipe-assets` providers.

---

# 2. Risk Report

| ID | Severity | Risk |
| --- | --- | --- |
| **R1** | Critical | `recipeImageMap` keeps 011–050 on `category_korean` → heroes never appear in app after approve |
| **R2** | Critical | Registry rewrite merges **all** disk JPGs → unapproved assets can publish |
| **R3** | High | OpenAI generate writes `assets/meals/` pre-approve → easy git pollution |
| **R4** | High | Docs conflict (Best Practice vs ARCHITECTURE) → process drift |
| **R5** | Medium | PNG-as-JPG (mock + Batch 01) → validation soft-only |
| **R6** | Medium | Dual prompt builders; dual provider trees |
| **R7** | Medium | No rate limit / concurrency → cost blowups at 100+ |
| **R8** | Medium | Regex registry codegen brittle under hand edits |
| **R9** | Low | Generated artifacts not in CI / git |
| **R10** | Low | Review HTML only copies CLI — easy operator error |

---

# 3. Suggested Improvements

### Must fix before AI connection (blockers)

1. **Staging-only generate** — write only `review/`; copy to `assets/meals/` exclusively in `hero:approve`.  
2. **Approved-set registry** — register only queue `status === 'approved'` keys (stop disk sweep).  
3. **Close app path** — on approve, update `recipeImageMap` (or resolve by `heroImageKey` so registered keys win over category fallback).  
4. **Approve gates** — reject mock/tiny/mismatch/below `HERO_SIZE_EXPECT` before promote.

### Should fix soon

5. Single shared prompt/brief module (IMG-1 + engine).  
6. Provider registry map (`Record<string, factory>`) for Gemini / SDXL without growing `if` chains.  
7. Align Best Practice doc with true staging (or change code to match Best Practice).  
8. Retire or redirect `recipe-assets` Disabled provider stub.

### Scale (100 → 1000)

9. Concurrency + retry + cost ledger in queue.  
10. Generate registry from JSON + codegen (not hand regex).  
11. At 500+: prefer `remoteUrl` / CDN for heroes; keep local only for Batch flagship.

---

# 4. Production Score (0–100)

| Area | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Pipeline completeness (prepare→validate) | 20 | 80 | 16.0 |
| Provider portability | 15 | 75 | 11.3 |
| Approval / staging safety | 20 | 40 | 8.0 |
| App integration (visible heroes) | 20 | 35 | 7.0 |
| Naming / folders / reports | 10 | 85 | 8.5 |
| Scale readiness (100–1000) | 10 | 45 | 4.5 |
| Ops (rate limit, CI artifacts) | 5 | 40 | 2.0 |
| **Total** | **100** | | **61** |

---

# 5. Ready for AI Connection?

## **NO**

### Why NO

- End-to-end publish path broken for recipes beyond Batch 01 (R1).  
- Registry can publish unreviewed disk files (R2).  
- Generate can write production assets before human approval (R3).  

### What “YES” requires (minimum gate)

- [ ] Generate stages to `review/` only  
- [ ] Approve is sole writer of `assets/meals/` + registry + `recipeImageMap`  
- [ ] Registry = approved set only  
- [ ] One pilot recipe (`--limit=1`) proves Home shows the new hero  
- [ ] Format/size hard-fail on approve  

### Allowed now (without flipping to YES)

- `IMAGE_PROVIDER=mock` smoke tests  
- `hero:generate --dry-run`  
- Prompt / queue / review HTML dry exercises  
- **Do not** run paid OpenAI bulk for 40+ recipes

---

## Appendix — Commands (validation only)

```bash
npm run image-factory:prepare
npm run hero:queue
npm run hero:generate -- --dry-run
npm run hero:review
npm run hero:validate
```

No provider key required for architecture validation.

---

*End of IMG-2A Architecture Validation.*
