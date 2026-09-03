# HANKKI v1.1 Sprint 11 — Toddler Weekly Plan Generator

**Date:** 2026-09-03  
**Scope:** Data-layer breakfast + dinner 7-day generators only  
**No:** UI routes, share cards, recipe DB edits, elementary weekly changes, AdMob/Coupang

---

## BREAKFAST_POOL

**21**

## DINNER_POOL

**24**

---

## BREAKFAST_EGG_RULE

- Max **3** egg-based slots / week (hard; never relaxed)
- **No adjacent** egg days (covers weekday consecutive ban + min 1-day gap)
- Soft `maxNonEgg` early phases leave room for 14-day second week

## BREAKFAST_NON_EGG_RULE

- Min **4** non-egg slots / week (hard)

---

## BREAKFAST_AVG_EGG

**2.000** (500 seeds)

## BREAKFAST_MAX_EGG

**2**

## BREAKFAST_4PLUS_EGG_RATE

**0.0%**

## BREAKFAST_CATEGORY_DIVERSITY

- Avg distinct categories / week: **4.23**
- Seen across 500 seeds: `egg`, `oat_fruit`, `potato_sweet`, `rice`, `soup`
- Note: primary `tofu` tag rare (연두부맑은국 → `soup`); tofu still present in pool

## BREAKFAST_UNIQUE_WEEKLY_SETS

**398** / 500

---

## DINNER_CATEGORY_DIVERSITY

- Avg forms / week: **4.52**
- Forms seen: `soup`, `stir_fry`, `braise`, `grill`, `rice_bowl`
- Hard: no form count ≥ **4**

## DINNER_PROTEIN_DIVERSITY

- Avg proteins / week: **4.45**
- Proteins seen: `beef`, `chicken`, `egg`, `tofu`, `veg`
- Hard: no protein count ≥ **4**

## DINNER_UNIQUE_WEEKLY_SETS

**231** / 500

---

## 7_DAY_DUPLICATES

**0** (breakfast + dinner, 500 seeds each)

## 14_DAY_DUPLICATES

**0** (breakfast + dinner, 200 cross-week pairs each via `avoidRecipeIds`)

## FALLBACK_COUNT

**0** (no avoid-ignore fallback; soft diversity phases only)

## DETERMINISTIC_SEED

**YES** — same seed → same week (verified)

---

## API

| Function | File |
|----------|------|
| `generateToddlerBreakfastWeek(seed, recipes?, options?)` | `toddlerBreakfastWeeklyPlan.ts` |
| `generateToddlerDinnerWeek(seed, recipes?, options?)` | `toddlerDinnerWeeklyPlan.ts` |
| `generateToddlerWeeklyPlan('breakfast'\|'dinner', …)` | delegates to above |
| Options | `{ avoidRecipeIds?: string[] }` |

Priority (breakfast): grade A boost → eligibility → quick/prep-ahead → category diversity → seed jitter.

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `data/recipes/toddlerBreakfastWeeklyPlan.ts` | **NEW** breakfast generator |
| `data/recipes/toddlerDinnerWeeklyPlan.ts` | **NEW** dinner generator |
| `data/recipes/toddlerWeeklyPlan.ts` | Delegate bf/dinner; fix lunch/snack avoid filter |
| `scripts/test-toddler-sprint11-weekly-generators.ts` | **NEW** 500 + 14-day QA |
| `package.json` | `test:toddler-sprint11-weekly-generators` |
| `scripts/reports/HANKKI_V1_1_SPRINT_11_REPORT.md` | This report |

---

## REGRESSION

| Test | Result |
|------|--------|
| `test-toddler-sprint11-weekly-generators` | **PASS** |
| `test-toddler-weekly-plan` | **PASS** |
| `test-toddler-meal-feed` | **PASS** |
| `test-elementary-sprint7-weekly-quality` | **PASS** |

---

## RESULT

**PASS**

Next sprint: Hold — awaiting user direction (UI wiring not started).
