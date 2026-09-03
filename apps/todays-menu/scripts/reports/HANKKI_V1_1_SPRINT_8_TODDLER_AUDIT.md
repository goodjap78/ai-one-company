# HANKKI v1.1 Sprint 8 — Toddler Meal Recipe Quality Audit

**Date:** 2026-09-03  
**Scope:** AUDIT ONLY — 74 toddler feed recipes (`listToddlerMealFeedRecipes`)  
**No changes:** recipes, images, UI, nutrition values

---

## TOTAL

**74**

## BREAKFAST

**15**

## LUNCH

**19**

## DINNER

**24**

## SNACK

**16**

---

## A_COUNT

**15**

## B_COUNT

**59**

## C_COUNT

**0**

## OFFICIAL_REVIEW_REQUIRED

**74** (R flag — safety/nutrition source review; not a medical claim)

---

## BREAKFAST_A

**2** / 15

## DINNER_A

**0** / 24

## FAST_BREAKFAST_COUNT

**14** (breakfast, time ≤ 15, no overnight-prep signal)

### Breakfast focus

| Metric | Value |
|--------|-------|
| Breakfast pool | 15 |
| ≤15 min | 14 |
| Fast (≤15, no overnight) | 14 |
| Overnight-prep signal | 0 |
| Egg-centric | 11 / 15 |
| A-grade | 2 |
| Diversity note | Egg-heavy (11/15). Non-egg A: 바나나오트밀죽, 고구마바나나볼. Many “계란○○밥/국” variants. |

| ID | Name | Time | Grade | Fast | Issues |
|----|------|------|-------|------|--------|
| recipe_0320 | 순두부계란스크램블 | 10m | B+R | Y | MEASUREMENT |
| recipe_0321 | 부드러운계란찜 | 12m | B+R | Y | MEASUREMENT,STEP_QUALITY |
| recipe_0322 | 바나나오트밀죽 | 8m | A+R | Y | — |
| recipe_0323 | 고구마바나나볼 | 12m | A+R | Y | — |
| recipe_0431 | 애호박계란국 | 12m | B+R | Y | MEASUREMENT |
| recipe_0432 | 연두부맑은국 | 10m | B+R | Y | MEASUREMENT |
| recipe_0433 | 감자계란국 | 15m | B+R | Y | MEASUREMENT |
| recipe_0484 | 계란치즈밥 | 12m | B+R | Y | MEASUREMENT,SEASONING |
| recipe_0485 | 소고기계란밥 | 15m | B+R | Y | MEASUREMENT |
| recipe_0486 | 두부계란밥 | 12m | B+R | Y | MEASUREMENT |
| recipe_0487 | 닭고기주먹밥 | 15m | B+R | Y | MEASUREMENT |
| recipe_0488 | 애호박계란밥 | 15m | B+R | Y | MEASUREMENT |
| recipe_0489 | 당근계란밥 | 12m | B+R | Y | MEASUREMENT |
| recipe_0490 | 브로콜리계란밥 | 15m | B+R | Y | MEASUREMENT |
| recipe_0491 | 계란채소죽 | 18m | B+R |  | MEASUREMENT |

---

## MEASUREMENT_ISSUES

**59** recipes — almost all are **소금 1꼬집** (pinch) instead of measured 작은술.

Pinch-salt subset: **59**. Fixing these alone would unlock many dinner A candidates.

## TIME_ISSUES

**0** recipes

## SEASONING_ISSUES

**1** recipes (processed meat / cheese-mayo breakfast heuristics; spicy false-positives filtered)

## TEXTURE_ISSUES

**0** recipes (ingredient-list choking foods only)

## ALLERGY_ISSUES

**0** recipes

## IMAGE_MISMATCH

**0** recipes (missing hero **file**). Visual dish↔name match was **not** manually scored this sprint — flagged as WARNING.

## DUPLICATE_RECIPES

Exact / similar name signals: **22**

- similar: 부드러운계란찜 (recipe_0321) ~ 부드러운계란국 (recipe_0388)
- similar: 바나나오트밀죽 (recipe_0322) ~ 바나나오트밀요거트 (recipe_0435)
- similar: 바나나오트밀죽 (recipe_0322) ~ 바나나오트밀볼 (recipe_0499)
- similar: 계란덮밥 (recipe_0324) ~ 두부계란덮밥 (recipe_0422)
- similar: 두부채소덮밥 (recipe_0325) ~ 두부채소조림 (recipe_0426)
- similar: 닭고기채소볶음밥 (recipe_0326) ~ 닭고기채소수프 (recipe_0329)
- similar: 닭고기채소볶음밥 (recipe_0326) ~ 닭고기채소덮밥 (recipe_0420)
- similar: 감자당근수프 (recipe_0328) ~ 감자당근채볶음 (recipe_0427)
- similar: 닭고기채소수프 (recipe_0329) ~ 닭고기채소덮밥 (recipe_0420)
- similar: 바나나요거트 (recipe_0332) ~ 사과바나나요거트 (recipe_0334)
- similar: 감자국 (recipe_0389) ~ 닭고기감자국 (recipe_0430)
- similar: 감자볶음 (recipe_0392) ~ 참치감자볶음밥 (recipe_0423)
- similar: 감자볶음 (recipe_0392) ~ 닭고기감자볶음밥 (recipe_0424)
- similar: 감자볶음 (recipe_0392) ~ 소고기감자볶음밥 (recipe_0461)
- similar: 두부계란덮밥 (recipe_0422) ~ 두부계란볶음밥 (recipe_0463)
- similar: 두부계란덮밥 (recipe_0422) ~ 두부계란밥 (recipe_0486)
- similar: 닭고기감자볶음밥 (recipe_0424) ~ 닭고기감자국 (recipe_0430)
- similar: 브로콜리계란볶음 (recipe_0428) ~ 브로콜리계란밥 (recipe_0490)
- similar: 애호박계란국 (recipe_0431) ~ 애호박계란밥 (recipe_0488)
- similar: 바나나오트밀요거트 (recipe_0435) ~ 바나나오트밀볼 (recipe_0499)
- similar: 두부계란볶음밥 (recipe_0463) ~ 두부계란밥 (recipe_0486)
- similar: 당근계란볶음 (recipe_0469) ~ 당근계란밥 (recipe_0489)

### Bias snapshot

- Egg-containing: **24** / 74 (breakfast 11/15)
- Processed meat: **0** / 74
- Rice-bowl form: **25** / 74

---

## TOP_20_PROBLEMS

1. recipe_0321 부드러운계란찜 [B+R/breakfast] — 소금 uses pinch "1꼬집"; missing fire level / doneness cue
2. recipe_0391 애호박볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"; missing fire level / doneness cue
3. recipe_0392 감자볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"; missing fire level / doneness cue
4. recipe_0427 감자당근채볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"; missing fire level / doneness cue
5. recipe_0484 계란치즈밥 [B+R/breakfast] — 소금 uses pinch "1꼬집"; cheese/mayo in breakfast — review sodium
6. recipe_0387 콩나물밥 [B+R/lunch] — 소금 uses pinch "1꼬집"; missing fire level / doneness cue
7. recipe_0320 순두부계란스크램블 [B+R/breakfast] — 소금 uses pinch "1꼬집"
8. recipe_0328 감자당근수프 [B+R/dinner] — 소금 uses pinch "1꼬집"
9. recipe_0329 닭고기채소수프 [B+R/dinner] — 소금 uses pinch "1꼬집"
10. recipe_0330 순두부계란국 [B+R/dinner] — 소금 uses pinch "1꼬집"
11. recipe_0331 감자닭안심조림 [B+R/dinner] — 소금 uses pinch "1꼬집"
12. recipe_0388 부드러운계란국 [B+R/dinner] — 소금 uses pinch "1꼬집"
13. recipe_0389 감자국 [B+R/dinner] — 소금 uses pinch "1꼬집"
14. recipe_0390 닭안심구이 [B+R/dinner] — 소금 uses pinch "1꼬집"
15. recipe_0393 두부구이 [B+R/dinner] — 소금 uses pinch "1꼬집"
16. recipe_0394 소고기버섯볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"
17. recipe_0425 소고기표고덮밥 [B+R/dinner] — 소금 uses pinch "1꼬집"
18. recipe_0426 두부채소조림 [B+R/dinner] — 소금 uses pinch "1꼬집"
19. recipe_0428 브로콜리계란볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"
20. recipe_0429 닭안심채소볶음 [B+R/dinner] — 소금 uses pinch "1꼬집"

---

## TODDLER_BREAKFAST_WEEK_READY

**YES**

- Weekly eligible breakfast candidates: **15**
- Fast breakfast (≤15m): **14**
- Breakfast A-grade: **2** (most B only due to pinch salt)
- Criterion: weekly pool ≥10 AND fast ≥5 AND breakfast ≥10
- Pool is sufficient for a future “유아 아침 7일” generator **after** measurement cleanup preferred

## TODDLER_DINNER_WEEK_READY

**YES**

- Weekly eligible dinner candidates: **24**
- Dinner non-C: **24**
- Dinner A-grade: **0** (0 today — B dominated by pinch salt)
- Criterion: weekly pool ≥12 AND non-C dinner ≥10
- Generator: **not built** (audit only)

---

## RECOMMENDED_CORE_RECIPES_30

Candidate core set for a future quality-upgrade sprint (A preferred, then mild B):

1. recipe_0322 — 바나나오트밀죽 [A/breakfast]
2. recipe_0323 — 고구마바나나볼 [A/breakfast]
3. recipe_0320 — 순두부계란스크램블 [B/breakfast]
4. recipe_0432 — 연두부맑은국 [B/breakfast]
5. recipe_0321 — 부드러운계란찜 [B/breakfast]
6. recipe_0431 — 애호박계란국 [B/breakfast]
7. recipe_0484 — 계란치즈밥 [B/breakfast]
8. recipe_0486 — 두부계란밥 [B/breakfast]
9. recipe_0489 — 당근계란밥 [B/breakfast]
10. recipe_0433 — 감자계란국 [B/breakfast]
11. recipe_0388 — 부드러운계란국 [B/dinner]
12. recipe_0393 — 두부구이 [B/dinner]
13. recipe_0428 — 브로콜리계란볶음 [B/dinner]
14. recipe_0469 — 당근계란볶음 [B/dinner]
15. recipe_0330 — 순두부계란국 [B/dinner]
16. recipe_0390 — 닭안심구이 [B/dinner]
17. recipe_0391 — 애호박볶음 [B/dinner]
18. recipe_0392 — 감자볶음 [B/dinner]
19. recipe_0394 — 소고기버섯볶음 [B/dinner]
20. recipe_0425 — 소고기표고덮밥 [B/dinner]
21. recipe_0386 — 간장계란밥 [A/lunch]
22. recipe_0324 — 계란덮밥 [B/lunch]
23. recipe_0327 — 채소계란볶음 [B/lunch]
24. recipe_0422 — 두부계란덮밥 [B/lunch]
25. recipe_0460 — 참치두부덮밥 [B/lunch]
26. recipe_0332 — 바나나요거트 [A/snack]
27. recipe_0335 — 우유오트밀 [A/snack]
28. recipe_0395 — 과일요거트 [A/snack]
29. recipe_0435 — 바나나오트밀요거트 [A/snack]
30. recipe_0333 — 찐고구마 [A/snack]

---

## Grade distribution by meal

| Meal | A | B | C | Total |
|------|---|---|---|-------|
| breakfast | 2 | 13 | 0 | 15 |
| lunch | 1 | 18 | 0 | 19 |
| dinner | 0 | 24 | 0 | 24 |
| snack | 12 | 4 | 0 | 16 |

---

## BLOCKERS

- Pinch-salt (1꼬집) on 59/74 recipes — measurement standardization required before A-heavy toddler weekly quality push

## WARNINGS

- Egg-centric recipes: 24/74
- Processed meat present: 0/74
- Rice-bowl form: 25/74
- Nutrition unverified on nearly all toddler recipes — never show as measured
- Grades are audit heuristics only — not medical/nutrition certification
- Pinch-salt (1꼬집) on **59** recipes — largest single B driver
- Visual image↔dish QA not performed (file presence only)
- Breakfast egg concentration may reduce weekly diversity without form/protein rules

---

## METHOD (audit heuristics)

- Pool: `isEligibleToddlerMealFeedRecipe` (explicit toddler + approved safety review)
- Grades: A usable as-is; B minor fix; C must fix before promote
- R flag: authored choking/seasoning safety flags and/or unverified nutrition (expected catalog-wide)
- **No** invented sodium/sugar mg cutoffs
- Spicy detection uses ingredients + affirmative steps only (ignores “매운 양념은 넣지 않아요”)
- Detail JSON: `scripts/reports/HANKKI_V1_1_SPRINT_8_TODDLER_AUDIT_DETAIL.json`
- Runner: `npx tsx scripts/audit-toddler-sprint8-quality.ts`

---

## RESULT

**PASS**

Audit complete for all 74 toddler recipes. No content modified. Next sprint: hold for quality-fix planning.
