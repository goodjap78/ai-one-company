# SPRINT 63-A — SHOPPING / COUPANG MONETIZATION INTEGRATION AUDIT

**Date:** 2026-08-10  
**Scope:** Read-only audit — no production code, UI, or recipe data changes  
**App:** `apps/todays-menu` (HANKKI)  
**Baseline:** Sprint 61 Home LOCKED · Sprint 62 Personalization v1 LOCKED · Hero 300/300

---

## 1. Current menu-decision flow

### Flow A — Home Hero → 이 메뉴로 할게요 → ingredients → (cooking/detail)

| Step | Route | Component / service |
|------|-------|---------------------|
| Home tab | `/(tabs)` → `app/(tabs)/index.tsx` | `HomeScreen` |
| Hero accept CTA | — | `TodayMealCard` → `PrimaryDecisionButton` → `useHomeScreen.handleAccept` |
| Accept side effects | — | `acceptHomeRecommendation` (`homeService`) → `saveMeal` + `regenerateGroceryList` |
| Navigate | `/ingredients/[id]` | `app/ingredients/[id].tsx` → `IngredientsScreen` |
| Detail content | — | `RecipeHeroImage`, `RecipeIngredientsList`, `RecipeStepsList`, `RecipeDetailActions` |
| Cooking | `/cooking/[recipeId]` | `CookingScreen` — **implemented but not linked** from Ingredients (orphan route) |

Primary CTA label (homemade): `이 메뉴로 할게요 →` (`HankkiMessages.acceptButtonHomemade`).

### Flow B — 이것도 괜찮아요 → 메뉴 선택 → ingredients

| Step | Route | Component |
|------|-------|-----------|
| Alternatives row | — (stays on Home) | `AlternativeMealsRow` → `onSelect` → `useHomeScreen.handleSelectAlternative` |
| Swap hero | — | `promoteMealTimeSlotAlternative` — updates in-place recommendation, **no navigation** |
| User must still tap accept | same as Flow A | `handleAccept` → `/ingredients/[id]` |

Alternatives label: `alternativesSectionLabel` in `AlternativeMealsRow`.

### Flow C — Favorites → recipe/detail

| Step | Route | Component |
|------|-------|-----------|
| Home personal row | `/favorites` | `HomePersonalSection` |
| List | — | `FavoritesScreen` |
| Tap item | `/ingredients/[recipeId]` | **direct** — not `/recipe/[id]` |

### Flow D — Recently Viewed → recipe/detail

| Step | Route | Component |
|------|-------|-----------|
| Home personal row | `/recently-viewed` | `HomePersonalSection` |
| List | — | `ViewedRecipesScreen` |
| Tap item | `/ingredients/[recipeId]` | **direct** |
| History recorded | — | `recordViewedRecipe` on `IngredientsScreen` / `DeliveryScreen` mount |

### Flow E — Fridge Raid → 재료 선택 → 추천 → recipe/detail

| Step | Route | Component |
|------|-------|-----------|
| Home feature card | `/fridge-raid` | `HomeFeatureCards` → `HomeScreen.onFridgePress` |
| Select ingredients | `/fridge-raid` | `FridgeRaidScreen` — pantry chips + `IngredientTagEditor` |
| Results | `/fridge-raid/results` | `FridgeRaidResultsScreen` |
| Scoring | — | `buildFridgeRaidResultsBundle` → `buildFridgeRaidCandidates` + `alignFridgeIngredients` |
| Open recipe | `/recipe/[id]` | `FridgeRaidResultsScreen` / `FridgeRaidMealCard` → redirect route |
| Redirect | `/ingredients/[id]` or `/delivery/[id]` | `app/recipe/[id].tsx` → `IngredientsScreen` or `DeliveryScreen` |

### `/recipe/[id]` redirect (legacy / fridge entry)

`RecipeDetailRoute` resolves mode and replaces to `/ingredients/` or `/delivery/` — no standalone recipe UI.

---

## 2. Ingredient data structure (300 recipes)

**Source:** `data/recipes/batches/*` → `HANKKI_RECIPES` (300 recipes, 2,262 ingredient lines).

### Schema (`data/recipes/types.RecipeIngredient`)

| Field | Present | Notes |
|-------|---------|-------|
| `name` | 100% | Display + primary human label (e.g. `대파`, `돼지고기`) |
| `amount` | 100% | Free-form string (e.g. `1/2대`, `300g`, `2큰술`, `약간`) |
| `unit` | **not stored** | Parsed at runtime via `parseIngredientAmount` |
| `optional` | **0 lines** | Field exists on UI `Recipe` type but not populated in catalog |
| `seasoning` | via `group` | `main` 653 · `sub` 570 · `seasoning` 1039 |
| `ingredient category` | via IIE | Only when `resolveIngredient(name).known` |
| `tags` | 100% | Content tags (e.g. `주재료`, `양념`) — not shopping-specific |
| `iconKey` | 100% | 62 unique keys — asset registry + fridge `matchKey` |
| `canonicalName` | runtime | Set by `resolveRecipeIngredients` when IIE resolves |
| `ingredientId` | runtime | IIE id when known |

**Amount examples:** `1/2개`, `1/2대`, `1/3개`, `2큰술`, `1공기`, `약간`, `200g`.

Shopping quantity is separable from keyword: `name` is already clean; `amount` is separate.

---

## 3. Ingredient normalization 상태

Three parallel systems:

| Layer | Location | Coverage | Shopping use |
|-------|----------|----------|----------------|
| **IIE registry** | `library/ingredients/registry.ts` | ~30 canonical ingredients | `resolveIngredient` → `canonicalName`, `category` |
| **Icon alias map** | `data/ingredients/ingredientAliases.ts` | Name → `iconKey` for UI | Icons + fridge input |
| **Fridge matchKey** | `fridgeIngredientMatch.ts` | `iconKey` + noodle/rice_cake heuristics | Pantry ↔ recipe diff |

**Audit counts (automated, 2026-08-10):**

- IIE `known`: **75.7%** (1,712 / 2,262)
- IIE `unknown`: **24.3%** (550 lines) — e.g. 햄, 버섯, 시금치, 물, 양배추, 고등어
- Unique `iconKey`: **62**
- Unique display `name`: **191**
- Unknown lines map to **50** distinct `iconKey` values not in IIE

**Shopping keyword today:**

- **Stable path:** `ingredient.name` (Korean display name) — works for `대파` from `대파` + `1/2대`
- **IIE path:** `resolveIngredient(name).canonicalName` when `known` (e.g. `밥` → `쌀`)
- **Missing:** explicit `shoppingSearchKeyword` field — does not exist in codebase

**Grocery engine** (`services/grocery/`) uses IIE via `normalizeIngredientLine` → weak for unknowns.

**Risk:** `subtractPantryFromGrocery` compares IIE `normalizedName` vs pantry `normalizedName` (IIE canonical), while fridge uses `matchKey` (iconKey). Pantry–recipe diff can disagree between grocery engine and fridge raid.

---

## 4. Shopping entry point 후보

| ID | Location | Summary |
|----|----------|---------|
| A | Home — "오늘의 장보기" | New Home section |
| B | Post-hero accept → ingredients | Same screen as C after decision |
| C | Ingredients screen — 재료 목록 하단 | Contextual CTA on detail |
| D | Fridge Raid results | Missing list already rendered |
| E | Recipe detail / cooking | Mid-cook purchase |

---

## 5. 각 후보 UX 장단점

| Entry | UX naturalness | Ad rejection | Purchase intent | Impl. difficulty | Conversion potential | Flow interference |
|-------|----------------|--------------|-----------------|------------------|----------------------|-------------------|
| **A Home** | Medium — useful if user plans ahead | **High** if banner-style | Low pre-decision | Medium (new Home section — **violates Sprint 61 lock**) | Low–medium | **High** — competes with hero decision |
| **B Post-accept** | High — user committed to menu | Low if contextual | **High** | Low — same as C | **High** | Low |
| **C Ingredients** | **Highest** — ingredients top-of-mind | Low | **High** | **Low** — scroll footer CTA | **High** | Low |
| **D Fridge Raid** | High — "부족 N개" already shown | Low | High | **Low** — `FridgeShoppingBridge` stub exists | High | Low (separate flow) |
| **E Cooking** | Medium — urgent need | Medium | Medium | Medium — route orphan; need link + step UI | Medium | Medium — interrupts cook flow |

---

## 6. 가장 추천하는 위치

**Primary (Sprint 63-B):** **Ingredients screen contextual CTA** (covers B + C)

- User has chosen or browsed a specific recipe.
- `RecipeIngredientsList` already groups main / sub / seasoning.
- CTA pattern: `필요한 재료 장보기` → shopping surface with recipe-scoped list.

**Secondary:** **Fridge Raid results** — `부족한 재료만 장보기`

- `missingIngredients` already on each candidate; `FridgeShoppingBridge` + `FRIDGE_SHOPPING_CONFIG` ready for config-gated wiring.
- Best for "I have egg + onion, need kimchi + rice" scenario.

**Tertiary (later):** Home **compact shortcut** below personal section (not hero banner) — e.g. link to aggregated grocery from saved meals — only after single-recipe shopping proves out.

**Avoid:** Hero overlay, recommendation-between ads, Home first-screen banners.

---

## 7. Fridge Raid 연동 가능성

**Yes — architecture already supports it.**

- `buildFridgeRecipeIndex` → `requiredIngredients` with `matchKey`, `name`, `group`
- `alignFridgeIngredients` → `matchedIngredients`, `missingIngredients`, `missingCount`
- UI: `FridgeRaidMealCard` shows matched vs missing lists
- Shopping slot: `FridgeShoppingBridge` at bottom of `FridgeRaidResultsScreen` (currently returns `null`)

`FRIDGE_SHOPPING_CONFIG`: `enabled: false`, no URLs — intentional MVP guard.

---

## 8. Missing ingredient 계산 가능 여부

| Context | Mechanism | Status |
|---------|-----------|--------|
| Fridge raid (per candidate) | `alignFridgeIngredients` + pantry `matchKey` set | **Ready** |
| Single recipe vs pantry | Reuse `getFridgeRecipeIndexEntry` + `alignFridgeIngredients` | **Ready** (no UI hook yet) |
| Multi-meal grocery list | `buildGroceryListSnapshot` + `subtractPantryFromGrocery` | **Partial** — IIE normalization gap; saved meals only; no UI |
| Optional ingredients | Catalog has `optional: 0` | N/A today |
| Seasoning in missing list | Fridge excludes most seasonings except `TIER_SEASONING_KEYS` | By design — shopping list should mirror same policy |

**Example (kimchi fried rice):** User pantry: 계란, 양파 → candidate shows missing: 김치, 밥, 대파 via existing alignment.

---

## 9. Product matching architecture (design only)

```
recipeIngredient (name, amount, iconKey, group)
        ↓
normalizedIngredient
   ├─ matchKey (iconKey + fridge heuristics)     ← EXISTS (fridge)
   ├─ canonicalName (IIE)                        ← PARTIAL (75.7%)
   └─ displayName (recipe.name)                  ← EXISTS
        ↓
shoppingSearchKeyword                           ← NEEDED
   propose: known → canonicalName; else → name
   optional: iconKey → Korean label lookup table
        ↓
product search (Coupang API / deep link)        ← NOT IMPLEMENTED
        ↓
product candidates                              ← NOT IMPLEMENTED
        ↓
affiliate link + disclosure                     ← CONFIG STUB ONLY
```

**Already exists:**

- Ingredient extraction, merge, category grouping (`services/grocery/`)
- `GroceryExtensions.shoppingAdapter` placeholder
- `Ingredient.extensions.shopping` placeholder
- `FRIDGE_SHOPPING_CONFIG.disclosureText` field (unused)

**Needed:**

- `buildShoppingSearchKeyword(ingredient)` helper (single source)
- Optional expansion of IIE registry OR keyword map for 50 unknown iconKeys
- Shopping adapter service (provider-agnostic)
- Affiliate URL builder + outbound open handler
- UI product card component

---

## 10. 필요한 신규 components / services (minimal)

| Piece | Proposal |
|-------|----------|
| **Types** | `types/shopping.ts` — `ShoppingListItem`, `ShoppingProvider`, `AffiliateLink` |
| **Service** | `services/shopping/buildRecipeShoppingList.ts` — recipe + optional pantry → missing items |
| **Service** | `services/shopping/shoppingKeyword.ts` — keyword from ingredient line |
| **Service** | `services/shopping/shoppingAdapter.ts` — stub → future Coupang |
| **Hook** | `hooks/useRecipeShoppingList(recipeId)` |
| **Route** | `app/shopping/[recipeId].tsx` or `app/shopping/missing.tsx` with query params |
| **UI** | `ShoppingListScreen`, `ShoppingIngredientRow`, `ShoppingDisclosureFooter` |
| **UI** | `IngredientsShoppingCta` — footer on `IngredientsScreen` |
| **Wire** | `FridgeShoppingBridge` — render when config enabled |
| **Config** | Extend `fridgeShoppingConfig` or `constants/shoppingConfig.ts` |

No changes to recommendation engine, hero, or personalization.

---

## 11. Home 광고 필요 여부

**No — not for MVP monetization.**

Contextual shopping after menu decision (ingredients / fridge missing) matches HANKKI's decision-first Home. Home hero ads would hurt trust and Sprint 61 layout lock.

Optional later: subtle **non-banner** shortcut to aggregated list (saved meals grocery) in personal/tools area — not priority for 63-B.

---

## 12. UX 위험요소

1. **Home banner / hero ads** — breaks production-locked layout and decision flow.
2. **IIE vs matchKey mismatch** — user "has" ingredient in pantry but shopping still lists it (or vice versa).
3. **밥 → 쌀 canonicalization** — Coupang search for `쌀` vs user expectation `밥`.
4. **Seasoning overload** — listing every 양념 feels like upsell; follow fridge tier policy.
5. **Affiliate disclosure** — required placement before outbound tap; legal copy from official policy (not invented in app).
6. **Cooking flow interruption** — only add shopping after explicit user action.
7. **Delivery mode** — shopping CTA should not appear on `/delivery/[id]`.
8. **External link friction** — deep link vs in-app WebView affects conversion and policy compliance.

---

## 13. API 연결 전 준비 작업

1. Define `shoppingSearchKeyword` resolution rules (+ tests).
2. Implement `buildRecipeShoppingList(recipeId, pantry?)` using **matchKey** alignment (align with fridge, not only IIE).
3. Unify pantry subtraction strategy across grocery engine and shopping list.
4. Provider config surface (API keys, affiliate IDs) — env / remote config, not hardcoded.
5. Disclosure UI placement (shopping screen footer + optional inline on CTA sheet).
6. Analytics events (tap CTA, outbound link, recipeId, ingredient keys) — stub names in config.
7. QA fixtures: 5 recipes with known missing sets + fridge raid scenarios.
8. Legal / Coupang affiliate policy review for disclosure text and link format.

---

## 14. Sprint 63-B 권장 범위

**In scope:**

- `shoppingKeyword` + `buildRecipeShoppingList` (recipe-scoped, pantry-aware, matchKey-based)
- Ingredients screen contextual CTA → new shopping list screen (static / mock products or single outbound search URL per item — **no full Coupang API required for first ship**)
- Enable `FridgeShoppingBridge` UI shell with `FRIDGE_SHOPPING_CONFIG` gating
- Disclosure footer placeholder (no legal copy — layout only)
- Tests: `test:shopping-keyword`, `test:recipe-shopping-list`

**Out of scope (63-B):**

- Coupang Open API production integration (unless policy ready)
- Home UI layout changes (Sprint 61 lock)
- Recommendation / personalization changes
- Recipe catalog edits
- Cooking flow shopping
- Home banner ads

---

## 15. 수정된 파일 여부

**None.** This sprint was audit-only. No production code, routes, recipe data, or Home UI were modified.

---

## Verdict

### **PREP REQUIRED**

Shopping integration is **architecturally feasible** and several building blocks exist (grocery engine, fridge missing-ingredient diff, shopping config stubs). Implementation should wait on **thin prep layer**:

1. **Shopping keyword normalization** (explicit helper; do not rely solely on 30-item IIE registry).
2. **matchKey-aligned missing-ingredient builder** for single-recipe + pantry (reuse fridge alignment).
3. **Shopping UI surface** design tied to Ingredients + Fridge (not Home hero).

Not **BLOCKED** — no large refactor required. Not **READY** for Coupang API wiring without the normalization / diff consistency prep above.

---

*End of Sprint 63-A audit.*
