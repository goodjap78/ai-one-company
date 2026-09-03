# HANKKI_V1_1_SPRINT_2_AUDIT

Date: 2026-09-01  
Scope: Kids DB read-only audit (이유식 / 유아식 / 초등학생)  
Method: `npx tsx scripts/audit-kids-db-sprint2.ts` + `audit-child-hero-images.ts`  
Catalog total: **517** | Child feed eligible: **222** (70 + 74 + 78)

**No data was modified in this sprint.**

---

## Summary counts

| Metric | Value |
|---|---|
| BABY_FOOD_COUNT | **70** |
| TODDLER_MEAL_COUNT | **74** |
| ELEMENTARY_COUNT | **78** |

---

## BABY_BY_STAGE

| Stage (UI) | Count |
|---|---|
| 시작기 (early) | 17 |
| 적응기 (middle) | 17 |
| 확장기 (late) | 17 |
| 전환기 (completion) | 19 |

**Meal-type note:** Baby feed is **stage-first**, not slot-first. All 70 baby recipes carry `standardMetadata.mealTypes: ['lunch']` only — not used for browse filtering.

---

## TODDLER_BY_MEAL_TYPE

| Slot | Count |
|---|---|
| breakfast | 15 |
| lunch | 19 |
| dinner | 24 |
| snack | 16 |
| other | 0 |

**아침 충분 여부:** YES (15 ≥ 7 for weekly plan)

---

## ELEMENTARY_BY_MEAL_TYPE

| Slot | Count |
|---|---|
| breakfast | 45 |
| lunch | 30 |
| dinner | 17 |
| snack | 12 |
| other | 0 |

---

## BREAKFAST_ELEMENTARY_COUNT / DINNER_ELEMENTARY_COUNT

| Metric | Value |
|---|---|
| BREAKFAST_ELEMENTARY_COUNT | **45** |
| DINNER_ELEMENTARY_COUNT | **17** |

---

## Recipe field completeness (222 child feed recipes)

| Check | Result |
|---|---|
| RECIPES_COMPLETE | **222** |
| RECIPES_INCOMPLETE | **0** |

All child feed recipes have: ingredients + amounts, ≥2 steps, cook time, servings, `standardMetadata.mainIngredients`.

---

## Image status

| Metric | Value |
|---|---|
| IMAGE_MISSING | **0** |
| IMAGE_DUPLICATES (shared heroImageKey within child pool) | **0** |
| HERO_OK (cross-check) | **222 / 222** |

Placeholder runtime fallback exists in `resolveMealImage` but **no child feed recipe** currently lacks a registered hero asset.

---

## Duplicates

| Type | Count | Details |
|---|---|---|
| NAME_DUPLICATES (exact) | **0** | — |
| NAME_DUPLICATES (normalized similar) | **0** | — |
| Ingredient-identical groups | **2** | See below |

**Ingredient-identical pairs (similar names, different IDs):**

1. `recipe_0463` 두부계란볶음밥 ↔ `recipe_0486` 두부계란밥 (toddler / elementary)
2. `recipe_0445` 참치또띠아랩 ↔ `recipe_0512` 참치또띠아롤 (toddler / elementary)

---

## Baby-specific fields (70)

| Field | Status |
|---|---|
| BABY_STAGE_MISSING | **0** |
| BABY_AGE_RANGE_MISSING | **17** (all `early` / 시작기 — `monthRange.bound: unspecified` by policy) |
| BABY_TEXTURE_MISSING | **0** |
| BABY_ALLERGY_ISSUES | **0** (standard `allergyTags` vs `babySafetyReview.allergyTagsNoted` aligned) |

**Present per recipe:** stage, texture, honeyListed, chokingCautions, cookingSafetyFlags, servings (`recipe.serving`), main ingredients (`standardMetadata.mainIngredients`).

**Not in schema:** explicit particle-size field (texture enum used instead); forbidden-ingredient list (boolean flags only).

---

## Toddler-specific status (74)

| Item | Status |
|---|---|
| Explicit age/month range | **No dedicated field** — scope in `toddlerSafetyPolicyTypes` (1–5y policy doc only) |
| `toddlerSafetyReview` approved | **74 / 74** |
| Allergy | `standardMetadata.allergyTags` populated where applicable |
| Difficulty | `standardMetadata.difficulty` + `recipe.difficulty` on all |
| Breakfast pool | **15** — sufficient for 7-day toddler weekly |

---

## Weekly plan connection

| Plan | Pool function | Pool size | Generator |
|---|---|---|---|
| 초등 아침 7일 | `listElementaryBreakfastWeekCandidates()` | **45** | `generateElementaryBreakfastWeek(seed)` |
| 초등 저녁 7일 | `listElementaryDinnerWeekCandidates()` | **17** | `generateElementaryDinnerWeek(seed)` |

**Eligibility:** elementary-only, explicit audience, target `mealType`, collision gate (`spicy`, `side_dish`, etc.).

**Seed / random:** mulberry32 RNG from normalized seed → shuffle → backtracking slot fill.

**Duplicate prevention:** **Within-week only** (consecutive form/protein caps, long-cook streaks, soft diversity). **No cross-week `avoidRecipeIds`** for elementary plans (unlike baby weekly plan).

**Fallback:** Returns `INSUFFICIENT_CANDIDATES` if pool < 7; soft diversity phases relax before hard rules.

| Test | Result |
|---|---|
| WEEKLY_BREAKFAST_POOL | **45** |
| WEEKLY_DINNER_POOL | **17** |
| 7-day generation (200 seeds each) | **100%** success |
| CAN_CREATE_7_DAY_WITHOUT_REPEAT | **YES** |
| CAN_CREATE_14_DAY_WITHOUT_REPEAT (independent seeds, zero overlap) | **NO** (0 / 50 seed pairs) |
| Pool capacity for 14 unique IDs | **YES** (45 breakfast, 17 dinner) |

**Interpretation:** Data pool can support 14 distinct recipes, but **current generator cannot produce back-to-back non-overlapping weeks** without new avoid-list logic.

---

## DATA_SCHEMA_CURRENT

| Field | Present in child recipes |
|---|---|
| calories | YES (`nutrition.calorie`) |
| protein | YES |
| carbs | YES (`nutrition.carbohydrate`) |
| fat | YES |
| sugar | NO |
| sodium | NO |
| fiber | NO |
| cost | NO |
| storage | NO |
| mealType | YES (`standardMetadata.mealTypes`) |
| ageGroup | YES (`familyAudience.audiences[]`) |
| allergy | YES (`standardMetadata.allergyTags`) |
| prepTime | NO (cook time only) |
| cookTime | YES (`time` + `standardMetadata.cookingTime`) |

## DATA_SCHEMA_MISSING_FOR_FUTURE

- sugar, sodium, fiber, cost, storage
- prepTime (separate from cookTime)
- explicit ageGroup enum (audiences[] used today)
- particleSize (baby uses texture enum)
- forbiddenIngredients list (honeyListed / caution flags only)

---

## TOP_20_DATA_QUALITY_ISSUES

1. **nutrition_unverified_shown (213)** — `nutrition.source: unverified` on most child recipes; values exist but are not verified for display
2. **baby_age_range_unspecified (17)** — 시작기 recipes intentionally omit closed month band (KDCA policy)
3. **ingredient-identical pairs (2)** — 두부계란볶음밥/두부계란밥, 참치또띠아랩/참치또띠아롤
4. **dinner weekly pool thin (17)** — only 3 recipes spare beyond 14-day unique capacity
5. **no cross-week dedupe** — elementary weekly generator can repeat menus across refreshes
6. **baby mealType metadata flat** — all tagged `lunch`; stage is the real axis
7. **toddler no authored age range** — policy scope only, not per-recipe
8. **snack elementary under-represented (12)** vs dinner (17) for browse diversity
9. **completion stage largest (19)** — transition recipes may need extra QA for family-table clarity
10. **unverified nutrition blocks calorie UI** — by design on child feeds, but limits future macro features

*(Issues 11–20 reserved for post-expansion QA; current audit surfaced 2 dominant patterns.)*

---

## BLOCKERS

**None** for v1.1 ship of existing child feeds and 7-day elementary weekly plans.

---

## WARNINGS

1. **2-week no-repeat not achievable** with current elementary weekly seed logic (always ≥1 overlap across independent weeks)
2. **17 baby 시작기 recipes** have `monthRange: unspecified` — intentional policy, but limits age-filter UX
3. **2 near-duplicate recipe pairs** (same ingredients, different names/IDs across toddler↔elementary)
4. **Dinner weekly pool = 17** — minimal headroom for diversity / 2-week expansion
5. **213 / 222** recipes carry unverified nutrition — future macro/calorie features need verification pass

---

## RECOMMENDED_NEXT_STEP

1. **Sprint 3 (data):** Expand elementary **dinner** pool (+10–15) and add **cross-week avoidRecipeIds** to elementary weekly generators before marketing “2주 식단”
2. **Optional metadata:** Add verified nutrition or hide macro fields until verified batch completes
3. **Dedupe review:** Merge or differentiate the 2 ingredient-identical pairs
4. **Baby 시작기:** Decide whether to keep `unspecified` month range or add honest `around` bands for filter UX

---

## RESULT

**PARTIAL**

- **PASS areas:** Counts locked (70/74/78), all recipes structurally complete, all hero images OK, 7-day weekly generation 100%, no name collisions, baby stage/texture complete
- **PARTIAL gaps:** 14-day no-repeat unsupported, thin dinner pool, unverified nutrition dominant, 2 near-duplicate recipes, baby month-range intentionally sparse on 시작기

---

## Audit artifacts

| File | Purpose |
|---|---|
| `scripts/audit-kids-db-sprint2.ts` | Re-runnable audit script |
| `scripts/reports/kids-db-audit-sprint2.json` | Machine-readable full output |
| `scripts/reports/child-hero-audit.json` | Image cross-check |

---

*Next sprint: on hold per instruction.*
