# HANKKI_V1_1_SPRINT_3_REPORT

Date: 2026-09-01  
Scope: Elementary dinner pool expansion + weekly generator cross-week de-dupe  
Project: `apps/todays-menu`

---

## ELEMENTARY_DINNER_BEFORE

**Pool size: 17** (Sprint 2 audit baseline)

| # | ID | Name | Form | Main protein |
|---|---|---|---|---|
| 1 | 002 | 계란볶음밥 | fried_rice | egg |
| 2 | 059 | 오믈렛 | non_rice | egg |
| 3 | recipe_0442 | 소고기계란덮밥 | rice_bowl | beef |
| 4 | recipe_0443 | 햄계란덮밥 | rice_bowl | pork/egg |
| 5 | recipe_0446 | 감자치즈구이 | non_rice | other |
| 6 | recipe_0480 | 소고기야채덮밥 | rice_bowl | beef |
| 7 | recipe_0481 | 닭고기계란덮밥 | rice_bowl | chicken/egg |
| 8 | recipe_0500 | 닭고기간장덮밥 | rice_bowl | chicken |
| 9 | recipe_0501 | 참치계란덮밥 | rice_bowl | fish/egg |
| 10 | recipe_0502 | 돼지고기양배추덮밥 | rice_bowl | pork |
| 11 | recipe_0503 | 닭고기카레볶음밥 | fried_rice | chicken |
| 12 | recipe_0504 | 소고기버섯볶음밥 | fried_rice | beef |
| 13 | recipe_0505 | 햄계란볶음밥 | fried_rice | pork/egg |
| 14 | recipe_0506 | 닭안심간장구이 | non_rice | chicken |
| 15 | recipe_0507 | 두부계란조림밥 | rice_other | tofu/egg |
| 16 | recipe_0508 | 소고기감자조림밥 | rice_other | beef |
| 17 | recipe_0509 | 닭고기감자덮밥 | rice_bowl | chicken |

### Overlap analysis (before)

| Dimension | Finding |
|---|---|
| **Form** | 덮밥 8, 볶음밥 3, 조림밥 2, non_rice 3 — **밥·덮밥 편중** (14/17 rice-based) |
| **Protein** | beef 4, chicken 4, egg 6+, pork 3, tofu 1, fish 1 — **계란·닭·소고기 반복** |
| **Cook style** | 팬 볶음/덮밥 중심; 국·찌개·면·랩·김밥 **없음** |
| **14-day capacity** | 17 IDs → 수학적으로 14 unique 가능하나 **여유 3개뿐**; generator cross-week dedupe 없어 실질 14일 불가 |

---

## ELEMENTARY_DINNER_AFTER

**Pool size: 27** (+10 via mealType promotion, catalog IDs unchanged at 517)

| # | ID | Name | Source |
|---|---|---|---|
| 1 | 002 | 계란볶음밥 | original |
| 2 | 059 | 오믈렛 | original |
| 3 | recipe_0405 | 애호박계란국밥 | **promoted** (lunch→dinner) |
| 4 | recipe_0406 | 야채볶음우동 | **promoted** |
| 5 | recipe_0436 | 떡갈비주먹밥 | **promoted** |
| 6 | recipe_0437 | 닭고기김가루주먹밥 | **promoted** |
| 7 | recipe_0438 | 치즈참치주먹밥 | **promoted** |
| 8 | recipe_0442 | 소고기계란덮밥 | original |
| 9 | recipe_0443 | 햄계란덮밥 | original |
| 10 | recipe_0444 | 닭고기또띠아랩 | **promoted** |
| 11 | recipe_0446 | 감자치즈구이 | original |
| 12 | recipe_0447 | 고구마치즈구이 | **promoted** |
| 13 | recipe_0475 | 햄계란김밥 | **promoted** |
| 14 | recipe_0476 | 불고기또띠아랩 | **promoted** |
| 15 | recipe_0480 | 소고기야채덮밥 | original |
| 16 | recipe_0481 | 닭고기계란덮밥 | original |
| 17 | recipe_0482 | 참치치즈덮밥 | **promoted** |
| 18 | recipe_0500 | 닭고기간장덮밥 | original |
| 19 | recipe_0501 | 참치계란덮밥 | original |
| 20 | recipe_0502 | 돼지고기양배추덮밥 | original |
| 21 | recipe_0503 | 닭고기카레볶음밥 | original |
| 22 | recipe_0504 | 소고기버섯볶음밥 | original |
| 23 | recipe_0505 | 햄계란볶음밥 | original |
| 24 | recipe_0506 | 닭안심간장구이 | original |
| 25 | recipe_0507 | 두부계란조림밥 | original |
| 26 | recipe_0508 | 소고기감자조림밥 | original |
| 27 | recipe_0509 | 닭고기감자덮밥 | original |

**Diversity gain:** 국밥, 우동, 주먹밥, 또띠아랩, 김밥, 구이 추가 → form/protein 편중 완화.

---

## RECIPES_ADDED

**0 new catalog IDs.** 10 existing elementary lunch recipes promoted to also carry `dinner` in `standardMetadata.mealTypes`:

| ID | Name | Promotion |
|---|---|---|
| recipe_0436 | 떡갈비주먹밥 | breakfast + lunch + dinner |
| recipe_0437 | 닭고기김가루주먹밥 | breakfast + lunch + dinner |
| recipe_0438 | 치즈참치주먹밥 | breakfast + lunch + dinner |
| recipe_0444 | 닭고기또띠아랩 | lunch + dinner |
| recipe_0405 | 애호박계란국밥 | lunch + dinner |
| recipe_0406 | 야채볶음우동 | lunch + dinner |
| recipe_0475 | 햄계란김밥 | lunch + dinner |
| recipe_0476 | 불고기또띠아랩 | lunch + dinner |
| recipe_0482 | 참치치즈덮밥 | lunch + dinner |
| recipe_0447 | 고구마치즈구이 | lunch + dinner |

Mechanism: `elementaryDinnerPoolPromotions.ts` → merged in `deriveRecipeStandardMetadata.ts`.

No new hero images. No arbitrary nutrition values added.

---

## RECIPES_DEDUPED

**None deleted** (per sprint constraint: do not force-delete).

### Pair 1: `recipe_0463` ↔ `recipe_0486` (두부계란볶음밥 / 두부계란밥)

| Aspect | recipe_0463 | recipe_0486 |
|---|---|---|
| Audience | toddler (lunch) | toddler (breakfast) |
| Ingredients | 밥 2/3, 두부 80g, 계란 1, 대파 | **Identical** |
| Steps | 볶음밥 방식 (4 steps) | 밥 비빔 방식 (5 steps) — **presentation differs** |
| Weekly impact | **Not in elementary weekly pool** | **Not in elementary weekly pool** |

**Action:** No change. Different toddler slots; not elementary weekly scope.

### Pair 2: `recipe_0445` ↔ `recipe_0512` (참치또띠아랩 / 참치또띠아롤)

| Aspect | recipe_0445 | recipe_0512 |
|---|---|---|
| Audience | elementary (lunch) | elementary (snack) |
| Ingredients | 또띠아, 참치 1/2캔, 양배추, 오이, 마요, 소금 | **Identical** |
| Steps | 5 steps — wrap & halve | 5 steps — roll & slice (1cm pieces) |
| Meal slot | lunch browse | snack browse |

**Action:** `recipe_0445` kept as canonical browse entry. `recipe_0512` **weekly-excluded only** (see below). Browse/feed unchanged for both.

---

## RECIPES_EXCLUDED_FROM_WEEKLY

| ID | Name | Reason |
|---|---|---|
| recipe_0512 | 참치또띠아롤 | Ingredient-identical to recipe_0445; weekly rotation dedupe without deleting catalog entry |

File: `elementaryWeeklyPlanExclusions.ts` — applies to breakfast **and** dinner weekly candidate lists via `isElementaryWeeklyExcluded()`.

---

## WEEKLY_AVOID_RECIPE_IDS

New optional 3rd parameter on both elementary weekly generators:

```typescript
type ElementaryWeeklyPlanGenerateOptions = {
  avoidRecipeIds?: readonly string[];
};

generateElementaryBreakfastWeek(seed?, recipes?, options?)
generateElementaryDinnerWeek(seed?, recipes?, options?)
```

**Behavior:**

1. Filter candidates excluding `avoidRecipeIds` before generation
2. Try alternate seed suffixes (`:alt-1` … `:alt-9`) if filtered pool cannot fill 7 slots
3. Graceful fallback: if still insufficient, retry with full pool and `:fallback` seed suffix (logged in seed string)
4. When `avoidRecipeIds` **not** passed: single seed path unchanged → **7-day regression preserved**
5. No infinite loops (bounded alt attempts + single fallback)

Shared helpers: `filterWeeklyCandidatesByAvoid()`, `weekOverlapsAvoid()` in `elementaryWeeklyPlanCommon.ts`.

---

## BREAKFAST_14_DAY_TEST

| Metric | Value |
|---|---|
| Seeds tested | 200 |
| Success (14 unique IDs across 2 weeks) | **200 / 200 (100%)** |
| Cross-week duplicate overlap | **0** |
| Fallback triggered | **0** |
| Fail | **0** |

Pool: 45 candidates (unchanged from Sprint 2).

---

## DINNER_14_DAY_TEST

| Metric | Value |
|---|---|
| Seeds tested | 200 |
| Success (14 unique IDs across 2 weeks) | **200 / 200 (100%)** |
| Cross-week duplicate overlap | **0** |
| Fallback triggered | **0** |
| Fail | **0** |

Pool: 27 candidates (expanded from 17).

---

## DUPLICATE_RATE

**0%** across 400 two-week seed pairs (200 breakfast + 200 dinner).

---

## FALLBACK_COUNT

**0** — no seed required `:fallback` suffix in 200×2 tests. Filtered pool (27−7=20, 45−7=38) always sufficient for week 2 without reuse.

---

## DETERMINISTIC_SEED

**YES** — verified:

- Same seed without `avoidRecipeIds` → identical week (dinner seed 42, breakfast seed 42)
- Existing 7-day UI seeds unchanged
- `avoidRecipeIds` only affects cross-week generation path

---

## FILES_CHANGED

| File | Change |
|---|---|
| `data/recipes/elementaryDinnerPoolPromotions.ts` | **Added** — 10 lunch→dinner mealType promotions |
| `data/recipes/elementaryWeeklyPlanExclusions.ts` | **Added** — weekly-only exclusion for recipe_0512 |
| `data/recipes/elementaryWeeklyPlanCommon.ts` | `ElementaryWeeklyPlanGenerateOptions`, `filterWeeklyCandidatesByAvoid`, `weekOverlapsAvoid` |
| `data/recipes/elementaryDinnerWeeklyPlan.ts` | `avoidRecipeIds` support, weekly exclusion filter |
| `data/recipes/elementaryBreakfastWeeklyPlan.ts` | `avoidRecipeIds` support, weekly exclusion filter |
| `data/recipes/deriveRecipeStandardMetadata.ts` | Merge `ELEMENTARY_DINNER_MEAL_TYPE_PROMOTIONS` |
| `scripts/test-elementary-dinner-weekly-plan.ts` | Pool expectation 17 → ≥27 |
| `scripts/test-elementary-weekly-sprint3.ts` | **Added** — Sprint 3 QA (14-day, avoidRecipeIds, pool) |

**Not changed:** UI screens, routes, AdMob, baby/toddler data, catalog batch files, new images.

---

## REGRESSION

| Test | Result |
|---|---|
| `test-elementary-dinner-weekly-plan.ts` | **PASS** (pool 27, seed 42 deterministic, 7-day unique) |
| `test-elementary-breakfast-weekly-plan.ts` | **PASS** |
| `test-elementary-weekly-sprint3.ts` | **PASS** |
| `test-child-search-filter.ts` | **PASS** (catalog 517, elementary browse 78) |
| `test-child-meal-planning-integrated.ts` | **PASS** |

Verified:

- 7-day within-week: no duplicate recipeIds
- 14-day cross-week: no overlap with `avoidRecipeIds`
- Same seed deterministic (no avoid)
- Pool insufficient fallback path exists (not triggered at current pool sizes)
- Routes `/elementary-breakfast-week`, `/elementary-dinner-week`, `/elementary-browse` wired
- recipeId/seed click paths unchanged

---

## BLOCKERS

**None.**

---

## WARNINGS

1. **Dinner expansion via promotion only** — no new catalog recipes/images; pool = 27 (minimum met, not +15 new authored recipes)
2. **recipe_0463 / recipe_0486** toddler pair untouched — still ingredient-identical across toddler slots
3. **recipe_0512** remains in browse/snack feed — only excluded from weekly rotation
4. **14-day UI not built** — generator API ready; UI sprint deferred per scope
5. **Fallback path untested at scale** — current pools large enough that `:fallback` never fired in 400 tests; would activate if pool shrinks below 14

---

## READY_FOR_WEEKLY_UI_UPGRADE

**YES**

Generator supports:

- Week 1: `generateElementaryDinnerWeek(seed)`
- Week 2: `generateElementaryDinnerWeek(seed2, undefined, { avoidRecipeIds: week1Ids })`
- Same pattern for breakfast

14-day UI can consume this API without further data-layer changes.

---

## RESULT

**PASS**

| Goal | Status |
|---|---|
| Dinner pool ≥ 27 | ✅ 27 |
| Cross-week `avoidRecipeIds` | ✅ Implemented |
| 14-day 100% success (200 seeds) | ✅ Breakfast + dinner |
| 7-day regression | ✅ Preserved |
| Duplicate pair handling | ✅ Weekly exclusion (no forced delete) |
| UI unchanged | ✅ |
| Baby/toddler untouched | ✅ |
| No arbitrary nutrition | ✅ |

---

## Test commands

```bash
cd apps/todays-menu
npx tsx scripts/test-elementary-weekly-sprint3.ts
npx tsx scripts/test-elementary-dinner-weekly-plan.ts
npx tsx scripts/test-elementary-breakfast-weekly-plan.ts
npx tsx scripts/test-child-search-filter.ts
npx tsx scripts/test-child-meal-planning-integrated.ts
```

---

*Next sprint: on hold per instruction.*
