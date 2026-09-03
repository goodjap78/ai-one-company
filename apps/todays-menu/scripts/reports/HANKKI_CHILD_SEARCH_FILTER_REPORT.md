# HANKKI_CHILD_SEARCH_FILTER_REPORT

Sprint: HANKKI v1.1 — Child Context Search + Filter Implementation  
Date: 2026-08-28

---

## CHILD_SEARCH_ENABLED

| Area | Status |
|------|--------|
| **CHILD_SEARCH_ENABLED** | YES |
| **BABY_SEARCH** | YES — scoped to approved baby feed pool per stage tab |
| **TODDLER_SEARCH** | YES — scoped to approved toddler feed pool per meal tab |
| **ELEMENTARY_SEARCH** | YES — full 78-recipe browse screen |

---

## GLOBAL_SEARCH_POLICY

| Policy | Implementation |
|--------|----------------|
| **Legacy index** | Unchanged (~90 items via `recipeSearchIndex`) |
| **HANKKI supplement** | `searchHankkiGlobalSupplement()` merged in `recipeSearchService` |
| **EXACT_MENU_ALLOW** | Baby/toddler child recipes appear when query matches menu name (normalized, min 3 chars) |
| **GENERAL_INGREDIENT_EXCLUDE** | Ingredient/tag matches for baby-only and toddler-only recipes blocked in global supplement |
| **Elementary** | Explicit elementary + general recipes remain ingredient-searchable in global supplement |

Verified: `계란` global supplement → 0 baby/toddler hits (4 guarded recipes exist in catalog).

---

## BABY_FILTERS

Horizontal toggle chips (AND logic):

- **주재료**: 소고기, 닭고기, 두부, 계란, 생선, 채소, 과일
- **형태**: 미음, 퓌레, 죽, 무른밥, 진밥, 핑거푸드 (texture metadata + name heuristics)
- **대량조리**: 한 번에 만들기 좋은 메뉴 (`classifyBabyBatchCooking === 'friendly'`)
- **대량조리**: 1/3/6회분 가능 (`classifyBabyPortionScaling === 'scalable'`)
- **알레르기**: exclude selected allergen

Stage tabs preserved. Result count shown when search/filters active.

---

## TODDLER_FILTERS

- **시간**: 10 / 15 / 20분 이하
- **주재료**: 소고기, 닭고기, 두부, 계란, 생선
- **더보기**: 알레르기 exclude, 형태 (국/볶음밥/덮밥 — runtime name heuristic only)

Meal tabs preserved. Recommendation pick UI unchanged when no search/filters active.

---

## ELEMENTARY_FILTERS

- **끼니/상황**: 아침, 점심/도시락, 저녁, 방과후 간식
- **시간**: 10 / 15 / 20분 이하
- **주재료**: 소고기, 닭고기, 계란, 참치, 두부
- **형태**: 주먹밥, 김밥, 토스트, 덮밥, 볶음밥, 또띠아, 간식 (reuses `classifyWeeklyPlanDiversity` + name heuristics)

---

## ELEMENTARY_BROWSE_SCREEN

| Item | Detail |
|------|--------|
| Route | `/elementary-browse` (`ELEMENTARY_BROWSE_HREF`) |
| Entry | Home “초등” shortcut → browse; weekly screen link → browse; browse links back to weekly |
| Pool | 78 explicit elementary eligible recipes |
| UI | Search bar + filter chips + result count + recipe list |

---

## SEARCH_INDEX_STRATEGY

- **Child context**: Runtime text blob over eligible pool (name, category, searchTags, ingredients, mealTypes). No new persisted index. No recipe edits.
- **Global**: Legacy index unchanged + runtime HANKKI supplement with audience policy gate.

---

## FILTER_DERIVATION

| Audience | Source |
|----------|--------|
| Baby texture | `babyFood.texture` enum + recipe name patterns |
| Baby batch/scale | `babyPortionScaling.ts` classifiers |
| Toddler form | Runtime name/category heuristics (not stored as production truth) |
| Elementary form | `classifyWeeklyPlanDiversity()` + name patterns |
| All audiences | Main ingredient via ingredient/tag/category text match |

---

## SAFETY_ELIGIBILITY

All search/filter pools use existing feed eligibility:

- Baby: `listBabyFoodFeedRecipes(stage)` — approved baby-only explicit
- Toddler: `listToddlerMealFeedRecipes(mealType)` — approved toddler explicit
- Elementary: `listElementaryBrowseRecipes()` — explicit elementary via `isEligibleForChildFeed`

`needs_adaptation`, excluded, kids_meal-only rows never enter child search pools.

---

## ANALYTICS

| Event | Payload |
|-------|---------|
| `child_search` | audience, query_length, filter_types, result_count |
| `child_filter_change` | audience, filter_types, result_count |
| `child_search_recipe_click` | audience, recipe_id |

Forbidden: query text, PII, age/month data (`query` in FORBIDDEN_ANALYTICS_PARAM_KEYS).

---

## FILES_CHANGED

**New**

- `data/recipes/childSearchFilters.ts`
- `data/recipes/elementaryBrowseFeed.ts`
- `services/search/childRecipeSearch.ts`
- `services/search/globalHankkiSearchPolicy.ts`
- `constants/childSearchCopy.ts`
- `components/child/ChildSearchBar.tsx`
- `components/child/ChildToggleFilterRow.tsx`
- `components/child/BabyChildFilters.tsx`
- `components/child/ToddlerChildFilters.tsx`
- `components/child/ElementaryChildFilters.tsx`
- `components/child/ChildRecipeBrowseList.tsx`
- `components/elementary/ElementaryBrowseScreen.tsx`
- `app/elementary-browse.tsx`
- `scripts/test-child-search-filter.ts`
- `scripts/reports/HANKKI_CHILD_SEARCH_FILTER_REPORT.md`

**Modified**

- `services/search/recipeSearchService.ts` — HANKKI global supplement merge
- `services/analytics/analyticsEvents.ts` — 3 new events + types
- `services/analytics/analytics.ts` — track helpers
- `services/analytics/index.ts` — exports
- `constants/appRoutes.ts` — `ELEMENTARY_BROWSE_HREF`
- `components/babyFood/BabyFoodFeedScreen.tsx` — search + filters
- `components/toddlerMeals/ToddlerMealFeedScreen.tsx` — search + filters + browse mode
- `components/home/HomeComingSoonSection.tsx` — kids card → browse
- `components/elementaryBreakfast/ElementaryBreakfastWeeklyPlanScreen.tsx` — browse link
- `app/_layout.tsx` — route registration
- `package.json` — `test:child-search-filter`

**Not changed**: recipes, Home recommendation engine, batch content.

---

## TEST_RESULTS

```
npm run test:child-search-filter  → PASS
```

Coverage:

- Baby `소고기` → baby pool only
- Toddler `계란` → toddler pool only
- Elementary `주먹밥` → elementary pool only
- Global `계란` → 0 baby/toddler supplement hits
- Exact baby menu name → global supplement allow
- Filter AND (stage + main + texture)
- Counts 517 / 70 / 74 / 78
- Home exclusion 144, weekly candidates 45

---

## REGRESSIONS

| Check | Status |
|-------|--------|
| Baby feed 70 | PASS |
| Toddler feed 74 | PASS |
| Elementary browse 78 | PASS |
| Home/Fridge exclusion 144 | PASS |
| Weekly breakfast candidates 45 | PASS |
| Legacy search index module | Unchanged |
| Home rec engine | Not modified |

---

## RISKS

1. **Toddler form filter** — name heuristics only; may miss or over-match edge cases until metadata matures.
2. **Global exact-name threshold** — min 3 normalized chars; very short queries won't unlock baby/toddler by title.
3. **Home kids card** — now opens browse (not weekly directly); weekly reachable from browse + weekly screen cross-link.
4. **Elementary global ingredient search** — elementary recipes can appear in general search by ingredient (existing exposure policy preserved).

---

## READY_FOR_ELEMENTARY_DINNER_WEEKLY

**YES** — browse + search/filter infra in place; weekly generator pattern from breakfast can extend to dinner without blocking.

---

## READY_FOR_BABY_WEEKLY

**YES** — baby search/filter + batch/scale classifiers provide foundation; no weekly UI added this sprint.
