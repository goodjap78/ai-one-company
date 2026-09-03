# HANKKI_BATCH3_CHILD_IMAGE_REPORT

**Sprint:** HANKKI v1.1 — Batch #3 Child Hero + Step Image Sprint  
**Date:** 2026-08-28  
**Scope:** `recipe_0448`–`recipe_0483`

---

## Summary

| Metric | Value |
|--------|-------|
| **HERO_CREATED** | **36** |
| **HERO_REGENERATED** | **0** |
| **HERO_RUNTIME** | **188/188** (child heroes on disk + `mealImageAssets`) |
| **STEP_IMAGES_CREATED** | **54** (18 recipes × 3 slots) |
| **STEP_REGENERATED** | **2** |

### Hero by audience

| Audience | Count |
|----------|-------|
| **BABY_HERO** | 10 |
| **TODDLER_HERO** | 14 |
| **ELEMENTARY_HERO** | 12 |

---

## Step pilot

**STEP_PILOT_RECIPES (18):**

| Audience | recipeId | Name |
|----------|----------|------|
| Baby | recipe_0448 | 콜리플라워미음 |
| Baby | recipe_0449 | 비트미음 |
| Baby | recipe_0451 | 소고기양배추죽 |
| Baby | recipe_0452 | 닭고기감자죽 |
| Baby | recipe_0453 | 두부브로콜리죽 |
| Baby | recipe_0454 | 소고기단호박무른밥 |
| Baby | recipe_0456 | 두부감자진밥 |
| Baby | recipe_0457 | 흰살생선애호박진밥 |
| Toddler | recipe_0458 | 소고기두부덮밥 |
| Toddler | recipe_0461 | 소고기감자볶음밥 |
| Toddler | recipe_0464 | 소고기배추국 |
| Toddler | recipe_0468 | 애호박조림 |
| Toddler | recipe_0471 | 배요거트 |
| Elementary | recipe_0472 | 소고기주먹밥 |
| Elementary | recipe_0475 | 햄계란김밥 |
| Elementary | recipe_0477 | 계란치즈또띠아 |
| Elementary | recipe_0480 | 소고기야채덮밥 |
| Elementary | recipe_0483 | 고구마요거트볼 |

---

## Consistency gate (automated)

All generated assets passed automated recipe↔image key alignment. Texture/stage prompts sourced from `child-missing-hero-queue.json` / `child-step-pilot-queue-batch3.json`.

| Review | Count | Notes |
|--------|-------|-------|
| **PASS** | 88 | 36 heroes + 52 steps first-try |
| **REGENERATE** | 2 | `toddler_beef_tofu_donburi_step_05`, `toddler_beef_potato_fried_rice_batch3_step_04` (Gemini missing inline data) — regen PASS |
| **MANUAL_REVIEW** | 0 blockers | See visual spot-check list below |

**VISUAL_REVIEW_REQUIRED (recommended device QA spot-check, non-blocking):**
- `recipe_0457` 흰살생선애호박진밥 — no visible bones; completion texture
- `recipe_0448`–`0450` early thin puree — lump-free appearance
- `recipe_0454` mashed rice — soft chunk level
- `recipe_0475` 햄계란김밥 — gimbap roll form vs ingredients

**CRITICAL/HIGH image mismatch:** 0

---

## Image size (HYBRID strategy maintained)

### Hero 36장

| | Bytes | Avg |
|--|-------|-----|
| **Before** | 0 (new) | — |
| **After (normalized)** | 6,040,810 | **167,800** |

Spec: 1344×768 JPEG q85

### Step 54장 (pilot)

| | Bytes | Avg |
|--|-------|-----|
| **Before (raw Gemini)** | ~80,437,764 | ~1,489,588 |
| **After (normalized)** | 5,344,778 | **98,977** |

Spec: 1024×1024 JPEG q80  
Pipeline step normalize saved **~75 MB** on pilot steps alone.

### Total asset delta

| Directory | Before sprint | After sprint | **Added** |
|-----------|---------------|--------------|-----------|
| `assets/meals/` | 74,844,277 | 80,885,087 | **+6,040,810** |
| `assets/recipe-steps/` | 68,218,918 | 73,563,696 | **+5,344,778** |
| **Combined** | | | **+11,385,588 (~10.9 MB)** |

---

## Pipeline

| Step | Result |
|------|--------|
| **PIPELINE_DRY_RUN** | **PASS** |
| **PIPELINE_ACTUAL** | **PASS** |
| Hero missing (batch3) | **0** |
| Step missing (pilot 54) | **0** |
| Step missing (non-pilot batch3) | 112 warnings (expected — pilot-only scope) |

---

## FILES_CHANGED

**Infrastructure**
- `scripts/image-factory/childHeroPromptOverrides.ts` — child `finishDescription` → hero prompts
- `scripts/step-image-factory/childStepPromptOverrides.ts` — pilot `visualDescription` → step prompts
- `scripts/image-factory/buildHeroPrompts.ts` — child-aware hero prompt body
- `scripts/step-image-factory/buildPrompts.ts` — child-aware step prompts (1:1)
- `scripts/build-child-image-queues.ts` — batch3 step pilot queue output
- `scripts/batch3-image-sprint-prepare.ts` — scoped prepare + baseline
- `scripts/batch3-step-queue-write.ts` — 54-item step queue
- `scripts/test-child-image-registry.ts` — 188/188 heroes; batch3 step pilot gate

**Generated / registry (automated)**
- `assets/meals/` — +36 hero JPGs
- `assets/recipe-steps/` — +54 step JPGs (pilot)
- `services/images/mealImageAssets.ts` — +36 keys
- `services/images/recipeStepImageAssets.ts` — +54 keys
- `data/recipes/recipeImageMap.ts` — batch3 mappings
- `scripts/reports/child-step-pilot-queue-batch3.json`
- `scripts/reports/batch3-image-size-baseline.json`
- `scripts/reports/new-recipe-preparation-latest.json`

---

## TEST_RESULTS

| Test | Result |
|------|--------|
| `validate:hankki-recipes` | PASS |
| `validate:hero-runtime` | PASS (meal registry 497) |
| `test:child-image-registry` | PASS |
| `test:child-detail-implementation` | PASS |
| `prepare:new-recipes` (dry + actual) | PASS |
| Pipeline bundled QA | PASS |

**REGRESSIONS:** None  
**HOME/FRIDGE exposure:** Unchanged (baby/toddler still excluded)

---

## RISKS

1. **Visual QA** — Gemini-generated food photos auto-approved; recommend device spot-check on fish/baby texture heroes above.
2. **Non-pilot steps** — 112 batch3 step keys remain text-only (by design this sprint).
3. **Raw generation size** — Step images arrived ~1.5 MB each before normalize; pipeline compression is required for bundle size.

---

## Readiness

| Flag | Value |
|------|-------|
| **READY_FOR_BATCH4** | **YES** |
| **READY_FOR_REAL_DEVICE_QA** | **YES** (static + image runtime PASS; visual spot-check recommended) |
