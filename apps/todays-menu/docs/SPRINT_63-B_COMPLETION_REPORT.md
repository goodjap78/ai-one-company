# SPRINT 63-B — SHOPPING KEYWORD + SHOPPING LIST FOUNDATION

**Date:** 2026-08-10  
**Verdict:** **PASS**

---

## 1. Shopping keyword architecture

- **Layer:** `services/shopping/shoppingKeyword.ts` — independent from IIE `resolveIngredient`.
- **Pipeline:** `ingredient.name` → whitespace normalize → `SHOPPING_KEYWORD_ALIASES` → spacing heuristics (`다진*`, `삶은*`, `썬*`).
- **Does not include** amount/unit in keyword.
- **Does not use** IIE canonical (e.g. `밥` stays `밥`, not `쌀`).

## 2. Alias normalization

- **File:** `services/shopping/shoppingAliases.ts`
- **Explicit aliases:** `다진마늘` → `다진 마늘`, `삶은계란` → `삶은 계란`
- **Heuristics:** compact `다진*` / `삶은*` without mapping every compound.

## 3. Keyword coverage

| Metric | Result |
|--------|--------|
| Total ingredient lines | 2,262 |
| Unique names | 191 |
| Keyword success | 2,262 / 2,262 (100%) |
| Empty keywords | **0** |
| Alias table hits | 92 |

## 4. Recipe shopping list architecture

- **Types:** `types/shopping.ts`
- **Builders:** `buildRecipeShoppingList`, `buildMissingRecipeShoppingList`, `buildMissingShoppingListFromNames`
- No recipe title/image on line items.

## 5. Duplicate merge policy

- **Merge key:** `matchKey::shoppingKeyword`
- **Group priority:** main > sub > seasoning
- **Amount:** same unit sums; mixed units joined with ` + `
- Catalog: 0 natural merges in 300 recipes; logic verified via synthetic test.

## 6. Group handling

- main / sub / seasoning preserved on each item.

## 7. Fridge missing-list integration

- Reuses `alignFridgeIngredients` + `getFridgeRecipeIndexEntry` + `buildPantryMatchKeySet`.

## 8. MatchKey consistency

- Fridge `matchKey` as source of truth for missing diff (not Smart Grocery IIE names).

## 9. Ingredients CTA prep

- `IngredientsShoppingCta` → `/shopping/[recipeId]` keyword preview (no products).

## 10. Fridge shopping bridge prep

- `FridgeShoppingBridge` receives `missingItems` + `recipeId` from top primary candidate.

## 11. Full catalog audit

Coverage 100%, empty keywords 0.

## 12. New tests

- `test:shopping-keyword` — PASS
- `test:recipe-shopping-list` — PASS

## 13. Regression

All required regressions PASS (fridge-raid, meal-catalog-300, validates, home-final-qa, viewed, personalization, smoke:rc).

## 14. Modified files

See git diff — new `services/shopping/*`, shopping route, CTA, tests, docs.

## 15. Remaining risks

- Shared iconKey + different keywords handled; monitor new catalog.
- Smart Grocery vs shopping matchKey split remains intentional.
- Affiliate / product UI still needed in 63-C.

## 16. Sprint 63-C

**Ready** for Coupang adapter, product cards, disclosure, bridge enable.

**Final judgment: PASS**
