# HANKKI_CHILD_DISCOVERY_AND_MEAL_PLANNING_REPORT

**Sprint:** HANKKI v1.1 — Child Discovery & Meal Planning Audit  
**Date:** 2026-08-28  
**Scope:** AUDIT / ARCHITECTURE ONLY — no code, recipe, image, or policy changes

---

## Executive summary

222 child recipes are **production-ready in feeds and detail**, but **not discoverable via app search**. Weekly planning exists only for **elementary breakfast** (45 candidates, full UI + storage + share). Baby portion scaling (1/3/6) works on detail; batch-cooking is **classified in code but not exposed in UI**. Multi-recipe ingredient aggregation exists for **meal-planning**, not child weekly plans.

**Recommendation:** Implement **child-context search + lightweight filters** first, then extend **weekly plan generator** to baby (stage-scoped) and toddler (single-slot MVP), then **elementary dinner 7-day**. **Batch #5 content is not blocking** these features.

---

## 1. CURRENT_SEARCH

### What search indexes today

| Source | Path | ~Count | IDs |
|--------|------|--------|-----|
| Core KR recipes | `data/recipes/coreRecipeService.ts` | ~30 | `core_kr_*` |
| Gold meals library | `library/gold-meals/` | 20 | `gold_*` |
| JSON master | `recipes/index.ts` | 3 | slug |
| Legacy menus | `services/recommendation/menuCatalog.ts` | ~40 | `homemade_*`, etc. |

**Index builder:** `services/search/recipeSearchIndex.ts`  
**Query:** `services/search/recipeSearchService.ts` — title + ingredient substring only, max 40 results  
**UI:** `components/search/RecipeSearchScreen.tsx` at `/search` (route registered; **Home entry unwired**)

### HANKKI 517 / child 222

**Not in search index.** `HANKKI_RECIPES` (`recipe_0001`–`recipe_0517`) is used for Home rec (`goldMealCatalog.ts`) and child feeds, but **never fed into `buildRecipeSearchIndex()`**.

Fields **not searched** even when wired: `searchTags`, `tags`, `category`, `familyAudience`, `standardMetadata`, `decisionTags`.

### Example query behavior (today)

| Query | Current behavior |
|-------|------------------|
| 계란 / 소고기 / 브로콜리 | Matches **legacy** recipes whose indexed ingredient names contain the term; HANKKI child rows **never appear** |
| 주먹밥 | Legacy title/ingredient match only; HANKKI `소고기주먹밥` etc. **absent** |
| 이유식 / 유아식 / 초등 | No child-specific routing; may match unrelated legacy titles if substring hits |

### Exclusion vs search

| Surface | Baby+toddler approved (144) | Elementary (78) |
|---------|------------------------------|-----------------|
| Home / Fridge auto | **Excluded** (`isExcludedFromGeneralHomeFeed`) | **Included** |
| Favorites / Recent | Not excluded | Not excluded |
| Text search | **No exclusion policy** (moot — not indexed) | Same |

Design intent (`test-fridge-raid.ts`): home exclusion is **Fridge/Home only**; user-intent surfaces (search, favorites) must stay unchanged.

---

## CHILD_SEARCH_SUPPORT

| Capability | Status |
|------------|--------|
| HANKKI 517 searchable | **NO** |
| Baby 70 searchable | **NO** |
| Toddler 74 searchable | **NO** |
| Elementary 78 searchable | **NO** |
| Ingredient search (child) | **NO** |
| Tag / audience search | **NO** |
| Child feed browse | **YES** (stage / meal-type tabs only) |

### Proposed SEARCH_POLICY (for implementation)

| Rule | Meaning |
|------|---------|
| **EXACT_MENU_ALLOW** | In **child-context search** (baby/toddler/elementary screens), match `name` + `searchTags`; exact/near-exact menu names always allowed |
| **CHILD_CONTEXT_ALLOW** | Ingredient and tag search **only** inside child browse — never mixed into adult default search results |
| **GENERAL_INGREDIENT_EXCLUDE** | Global `/search` must **not** surface baby/toddler recipes from generic ingredient queries (e.g. “계란” → adult pool only) |
| **ELEMENTARY_INGREDIENT_OPTIONAL** | Elementary is not home-excluded; policy choice: allow in general search **or** restrict to child-context — recommend **child-context default**, optional “전체 검색” toggle later |
| **AUDIENCE_KEYWORD_ROUTE** | Queries “이유식/유아식/초등” route to respective feed, not raw catalog dump |

---

## 2–3. FILTERS & UX

### BABY_FILTERS_AVAILABLE (metadata → UI-ready)

| Filter | Source | Feed pool | Notes |
|--------|--------|-----------|-------|
| 단계 (시작/적응/확장/전환) | `babyFood.stage` | 17 / 17 / 17 / 19 | **Already primary tab UI** |
| 형태 (미음/죽/퓨레/무른밥/진밥/핑거) | `babyFood.texture` | All 70 | User labels in `childDetailCopy.ts`; filter-ready |
| 주재료 | `standardMetadata.mainIngredients` + ingredient names | All 70 | Needs curated chip list (소고기, 닭, 두부, 계란, 생선, 채소, 과일) |
| 알레르기 | `standardMetadata.allergyTags` | All 70 | Labels exist (`BABY_FOOD_FEED_ALLERGY_LABELS`) |
| 1/3/6회분 | `classifyBabyPortionScaling()` | 61 scalable / 9 review | Detail only today |
| 대량조리 | `classifyBabyBatchCooking()` | 63 friendly | **Not in UI** — runtime only |

### TODDLER_FILTERS_AVAILABLE

| Filter | Source | Pool | Notes |
|--------|--------|------|-------|
| 끼니 | `intendedMealTypes` + `mealTypes` | B15 / L19 / D24 / S16 | **Already tab UI** |
| 시간 (10/15/20분) | `recipe.time` | ~majority ≤20 | Threshold filters trivial |
| 주재료 | `mainIngredients` / names | All 74 | Heuristic chips |
| 알레르기 | `allergyTags` | Partial coverage | Same pattern as baby |
| 형태 (한그릇/국/덮밥/간식…) | **Not stored** | — | Requires **name/category classifier** (same pattern as `classifyWeeklyPlanDiversity` for elementary) |

### ELEMENTARY_FILTERS_AVAILABLE

| Filter | Source | Count hint | Notes |
|--------|--------|------------|-------|
| 아침 | `mealTypes` breakfast | 45 weekly-eligible | Weekly plan uses subset |
| 점심/도시락 | `mealTypes` lunch | ~24 | No dedicated UI |
| 저녁 | `mealTypes` dinner | ~17 | Batch #4 focus |
| 방과후 간식 | `mealTypes` snack | ~12 | Batch #4 focus |
| 시간 | `time` | Most ≤20 | Ready |
| 형태 (주먹밥/토스트/덮밥…) | name + `dishType` heuristics | — | Partially done in weekly diversity |
| `schoolMorningFriendly` | override metadata | breakfast only | Internal; map to “아침에 좋아요” badge |

### RECOMMENDED_FILTER_UX

**Baby feed**
```
[시작기 | 적응기 | 확장기 | 전환기]   ← keep
[주재료 ▼] [형태 ▼] [더보기 ▼]
  더보기: 알레르기 제외 · 대량조리 좋아요 · 3/6회분 가능
결과: "메뉴 12개" count chip
```

**Toddler feed**
```
[아침 | 점심 | 저녁 | 간식]   ← keep
[시간 ▼] [주재료 ▼] [더보기 ▼]
결과 count visible
```

**Elementary hub (new)**
```
[오늘] [이번 주 아침] [저녁] [간식]
Filter bar on list views only — not on weekly card
[시간 ▼] [형태 ▼] [주재료 ▼]
```

**Rules:** Never show enum strings (`thin_puree`, `schoolMorningFriendly`). Use existing user copy mappers (`childDetailCopy.ts`, feed copy constants).

---

## 4. BABY_WEEKLY_PLAN

### Feasibility: **YES — high confidence**

| Stage | Feed eligible | 7 unique slots? |
|-------|---------------|-----------------|
| 시작기 | 17 | ✅ |
| 적응기 | 17 | ✅ |
| 확장기 | 17 | ✅ |
| 전환기 | 19 | ✅ |

### Copy / safety alignment

- Use **“이번 주 메뉴 골라보기”** / **“7일 메뉴 참고”** — avoid “식단”, “처방”, “영양 설계”
- **Do not** auto-detect “new food introduction” or allergy progression
- Mixed-stage recipes: feed already requires `babyFood.stage === babySafetyReview.stage` — weekly generator should use **same gate** (`listBabyFoodFeedRecipes(stage)`)
- Weekly plan does **not** conflict with detail safety copy (texture, salt/sugar flags remain on detail)

### Suggested diversity (reuse elementary engine)

| Rule | Type |
|------|------|
| 7 distinct recipeIds | Hard |
| No consecutive same primary protein | Soft |
| Texture variety (puree ↔ mashed ↔ soft chunks) | Soft |
| No auto “new ingredient” sequencing | **Never** |

### BABY_WEEKLY_DATA_READINESS: **ENOUGH**

---

## 5. BABY_BATCH_COOKING

### Current data

| Metric | Count |
|--------|-------|
| Catalog baby | 70 |
| Portion scalable | 61 |
| Portion review_required | 9 |
| Batch friendly | 63 |
| Batch single_meal / review | 7 |

**Implementation:** `data/recipes/babyPortionScaling.ts` — presets `[1,3,6]`, `scaleBabyIngredientAmount()`, `classifyBabyBatchCooking()`.

**UI today:** `BabyPortionPresetSelector` on `IngredientsScreen` (baby detail only). Shopping CTA **deferred** for baby. **No batch badge/filter.**

### BABY_BATCH_COOKING (recommended UX)

1. Detail: keep **[1회분 | 3회분 | 6회분]** (scalable only)
2. Feed filter/badge: **“한 번에 만들기 좋아요”** → `classifyBabyBatchCooking === 'friendly'`
3. Optional future: **“3일치 골라보기”** picker → ingredient sum

### PORTION_SCALABLE: **61/70 — production-ready**

### BATCH_FRIENDLY: **63/70 — metadata-ready, UI not wired**

### MULTI_RECIPE_INGREDIENT_AGGREGATION

| Layer | Exists? | Child-ready? |
|-------|---------|--------------|
| Single recipe | `buildRecipeShoppingList` + `mergeShoppingItems` | ✅ per recipe |
| Multi recipe | `mergeGroceryIngredients` (meal planning) | ✅ **pattern reusable** |
| Weekly plan → grocery | **Not connected** | Needs adapter: N recipes × portion multiplier |

**Feasibility:** **YES** for 2–3 selected baby recipes with same-unit merge (`parseIngredientAmount`). Edge cases: `review_required` amounts, discrete counts (계란 N개) — show per-recipe lines when merge unsafe.

**Constraints honored:** No storage-day numbers, no thaw safety text generation.

---

## 6. TODDLER_WEEKLY_PLAN

### Distribution (verified)

| Slot | Count |
|------|-------|
| breakfast | 15 |
| lunch | 19 |
| dinner | 24 |
| snack | 16 |
| **Total** | **74** |

### Structure options

| Option | Slots/week | Feasibility | Notes |
|--------|------------|-------------|-------|
| A. 하루 1끼 | 7 | ✅ **Best MVP** | User picks slot (default: clock-based meal) |
| B. 아침+저녁 | 14 | ⚠️ Marginal | Breakfast pool 15 — tight for uniqueness + diversity |
| C. 4끼 전체 | 28 | ❌ Not now | Snack 16 / breakfast 15 insufficient for 7 unique each |

### RECOMMENDED_TODDLER_MVP

**7-day single-meal plan** (one `mealType` per week, user-selectable tab):

- Reuse `generateElementaryBreakfastWeek` **search/backtracking** with `listToddlerMealFeedRecipes(mealType)` candidate pool
- Hard: 7 unique IDs, no consecutive identical form group (heuristic)
- Soft: protein variety, time spread
- Storage/share: clone `services/weeklyPlan/elementaryBreakfast*` pattern
- **No** toddler weekly exists today (`ToddlerMealFeedScreen` = round-robin only)

### Infrastructure reuse: **~80%** (generator + storage + share card template)

---

## 7. ELEMENTARY_WEEKLY_CURRENT & EXPANSION

### Current

- **이번 주 아침 7일** — live (`elementaryBreakfastWeeklyPlan.ts`, 45 candidates)
- Generator: seeded backtracking, hard + soft diversity
- UI + AsyncStorage + PNG share — complete

### Expansion options (78 total)

| Plan | Eligible pool (est.) | 7 unique? | Value |
|------|---------------------|-----------|-------|
| 이번 주 아침 | 45 | ✅ | **Shipped** |
| 이번 주 저녁 | ~17 | ✅ | **Highest next** |
| 방과후 간식 5일 (월–금) | ~12 | ✅ (5 slots) | High |
| 방과후 간식 7일 | ~12 | ⚠️ Marginal | Needs relaxed diversity |
| 도시락/점심 5일 | ~24 | ✅ | High (school week) |

### RECOMMENDED_ELEMENTARY_NEXT_PLAN

**#1 — Elementary dinner 7-day weekly plan**

- Pool ~17 post Batch #4 — sufficient for unique week
- Reuse breakfast generator with `mealTypes.includes('dinner')` eligibility
- New diversity axes: donburi vs fried rice vs stew (name/heuristic `formGroup`)
- Same share card pattern; copy: **“이번 주 저녁 메뉴”**

**#2 (follow-up) — Weekday snack plan (5 slots)**

---

## 8. REUSABLE_WEEKLY_INFRASTRUCTURE

| Component | Path | Reuse for |
|-----------|------|-----------|
| Plan types (`WeeklyMealPlan`, `babyStage?` on slot) | `recipeFamilyAudienceTypes.ts` | Baby / toddler / elem dinner |
| Backtracking generator | `elementaryBreakfastWeeklyPlan.ts` | All weekly variants |
| Eligibility gate | `isEligibleForChildFeed()` | All audiences |
| Storage pattern | `services/weeklyPlan/*Storage.ts` | New keys per audience/plan |
| Share capture | `*Share.ts` + share card component | Clone per plan |
| Display mapper | `*Display.ts` | Clone |
| Diversity classifiers | `classifyWeeklyPlanDiversity`, `formGroup` | Extend for toddler/elem dinner |

### Weekly diversity rules inventory

**Hard (elementary breakfast — never relax):**
- No consecutive `sandwich_toast`
- No consecutive `rice_ball`
- 7 unique recipeIds
- Block collision tags (spicy, hangover, side_dish, …)

**Soft (best-effort):**
- schoolMorningFriendly ≤ 4
- rice ≤ 3, bread ≤ 3
- ≥1 oatmeal, ≥1 other category
- long-cook / egg streak limits

**Portable to baby/toddler:** unique IDs, protein/form streaks, time spread.  
**Explicitly not portable:** auto new-food or medical allergy inference.

---

## 9. SEARCH + WEEKLY + BATCH — USER FLOW

```
Home
 └─ [이유식] [유아식] [초등]
       │         │         │
       ▼         ▼         ▼
   Baby hub   Toddler hub  Elementary hub
   [메뉴 찾기] [오늘 메뉴]  [오늘 | 주간 아침 | 저녁 | 간식]
   [이번 주]   [이번 주]    [메뉴 찾기]
       │         │         │
       ▼         ▼         ▼
   stage tab   meal tab   filters
   + filters   + filters  + list
       │         │         │
       └─────────┴─────────┘
                 ▼
           Recipe detail
           (baby: 1/3/6 + batch badge)
           (shopping / multi-select later)
```

**Principle:** One **child hub per audience**, shared detail stack, weekly plan as **peer tab** to “today/feed”, not a separate app area.

---

## 10. DATA SUFFICIENCY

| Audience | Count | Search/Filter | Weekly (MVP) | Batch | Verdict |
|----------|-------|---------------|--------------|-------|---------|
| **Baby** | 70 | **ENOUGH** | **ENOUGH** (17+/stage) | **ENOUGH** | Ready |
| **Toddler** | 74 | **ENOUGH** | **ENOUGH** (single-slot 7-day) | N/A | Ready for weekly MVP |
| **Elementary** | 78 | **ENOUGH** | **ENOUGH** dinner; **MARGINAL** snack×7 | N/A | Ready for dinner weekly |

### CONTENT_GAPS (recipe additions — not blocking MVP)

| Gap | Priority | Notes |
|-----|----------|-------|
| Toddler breakfast diversity | Low | 15 ok for 7-day; filters may feel tight |
| Elementary snack 7-day | Medium | 12 recipes — use 5-day plan or wait for Batch #5 snack |
| Toddler “form” filter accuracy | Low | Engineering heuristic, not content |
| General search HANKKI wiring | **Engineering** | Zero new recipes needed |

---

## FINAL SCORECARD

| Field | Value |
|-------|-------|
| **CURRENT_SEARCH** | Legacy ~90 items only; **HANKKI 517 / child 222 not indexed** |
| **CHILD_SEARCH_SUPPORT** | **NONE** (feeds only) |
| **BABY_FILTERS_AVAILABLE** | Stage ✅ texture ✅ allergy ✅ portion/batch ✅ (UI partial) |
| **TODDLER_FILTERS_AVAILABLE** | Meal ✅ time ✅ allergy ✅ form ❌ (heuristic needed) |
| **ELEMENTARY_FILTERS_AVAILABLE** | Meal ✅ time ✅ form partial ✅ schoolMorning internal |
| **RECOMMENDED_FILTER_UX** | 3-chip + “더보기”; count badge; no enum exposure |
| **BABY_WEEKLY_PLAN** | **Feasible** — stage-scoped 7-day, reuse elem generator |
| **BABY_WEEKLY_DATA_READINESS** | **ENOUGH** (17–19/stage) |
| **BABY_BATCH_COOKING** | Data ready; UI/badge/filter not wired |
| **PORTION_SCALABLE** | 61/70 |
| **BATCH_FRIENDLY** | 63/70 |
| **MULTI_RECIPE_INGREDIENT_AGGREGATION** | **Feasible** via `mergeGroceryIngredients` + portion multiplier |
| **TODDLER_WEEKLY_PLAN** | Not implemented; **feasible** |
| **RECOMMENDED_TODDLER_MVP** | **7-day × 1 mealType** (user-selected slot) |
| **ELEMENTARY_WEEKLY_CURRENT** | Breakfast 7-day ✅ (45 pool) |
| **RECOMMENDED_ELEMENTARY_NEXT_PLAN** | **Dinner 7-day** (#1), snack 5-day (#2) |
| **REUSABLE_WEEKLY_INFRASTRUCTURE** | **High** — types, generator, storage, share |
| **BABY_DATA_SUFFICIENCY** | **ENOUGH** |
| **TODDLER_DATA_SUFFICIENCY** | **ENOUGH** (MVP); **MARGINAL** for 4-meal/day week |
| **ELEMENTARY_DATA_SUFFICIENCY** | **ENOUGH** (MARGINAL for snack×7) |
| **CONTENT_GAPS** | Snack depth for 7-day elem; not blocking MVP |
| **RECOMMENDED_NEXT_FEATURE** | **1)** Child-context HANKKI search **2)** Baby/toddler filters **3)** Elem dinner weekly |
| **BATCH5_NEEDED_NOW** | **NO** |
| **FILES_MODIFIED** | **NONE** |
| **READY_FOR_CHILD_DISCOVERY_IMPLEMENTATION** | **YES** |
| **READY_FOR_WEEKLY_PLAN_EXPANSION** | **YES** |
| **READY_FOR_BATCH_COOKING_IMPLEMENTATION** | **YES** (UI wiring only) |

---

## Implementation sequence (recommended)

1. **Child search index** — wire `HANKKI_RECIPES` into child-context search with `SEARCH_POLICY` above (~2–3 days)
2. **Filter chips** — baby/toddler/elementary list views with count (+3–5 days)
3. **Baby weekly plan** — stage-scoped, copy-safe (~1 week, clone elem infra)
4. **Elementary dinner weekly** — highest user value (~1 week)
5. **Toddler weekly MVP** — single mealType (~1 week)
6. **Batch cooking badge + filter** — wire existing classifiers (~2 days)
7. **Multi-recipe ingredient sheet** — baby 3-day picker + grocery merge (~1 week)

**Batch #5 content** can run in parallel for snack/diversity depth; **not required** to ship steps 1–5.
