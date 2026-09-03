# HANKKI_BABY_BATCH_COOKING_REPORT

Sprint: HANKKI v1.1 — Baby Multi-Recipe Batch Cooking  
Date: 2026-08-29

---

## BABY_TOTAL: 70
## SCALABLE: 61
## REVIEW_REQUIRED: 9
## BATCH_FRIENDLY: 63

---

## ENTRY_POINT

| Surface | Entry |
|---------|-------|
| **Baby weekly** (`/baby-food-week`) | 「재료 한 번에 준비하기」 button in footer |

Weekly plan must be loaded; session initialized with current stage + 7 slots (all **unchecked** by default).

---

## ROUTE

| Step | Route |
|------|-------|
| Menu selection + portions | `/baby-food-batch` |
| Aggregated ingredients | `/baby-food-batch-result` |

---

## MENU_SELECTION

- Weekly 7 slots shown with **checkboxes**
- Initial state: **all OFF** (user opts in)
- Selection count: 「3개 메뉴 선택」
- `batchCooking = friendly` → small badge 「한 번에 만들기 좋은 메뉴」 (not storage advice)
- Button disabled when 0 selected + hint copy

---

## PORTION_SELECTION

- **Per-recipe** portion (not global multiplier)
- Default: **1회분** per recipe
- `scalable` → 1 / 3 / 6 chips
- `review_required` → **1회분 fixed** (UI shows fixed label; scaling ignored in aggregation)
- Implemented via existing `classifyBabyPortionScaling` + `scaleBabyIngredientAmount`

---

## INGREDIENT_AGGREGATION

Pipeline:

```
selected recipes × per-recipe portion
  → scaleBabyIngredientAmount per ingredient
  → GroceryIngredientLine[]
  → mergeGroceryIngredients (IIE normalize + same unit merge)
  → baby display groups + fraction-friendly formatting
```

Only user-selected recipes included. No auto-recommendation of which menus to batch together.

---

## NORMALIZATION

Reuses `resolveIngredient` / `normalizeIngredientLine` from grocery IIE:

- Canonical name via ingredient registry + alias index
- Merge key: `canonicalName::unit`
- No new arbitrary aliases introduced

---

## UNIT_MERGING

**Merged when same canonical + same unit:**

- g + g, ml + ml, 큰술 + 큰술, 작은술 + 작은술, 꼬집 + 꼬집

**Kept separate when units differ:**

- e.g. 우유 100ml + 우유 2큰술 → two lines
- Note: 「단위가 달라 따로 표시해요.」 when same display name has multiple units

**No arbitrary unit conversion.**

---

## FRACTION_SUPPORT

- Merge uses numeric sum internally (`parseIngredientAmount`)
- Display via `formatExactFraction` → e.g. 1/4 + 1/4 = **1/2작은술**
- No `0.750000001` float artifacts in UI

---

## REVIEW_REQUIRED_BEHAVIOR

- Portion chips hidden; shows 「1회분」
- `scaleBabyIngredientAmount(..., n, 'review_required')` returns original amount for n > 1
- Batch UI does not break; recipe still aggregatable at 1× base amounts

---

## RESULT_UI

**Title:** 준비할 재료  
**Subtitle:** 선택한 메뉴에 필요한 재료를 모았어요.

Sections (IIE category mapping):

| Group | Categories |
|-------|------------|
| 곡류 | grains |
| 육류/생선 | meat, seafood |
| 채소/과일 | vegetables |
| 기타 | dairy, eggs, seasonings, others |

Top: selected menus with portion (tap → recipe detail).

---

## SAFETY_GUIDANCE

Result screen footer:

- 「새로운 식품은 한 번에 하나씩 추가하며 반응을 살펴보세요.」
- 「이미 먹어본 재료를 중심으로 활용해보세요.」

No refrigeration/freezing/thawing guidance. No medical/prescriptive language.

---

## SHOPPING

MVP: **ingredient list only**. No forced link to shopping flow.

---

## COUPANG

**Hidden** — no affiliate banner on batch result (same policy as baby detail).

---

## ADMOB

**None** on batch screens.

---

## PERSISTENCE

- **Session-only** in-memory state (`babyBatchCookingSession.ts`)
- Selection resets when re-entering from weekly (fresh session)
- Not persisted to AsyncStorage (separate from weekly plan storage)

---

## ANALYTICS

| Event | Payload |
|-------|---------|
| `baby_batch_cooking_open` | `stage`, `selected_count` |
| `baby_batch_recipe_toggle` | `stage`, `recipe_id`, `selected_count` |
| `baby_batch_portion_change` | `stage`, `recipe_id`, `portion` |
| `baby_batch_ingredient_view` | `stage`, `selected_count` |

No menu names, ingredient names, age, or PII. Total events: **39**.

---

## FILES_CHANGED

**New**
- `services/babyFood/buildBabyBatchGroceryList.ts`
- `services/babyFood/formatBabyBatchAmount.ts`
- `services/babyFood/babyBatchCookingSession.ts`
- `constants/babyBatchCookingCopy.ts`
- `components/babyFood/BabyBatchCookingSelectScreen.tsx`
- `components/babyFood/BabyBatchCookingResultScreen.tsx`
- `app/baby-food-batch.tsx`
- `app/baby-food-batch-result.tsx`
- `scripts/test-baby-batch-cooking.ts`
- `scripts/reports/HANKKI_BABY_BATCH_COOKING_REPORT.md`

**Modified**
- `constants/appRoutes.ts`
- `components/babyFood/BabyFoodWeeklyPlanScreen.tsx` — entry button + session init
- `services/analytics/analyticsEvents.ts`, `analytics.ts`, `index.ts`
- `app/_layout.tsx`, `package.json`, `scripts/test-analytics-events.ts`

**Not changed:** recipes, baby safety policy, Coupang detail gate, portion scaling rules.

---

## TEST_RESULTS

```
npm run test:baby-batch-cooking         → PASS (scenarios A–I)
npm run test:baby-weekly-plan           → PASS
npm run test:baby-food-ui               → PASS
npm run test:child-detail-implementation → PASS
npm run test:child-search-filter        → PASS
npm run test:analytics-events           → PASS (39 events)
npm run test:family-audience            → PASS
npm run test:home-final-qa              → PASS
```

---

## REGRESSIONS

| Check | Status |
|-------|--------|
| Baby weekly 70 / 17×3+19 | PASS |
| Baby feed/search/filter | PASS |
| Baby 1/3/6 detail | PASS |
| Portion 61/9 counts | PASS |
| No recipe edits | PASS |

---

## RISKS

1. **IIE normalization gaps** — uncommon ingredient names may not merge; shown as separate lines (safe default).
2. **Different-unit same ingredient** — user sees two lines + note; no conversion attempted.
3. **Session-only state** — leaving app clears batch selection (intentional MVP).

---

## READY_FOR_TODDLER_WEEKLY

**YES** — aggregation pipeline is recipe-agnostic; toddler weekly can reuse with toddler eligibility gate.

---

## READY_FOR_BABY_GROCERY_CHECKLIST

**YES** — `GroceryListItem[]` output + category groups are ready for a future checklist/shopping adapter without Coupang on baby flows.
