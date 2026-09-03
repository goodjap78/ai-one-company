# HANKKI v1.1 Sprint 10 — Toddler Breakfast Diversity Expansion

**Date:** 2026-09-03  
**Scope:** Expand toddler breakfast pool via snack→breakfast reuse (no new recipe IDs)  
**No:** new recipes, invented nutrition, weekly generator changes, large UI, AdMob/Coupang, elementary changes

---

## BREAKFAST_BEFORE

**15**

## EGG_BEFORE

**11**

## NON_EGG_BEFORE

**4** (0322 바나나오트밀죽 · 0323 고구마바나나볼 · 0432 연두부맑은국 · 0487 닭고기주먹밥)

---

## EXISTING_RECIPES_REUSED

**6** (snack → also breakfast; recipeId + image kept)

| ID | Name | Category |
|----|------|----------|
| recipe_0332 | 바나나요거트 | 오트/과일 · 요거트 |
| recipe_0333 | 찐고구마 | 감자/고구마 |
| recipe_0335 | 우유오트밀 | 오트 |
| recipe_0434 | 고구마요거트 | 감자/고구마 · 요거트 |
| recipe_0495 | 찐단호박 | 단호박 |
| recipe_0499 | 바나나오트밀볼 | 오트/과일 |

**Lunch surveyed, not promoted:** 덮밥/볶음밥 중심 → 아침으로 억지 승격하지 않음.

## NEW_RECIPES_CREATED

**0** (reuse alone reached +6 non-egg)

---

## BREAKFAST_AFTER

**21** (unique catalog still **74**; snack count still **16**)

## EGG_AFTER

**11**

## NON_EGG_AFTER

**10**

---

## ADDED_BY_CATEGORY

| Category | Added |
|----------|------:|
| 빵 / 토스트 | **0** (gap remains) |
| 감자 / 고구마 / 단호박 | 3 (0333, 0434, 0495) |
| 오트 / 과일 | 3 (0332, 0335, 0499) |
| 두부 | 0 new (기존 0432 유지) |
| 밥 / 주먹밥 | 0 new (기존 0487 유지) |
| 기타 부드러운 아침식 | covered by steamed / yogurt / oat |

---

## QUALITY_A_COUNT

**6 / 6** promoted recipes → `recipeQualityGrade: A`  
(nutrition remains `unverified`)

Sprint 9 core 30 stay A.

## IMAGE_REQUIRED

**NONE** — all 6 already have hero JPGs under `assets/meals/`.

---

## BREAKFAST_DIVERSITY_SIMULATION

**500** random 7-day picks (without replacement within week; no weekly egg-cap rules).

| Metric | Value |
|--------|------:|
| Avg egg days / week | **3.70** |
| EGG_REPEAT_RATE (egg slots / all slots) | **0.529** |
| Weeks with ≥5 egg days | 21.8% |
| Weeks with ≥6 egg days | 4.0% |
| Max egg days in a week (worst random) | 7 |
| Weeks with same main ingredient ≥4 | 33.4% |

## CATEGORY_DIVERSITY

Pool signals (overlap allowed): tofu 3 · rice-heavy names 21 · egg 11 · oat/fruit 6 · potato/sweet 5 · soup 3 · **true toast/bread 0**

---

## TODDLER_BREAKFAST_WEEK_READY

**YES**

Pool now supports building a 7-day breakfast week with ≥3 non-egg days without inventing recipes.  
Weekly **egg-cap / category rules** are still for the next Weekly sprint (pure random can still spike eggs).

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `data/recipes/toddlerBreakfastPoolPromotions.ts` | **NEW** mealType promotions |
| `data/recipes/toddlerSprint10QualityPatches.ts` | **NEW** A-grade patches |
| `data/recipes/deriveRecipeStandardMetadata.ts` | Apply toddler breakfast promotions |
| `data/recipes/recipeMasterTemplate.ts` | Apply Sprint 10 patch after Sprint 9 |
| `data/recipes/toddlerPilotOverrides.ts` | `intendedMealTypes` + breakfast |
| `scripts/test-toddler-sprint10-breakfast-diversity.ts` | **NEW** QA + sim |
| `scripts/test-toddler-meal-feed.ts` | breakfast count 21 |
| `scripts/test-toddler-weekly-plan.ts` | counts 21 / slot sum 80 |
| `package.json` | `test:toddler-sprint10-breakfast-diversity` |
| `scripts/reports/HANKKI_V1_1_SPRINT_10_REPORT.md` | This report |

---

## REGRESSION

| Test | Result |
|------|--------|
| `test-toddler-sprint10-breakfast-diversity` | **PASS** |
| `test-toddler-meal-feed` | **PASS** (74 unique) |
| `test-toddler-weekly-plan` | **PASS** |
| `test-toddler-sprint9-quality` | **PASS** |
| `test-elementary-sprint6-recipe-quality` | **PASS** |

---

## WARNINGS

1. **빵/토스트 비계란 아침 여전히 0** — 다음 확장 후보 (신규 또는 초등 토스트 계열 검토; 억지 승격 금지).
2. Pure-random simulation can still produce egg-heavy weeks until Weekly sprint adds caps.
3. Yogurt/oat family is richer now — weekly rules should avoid banana-oat clone streaks.
4. Promoted snacks remain valid snacks (dual mealType); browse meaning preserved.

## BLOCKERS

**NONE**

---

## RESULT

**PASS**

non-egg breakfast **4 → 10** via 6 existing snacks; no new IDs; no placeholder images; nutrition unverified; A-grade on all promotions.

**Next sprint:** Hold — awaiting user direction.
