# HANKKI Sprint 6.1 — Recipe Reality QA

**Date:** 2026-09-02  
**Scope:** Sprint 6 reviewed elementary recipes × 30 (investigation only — **no edits**)  
**Method:** Full read of catalog + Sprint 6 patches; prep+cook vs prerequisites; ingredient amounts; steps; school-morning feasibility

---

## Summary

| Grade | Count | Meaning |
|-------|-------|---------|
| **A** | 8 | 그대로 서비스 가능 |
| **B** | 17 | 사소한 수정 필요 |
| **C** | 5 | 반드시 수정 필요 |

**RESULT: PARTIAL** — 대부분 따라 할 수 있으나, 등교 전 시간·장비 전제·분량 모호·조리 불일치 5건은 수정 전 서비스 리스크.

---

## A_COUNT: 8

## B_COUNT: 17

## C_COUNT: 5

---

## BREAKFAST_RESULTS

| ID | Menu | Grade | Reality notes |
|----|------|-------|-----------------|
| recipe_0477 | 계란치즈또띠아 | **A** | prep 3 + cook 10 realistic; heat/lid/doneness clear; school-morning OK |
| recipe_0313 | 버터고구마 | **B** | prereq says overnight steam, steps are microwave-only; hero `roasted_sweet_potato_breakfast` may not match butter style |
| recipe_0312 | 바나나우유시리얼 | **A** | No cook; amounts clear (40g/200ml); school-morning OK |
| recipe_0316 | 바나나오트밀 | **B** | `소금 1꼬집` vague; total ~12m OK |
| recipe_0315 | 감자수프 | **B** | prep 8 + cook 15 = 23m; not school-morning tagged but heavy for weekday AM if used then |
| recipe_0305 | 간장계란덮밥 | **B** | Rice prereq good; step 3 says 반숙~완숙 vs kid tip demands fully cooked egg |
| recipe_0175 | 사과치즈토스트 | **B** | 4 steps thin; step 3 lacks butter amount repeat; legacy minimal heat detail |
| recipe_0396 | 참치마요주먹밥 | **A** | Rice prereq; tuna drain; mayo 1큰술; school-morning feasible ~18m |
| recipe_0472 | 소고기주먹밥 | **C** | schoolMorning=true but prep 8 + cook 15 ≈ 23m unrealistic before school |
| recipe_0441 | 사과시나몬토스트 | **A** | 5 steps with mm slices + 3min apple; ~17m total acceptable |
| recipe_0173 | 햄치즈토스트 | **B** | `소금 1꼬집`; ham×2 + cheese×2 processed/sodium — kid tip mitigates only in text |
| recipe_0478 | 감자햄토스트 | **B** | prep 8 + cook 15; step 1 microwaves potato (prereq allows pre-cook — OK); tight for AM |
| recipe_0295 | 버터계란토스트 | **B** | `소금 1꼬집`; step 1 says “소금” without amount in instruction; legacy 4-step |
| recipe_0306 | 참치계란주먹밥 | **C** | schoolMorning=true; 15m cook + 6 prep + rice; multi-pan steps too long for AM |
| recipe_0308 | 꼬마김밥 | **C** | schoolMorning=true; prep 10 + cook 15 ≈ 25m; rolling/cutting not AM-realistic |

---

## DINNER_RESULTS

| ID | Menu | Grade | Reality notes |
|----|------|-------|-----------------|
| recipe_0500 | 닭고기간장덮밥 | **A** | Clear cuts, heat, times; rice prereq; 15m cook plausible |
| recipe_0482 | 참치치즈덮밥 | **B** | Quantities OK; kid tip still says “적당량” in prose (not ingredient list) |
| recipe_0505 | 햄계란볶음밥 | **B** | Ham 3장 + 간장 1큰술 — followable but sodium-heavy for kids |
| recipe_0405 | 애호박계란국밥 | **C** | `소금 1/2작은술` in 500ml broth for child serving — likely too salty vs kid tip |
| recipe_0406 | 야채볶음우동 | **B** | `우동면 1인분` no gram weight; otherwise 5 clear steps |
| recipe_0436 | 떡갈비주먹밥 | **B** | Processed 떡갈비 80g; grill 2+2min realistic; schoolMorning flag odd for dinner item |
| recipe_0444 | 닭고기또띠아랩 | **A** | 5 steps; 100g chicken; heat cues present |
| recipe_0476 | 불고기또띠아랩 | **B** | Only 4 steps (min); otherwise followable |
| recipe_0475 | 햄계란김밥 | **B** | prep 12 + cook 15 realistic for dinner gimbap; ham sodium |
| recipe_0447 | 고구마치즈구이 | **C** | Requires oven/air fryer 180°C 5min — many homes lack; prereq 4min vs step 5min MW mismatch |
| recipe_0442 | 소고기계란덮밥 | **A** | 5 steps; doneness cues; rice prereq |
| recipe_0480 | 소고기야채덮밥 | **B** | 4 steps only; fewer doneness checkpoints than peers |
| recipe_0506 | 닭안심간장구이 | **B** | Title “안심” but ingredient `닭가슴살 120g`; 18m + marinate 5m |
| recipe_0507 | 두부계란조림밥 | **B** | `물 1/2컵` imprecise (~120ml); otherwise clear simmer times |
| recipe_0508 | 소고기감자조림밥 | **A** | 8min simmer + doneness fork test; 18m total realistic for dinner |

---

## TOP_ISSUES

1. **등교 전 아침 시간 과대** — 3 menus flagged `schoolMorningFriendly=true` need 23–25min (0472, 0306, 0308)
2. **전제조건 vs 조리순서 불일치** — 0313 (overnight vs MW), 0447 (4min vs 5min MW), 0478 (optional pre-cook OK)
3. **모호 분량** — `1꼬집` (0316, 0173, 0295, 0447), `1인분` (0406), `1/2컵` (0507, 0508)
4. **아이용 짠맛** — 0405 soup salt 1/2작은술; ham-heavy breakfasts/dinners (0173, 0478, 0505, 0475)
5. **장비 전제** — 0447 oven/air fryer not universal
6. **계란 익힘 불일치** — 0305 step vs kid tip
7. **명칭/재료 불일치** — 0506 “닭안심” vs 닭가슴살
8. **4단계 최소 레시피** — 0477, 0175, 0173, 0295, 0476, 0480 (acceptable but thin for parents)

---

## TIME_MISMATCH

| ID | Issue |
|----|-------|
| recipe_0472 | schoolMorning + prep 8 + cook 15 ≈ **23min** |
| recipe_0306 | schoolMorning + **15min** multi-step |
| recipe_0308 | schoolMorning + prep 10 + cook 15 ≈ **25min** |
| recipe_0313 | prereq “전날 찜” but same-day MW path **8min** only — prereq misleading if not pre-cooked |
| recipe_0447 | prereq MW **4min** vs step **5min**; total **20min** + oven |
| recipe_0315 | **23min** total if used as weekday breakfast |

---

## QUANTITY_ISSUES

| ID | Issue |
|----|-------|
| recipe_0316, recipe_0173, recipe_0295, recipe_0447 | `소금 1꼬집` |
| recipe_0406 | `우동면 1인분` (no g) |
| recipe_0507, recipe_0508 | `물 1/2컵` (no ml) |
| recipe_0482 | kid tip text “적당량” (ingredients themselves quantified) |

---

## SEASONING_ISSUES

| ID | Issue |
|----|-------|
| recipe_0405 | `소금 1/2작은술` in 500ml — high for elementary |
| recipe_0173, recipe_0478, recipe_0505, recipe_0475 | Ham portions (2–3 slices) + soy — needs low-sodium guidance in steps |
| recipe_0305 | Step allows 반숙 egg; kid safety tip contradicts |

---

## STEP_ISSUES

| ID | Issue |
|----|-------|
| recipe_0305 | Semi vs fully cooked egg inconsistency |
| recipe_0175, recipe_0173, recipe_0295 | 4 steps; thin heat/doneness on toast steps |
| recipe_0476, recipe_0480 | 4 steps at lower bound |
| recipe_0447 | Step 5 assumes oven — no MW-only fallback |

---

## IMAGE_MISMATCH

| ID | Issue | Severity |
|----|-------|----------|
| recipe_0313 | hero `roasted_sweet_potato_breakfast` vs butter-topped MW sweet potato | **Review** — possible visual mismatch |
| recipe_0506 | Name “닭안심” vs breast cut in copy | **Copy** not photo |
| Others | heroImageKey aligns with dish name (elementary_* keys match menu) | OK |

No confirmed wrong photo file without visual QA; **1 suspected** (0313).

---

## ALLERGY_ISSUES

| ID | Issue |
|----|-------|
| All 30 | `standardMetadata.allergyTags` present and match main allergens (egg, milk, wheat, fish, pork, beef, chicken, soy) |
| recipe_0175 | hero uses `pear` iconKey for apple — display only, not allergy |
| **None** | Tag vs ingredient mismatches found |

---

## RECIPES_REQUIRING_FIX

**Priority C (must fix before treating as “reviewed-ready”):**

1. recipe_0472 — school-morning time OR clear “weekend only” + remove schoolMorning flag
2. recipe_0306 — same
3. recipe_0308 — same
4. recipe_0405 — reduce soup salt in ingredients/steps OR explicit “아이용 1/4작은술”
5. recipe_0447 — add non-oven path (MW/grill pan) or reclassify; align prereq MW time

**Priority B (next content pass):**

- recipe_0313, recipe_0316, recipe_0305, recipe_0173, recipe_0175, recipe_0295, recipe_0478, recipe_0315
- recipe_0482, recipe_0505, recipe_0406, recipe_0436, recipe_0476, recipe_0475, recipe_0480, recipe_0506, recipe_0507

---

## RESULT

**PARTIAL**

- **8/30 (A)** ready for parent follow-as-written
- **17/30 (B)** need minor editorial fixes (amounts, steps, sodium notes)
- **5/30 (C)** blockers: 3 school-morning time, 1 soup salt, 1 oven dependency

**No recipe files modified in Sprint 6.1** (investigation only).

**Next Sprint:** wait — do not proceed until user approves fix scope.

---

## QA Command Used

```bash
npx tsx scripts/dump-sprint6-recipes-for-qa.ts
```
