# HANKKI v1.1 Sprint 9 — Toddler Core Recipe Quality Upgrade

**Date:** 2026-09-03  
**Scope:** 15 breakfast (all) + 15 representative dinner — editorial quality patches  
**No:** new recipes, invented nutrition numbers, weekly generator, large UI changes

---

## BREAKFAST_SELECTED_15

| ID | Name | Notes |
|----|------|-------|
| recipe_0320 | 순두부계란스크램블 | egg + tofu |
| recipe_0321 | 부드러운계란찜 | egg + rice |
| recipe_0322 | 바나나오트밀죽 | non-egg · porridge |
| recipe_0323 | 고구마바나나볼 | non-egg · potato/fruit |
| recipe_0431 | 애호박계란국 | egg + soup |
| recipe_0432 | 연두부맑은국 | non-egg · tofu soup |
| recipe_0433 | 감자계란국 | egg + soup |
| recipe_0484 | 계란치즈밥 | egg + cheese rice |
| recipe_0485 | 소고기계란밥 | egg + beef rice |
| recipe_0486 | 두부계란밥 | egg + tofu rice |
| recipe_0487 | 닭고기주먹밥 | non-egg · chicken rice ball |
| recipe_0488 | 애호박계란밥 | egg rice |
| recipe_0489 | 당근계란밥 | egg rice |
| recipe_0490 | 브로콜리계란밥 | egg rice |
| recipe_0491 | 계란채소죽 | egg porridge |

---

## DINNER_SELECTED_15

Selected from 24 dinners for **exposure (priority), form diversity, protein diversity, home-cook realism**:

| ID | Name | Form | Protein |
|----|------|------|---------|
| recipe_0425 | 소고기표고덮밥 | 덮밥 | 소고기 |
| recipe_0429 | 닭안심채소볶음 | 볶음 | 닭 |
| recipe_0394 | 소고기버섯볶음 | 볶음 | 소고기 |
| recipe_0393 | 두부구이 | 구이 | 두부 |
| recipe_0390 | 닭안심구이 | 구이 | 닭 |
| recipe_0331 | 감자닭안심조림 | 조림 | 닭 |
| recipe_0426 | 두부채소조림 | 조림 | 두부 |
| recipe_0468 | 애호박조림 | 조림 | 채소 |
| recipe_0330 | 순두부계란국 | 국 | 두부/계란 |
| recipe_0388 | 부드러운계란국 | 국 | 계란 |
| recipe_0464 | 소고기배추국 | 국 | 소고기 |
| recipe_0466 | 애호박두부국 | 국 | 두부 |
| recipe_0328 | 감자당근수프 | 수프 | 채소 |
| recipe_0470 | 두부버섯볶음 | 볶음 | 두부 |
| recipe_0428 | 브로콜리계란볶음 | 볶음 | 계란 |

**Deferred dinners (9):** 감자국, 감자볶음, 감자당근채볶음, 닭고기채소수프, 닭고기감자국, 닭고기무국, 감자두부국, 당근계란볶음, 애호박볶음 — kept in catalog, not in Sprint 9 core.

---

## A_BEFORE / B_BEFORE / C_BEFORE

From Sprint 8 core-relevant baseline (same 30 IDs under Sprint 8 heuristics):

| | Count |
|--|------:|
| **A_BEFORE** | ~2 (breakfast A only; dinners mostly B via pinch salt) |
| **B_BEFORE** | ~28 |
| **C_BEFORE** | 0 |

(Sprint 8 full catalog: A=15 / B=59 / C=0 — A skewed to snacks.)

---

## A_AFTER / B_AFTER / C_AFTER

| | Count |
|--|------:|
| **A_AFTER** | **30** |
| **B_AFTER** | **0** |
| **C_AFTER** | **0** |

Target met: C=0, A≥25, B≤5.

`recipeQualityGrade: A` = editorial follow-along readiness. **Not** nutrition verified.

---

## MEASUREMENT_FIXED

- Removed **소금 1꼬집** from all 30 (ingredient amounts + step text).
- **Not** blind `1꼬집 → 1/16작은술`.
- Strategies:
  - **omit_soy** — 간장 이미 있음 (0425, 0426, 0468, 0470)
  - **omit_cheese** — 치즈 이미 있음 (0484)
  - **omit_butter** — 버터 이미 있음 (0331)
  - **optional** — `선택(생략 가능)` when salt was only mild seasoning
  - **none** — no salt line (0322, 0323)

## SEASONING_FIXED

- Cheese breakfast: salt omitted; kid tip says cheese seasons.
- Soy dinners: salt omitted; steps say no sugar/gochugaru.
- Mild seasoning guidance in `kidAdjustmentTip` (no invented mg cutoffs).

## STEPS_FIXED

- Fire level / doneness tips added where Sprint 8 flagged weak cues (e.g. 0321, 0330, 0388, 0390, 0393, meats).
- Salt wording rewritten in steps to match strategy.

## TEXTURE_GUIDE_ADDED

- Shared kid tip: 한입 크기 ~5mm–1cm, 으깨기, 질긴 덩어리 금지.
- Extra guidance: 브로콜리 줄기, 주먹밥 크기, 수프 으깨기, 표고 결 방향.

## PREREQUISITE_FIXED

- All 30 have `prerequisites` (prep ahead, 찬밥 기준, overnight sweet potato path, etc.).
- `prepTimeMinutes` set on all 30.

## STORAGE_REHEAT_FIXED

- All 30: `storageInfo` + `reheatingMethod` (soup vs soft reheat variants).

---

## BREAKFAST_EGG_COUNT

**11** / 15

## BREAKFAST_NON_EGG_COUNT

**4** / 15 — 바나나오트밀죽, 고구마바나나볼, 연두부맑은국, 닭고기주먹밥

## BREAKFAST_CATEGORY_DIVERSITY

| Category | Count (overlap allowed) |
|----------|------------------------:|
| 밥/주먹밥 | 7 |
| 죽/오트밀 | 2 |
| 국 | 3 |
| 감자/고구마 | 2 |
| 과일 | 2 |
| 두부 | 3 |
| 계란 | 11 |
| 빵 | **0** |

Distinct category signals: 7, but **egg dominates**.

---

## TODDLER_BREAKFAST_DIVERSITY_READY

**NO**

Pool can fill 7 calendar days on time, but form diversity is egg-skewed (11/15). A real “유아 아침 7일” without heavy egg repeat needs more non-egg slots.

## TODDLER_DINNER_DIVERSITY_READY

**YES** (for the selected 15)

Form mix: 덮밥 1 · 볶음/구이 6 · 조림 3 · 국/수프 5.  
Protein mix: 닭 · 소고기 · 두부 · 계란 · 채소.  
No fish in this 15 — optional next expansion.

---

## NEW_RECIPES_REQUIRED_NEXT

**YES**

### IF_YES

**RECOMMENDED_CATEGORIES**

1. 빵/토스트·또띠아 (현재 0)
2. 감자/고구마/단호박 중심 아침 (비계란)
3. 과일·요거트·오트 볼 (비계란 확장)
4. 두부 스크램블/맑은국 추가 (비계란)
5. (선택) 흰살생선 저녁 — dinner gap

**RECOMMENDED_COUNT**

**4~6** non-egg breakfast recipes (enough to bring egg share ≤ ~50% of a 7-day rotation with diversity rules).

---

## NUTRITION_UNVERIFIED

**YES — all 30 keep `nutrition.source = 'unverified'`**

Grade A ≠ nutrition verified. No calories/protein/sodium fabricated.

## OFFICIAL_REVIEW_FLAGS

- Catalog-wide unverified nutrition remains **NEEDS_OFFICIAL_REVIEW** for any measured claims.
- Existing `toddlerSafetyReview.seasoningFlags` / choking cautions unchanged (authored safety layer).
- No new medical/nutrition claims added in copy.

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `data/recipes/elementaryRecipeQualityTypes.ts` | `targetAudience: 'elementary' \| 'toddler'` |
| `data/recipes/toddlerSprint9QualityPatches.ts` | **NEW** — 30 patches + apply |
| `data/recipes/recipeMasterTemplate.ts` | Apply toddler patch after elementary |
| `scripts/test-toddler-sprint9-quality.ts` | **NEW** QA |
| `package.json` | `test:toddler-sprint9-quality` |
| `scripts/reports/HANKKI_V1_1_SPRINT_9_REPORT.md` | This report |

---

## REGRESSION

| Test | Result |
|------|--------|
| `npx tsx scripts/test-toddler-sprint9-quality.ts` | **PASS** (A=30, B=0, C=0) |
| `npx tsx scripts/test-toddler-meal-feed.ts` | **PASS** (74 feed intact) |
| `npx tsx scripts/test-elementary-sprint6-recipe-quality.ts` | **PASS** |

---

## RESULT

**PASS**

Core 30 toddler recipes are editorially A-grade for follow-along cooking (measurements, tips, storage/reheat, fire/doneness). Nutrition stays unverified. Breakfast weekly **diversity** still needs 4–6 non-egg recipes next — not implemented this sprint.

**Next sprint:** Hold — awaiting user direction.
