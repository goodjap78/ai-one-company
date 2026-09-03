# HANKKI v1.1 Sprint 7 — Elementary Weekly Quality Integration

**Date:** 2026-09-02  
**Scope:** Soft A-grade / reviewed priority in elementary breakfast & dinner weekly generators  
**Status:** PASS

---

## CURRENT_SELECTION_LOGIC

**Breakfast (`elementaryBreakfastWeeklyPlan.ts`)**
- Pool: elementary + explicit + breakfast, no blocked collision flags, not in weekly exclusion list
- Seed → `mulberry32` shuffle → phased backtracking search (soft diversity caps, hard collision rules)
- Scoring: diversity category/form/egg/long-cook bonuses, oatmeal/other coverage, rice/bread caps, weekday `schoolMorningFriendly` (+1)
- Did **not** read `recipeQualityGrade`, `contentVerificationStatus`, or `recommendationPriority` from Sprint 6 patches

**Dinner (`elementaryDinnerWeeklyPlan.ts`)**
- Pool: elementary + explicit + dinner, same exclusion rules
- Seed shuffle → multi-phase backtracking (form/protein streak, rice cap, long-cook)
- Scoring: form/protein diversity, rice balance — no quality metadata

**Shared:** deterministic seed, `avoidRecipeIds` with alt seeds + full-pool fallback, 7-day in-week duplicate prevention

---

## NEW_SELECTION_LOGIC

**New module:** `elementaryWeeklyPlanQuality.ts`

| Signal | Soft boost | Notes |
|--------|------------|-------|
| `recipeQualityGrade === 'A'` | +6 | Never hard-filtered |
| `contentVerificationStatus === 'reviewed'` (non-A) | +3 | Fallback pool still eligible |
| `recommendationPriority` | −2…+4 | Tail from priority−75 |
| A-count in week (penalty) | −2 / −6 / −12 at 3 / 4 / 5 A slots | Prevents A-only weeks |
| `schoolMorningFriendly` (MON–FRI) | +5 | Replaces old +1 weekday rule |
| Seed jitter (breakfast score + both tie-break) | ±3 per slot/recipe | Deterministic variety |

**Breakfast:** existing diversity scoring + quality boost + egg-day penalty (−4 at 2 egg days, −10 at 3+) + seed jitter in `scoreCandidate`

**Dinner:** greedy-first phased packing with quality scoring (fast path); limited backtracking (`maxBranch: 12`) as last resort — preserves hard rules, improves runtime from ~28s → ~4ms per week

**Unchanged:** pool eligibility, seed determinism, `avoidRecipeIds`, browse/search pools, UI (no grade exposure)

**School-morning exclusions (Sprint 6.2):** `recipe_0472`, `recipe_0306`, `recipe_0308` remain in browse/breakfast pool but `schoolMorningFriendly=false` — never flagged true in weekday plans

---

## QUALITY_PRIORITY_IMPLEMENTED

1. `recipeQualityGrade === 'A'` — soft +6 in `scoreCandidate`
2. `contentVerificationStatus === 'reviewed'` — soft +3 for non-A reviewed recipes
3. `recommendationPriority` — tail boost/penalty
4. Menu diversity — existing category/form/protein/egg rules + A-week penalty + egg-day penalty
5. Seed deterministic — shuffle + seed jitter + tie-break order

No hard A-only filter. Non-A reviewed recipes still appear when diversity or caps require them.

---

## BREAKFAST_A_AVERAGE

**5.25 / 7** (500 seeds, fail=0)

Pool A-grade count: 16 / 45

---

## BREAKFAST_FAST_MEAL_RATE

**schoolMorningFriendly avg: 4.00 / 7** (500 seeds)

Weekday school-morning cap (soft max 4) respected. Excluded recipes (0472/0306/0308) never appear with `schoolMorningFriendly=true` in generated slots.

---

## BREAKFAST_DIVERSITY

| Metric | Result |
|--------|--------|
| In-week duplicate weeks | 0 / 500 |
| Unique week sets | 278 / 500 |
| Egg ≥4 days weeks | 38 / 500 |
| Rice ≥4 days weeks | 0 / 500 |

Categories (rice/bread/oatmeal/other) remain mixed; no rice category pile-up.

---

## DINNER_A_AVERAGE

**4.62 / 7** (500 seeds, fail=0)

Pool A-grade count: 15 / 27

---

## DINNER_DIVERSITY

| Metric | Result |
|--------|--------|
| In-week duplicate weeks | 0 / 500 |
| Unique week sets | 126 / 500 |
| Same protein ≥4 days weeks | 29 / 500 |

Form groups (덮밥/볶음밥/국/면/구이/조림/랩·김밥) rotate via existing streak rules + quality-weighted greedy selection.

---

## 7_DAY_DUPLICATES

**Breakfast:** 0 duplicate weeks / 500 seeds  
**Dinner:** 0 duplicate weeks / 500 seeds

---

## 14_DAY_DUPLICATES

**Breakfast:** 200/200 success, cross-week overlap **0**, fallback **0**  
**Dinner:** 200/200 success, cross-week overlap **0**, fallback **0**

---

## FALLBACK_COUNT

| Meal | 7-day (500 seeds) | 14-day (200 seeds) |
|------|-------------------|---------------------|
| Breakfast | 0 | 0 |
| Dinner | 0 | 0 |

---

## DETERMINISTIC_SEED

**PASS** — seed `42` produces identical breakfast and dinner weeks on repeated calls.  
(Slot composition changed vs pre-Sprint-7 due to quality scoring — expected.)

Sample seed 42 breakfast: 바나나우유시리얼, 계란치즈또띠아, 햄치즈토스트, 바나나오트밀, 계란볶음밥, 소고기주먹밥, 오믈렛  
Sample seed 42 dinner: 떡갈비주먹밥, 참치치즈덮밥, 불고기또띠아랩, 계란볶음밥, 소고기계란덮밥, 오믈렛, 소고기야채덮밥

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `data/recipes/elementaryWeeklyPlanQuality.ts` | **NEW** — soft quality boost, A-week penalty, school-morning boost, seed jitter |
| `data/recipes/elementaryBreakfastWeeklyPlan.ts` | Quality + school-morning scoring, egg-day penalty, seed jitter |
| `data/recipes/elementaryDinnerWeeklyPlan.ts` | Quality scoring, greedy-first packWeek, limited backtracking fallback |
| `scripts/test-elementary-sprint7-weekly-quality.ts` | **NEW** — 500-seed + 14-day QA |
| `scripts/test-elementary-sprint6-recipe-quality.ts` | Assert generator uses soft quality boost |
| `package.json` | `test:elementary-sprint7-weekly-quality` script |

---

## REGRESSION

| Test | Result |
|------|--------|
| `test-elementary-breakfast-weekly-plan` | PASS |
| `test-elementary-dinner-weekly-plan` | PASS |
| `test-elementary-weekly-sprint3` (avoidRecipeIds, 14-day) | PASS |
| `test-elementary-sprint6-recipe-quality` | PASS |
| `test-elementary-weekly-sprint4-ui` (browse, weekly UI) | PASS |
| `test-elementary-breakfast-weekly-plan-share` (save/share/web export) | PASS |
| `test-elementary-sprint7-weekly-quality` | PASS |

UI: no `recipeQualityGrade`, `contentVerificationStatus`, or quality score exposed in browse/weekly screens.

---

## WARNINGS

- Dinner `packWeek` is now **greedy-first** for performance; limited backtracking remains as final fallback. Quality priority is applied in greedy scoring — validated by 500-seed stats.
- Seed `42` week menus differ from pre-Sprint-7 (quality boost changes ranking) but remain deterministic.
- Egg-heavy weeks (≥4 egg-centric days) still occur in ~7.6% of breakfast seeds — within hard streak rules (max 2 consecutive); further tightening deferred to avoid over-constraining pool.

---

## BLOCKERS

None.

---

## RESULT

**PASS**

Sprint 6.2 A-grade core recipes are preferentially recommended in elementary weekly plans (~75% breakfast / ~66% dinner A-rate) without forcing 100% A weeks, with diversity, determinism, and cross-week de-dupe preserved.

**Next sprint:** Hold — awaiting user direction.
