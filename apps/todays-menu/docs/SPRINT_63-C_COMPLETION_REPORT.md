# SPRINT 63-C — CONTEXTUAL SHOPPING UX

**Date:** 2026-08-10  
**Verdict:** **PASS**

---

## 1. Ingredients CTA

- `IngredientsShoppingCta` below `RecipeIngredientsList` on `IngredientsScreen`.
- Copy: **필요한 재료 장보기** (underlined link style — weaker than primary recipe CTAs).
- Navigates to `/shopping/[recipeId]`.

## 2. Shopping route

- `app/shopping/[recipeId].tsx` → `ShoppingScreen`
- Query: `mode=missing` for missing-only (fridge flow).

## 3. Shopping screen

- Header: recipe hero image + title + hint.
- List: icon, ingredient name, amount per row.
- Group sections: 주재료 / 부재료 / 양념 + **기본 양념** bucket for staples.
- Shopping keyword not shown to users.

## 4. Ingredient selection UX

- Checkbox per row; local `selectedKeys` state.
- Default: non-staples selected; staples deselected.

## 5. Common staples handling

Catalog line counts (300 recipes):

| matchKey | lines |
|----------|-------|
| salt | 138 |
| sugar | 122 |
| cooking_oil | 93 |
| pepper | 72 |
| water | 69 |

UX: staples grouped under **기본 양념**, deselected by default, hint explains pantry assumption. Ingredients not removed from list.

## 6. Selected count

- Footer: **선택한 재료 N개**
- No price / fake totals.

## 7. Future purchase CTA state

- `SHOPPING_CONFIG.purchaseCtaEnabled: false`
- Button shows **상품 연결 준비 중**, disabled.
- No `Linking.openURL`, no fake product pages.

## 8. Fridge missing-only integration

- `FridgeShoppingBridge` shows CTA when `FRIDGE_SHOPPING_CONFIG.enabled` (default **false**).
- When enabled: **부족한 재료 장보기** → `/shopping/[recipeId]?mode=missing`
- `missingItems` wired from top primary candidate.

## 9. ALL vs MISSING mode

- `resolveRecipeShoppingList(recipeId, mode, pantry?)`
- `all` → `buildRecipeShoppingList`
- `missing` → `buildMissingRecipeShoppingList` + live pantry

## 10. Product adapter readiness

Each `ShoppingIngredientItem` carries: `ingredientName`, `shoppingKeyword`, `matchKey`, `iconKey`, `amountText`, `group`. UI has no Coupang references.

## 11. Disclosure placeholder

- `SHOPPING_CONFIG.affiliateDisclosureText` — null hides footer disclosure area.

## 12. New tests

| Script | Result |
|--------|--------|
| test:shopping-screen | PASS |
| test:shopping-selection | PASS |

## 13. Regression

All required regressions PASS (shopping-keyword, recipe-shopping-list, fridge-raid, home-final-qa, meal-catalog-300, viewed, personalization, validates, smoke:rc).

## 14. Modified files

**New:** `ShoppingScreen`, `ShoppingIngredientRow`, `shoppingConfig`, `shoppingSelection`, `resolveRecipeShoppingList`, test scripts, completion doc.

**Updated:** shopping route, `IngredientsShoppingCta`, `FridgeShoppingBridge`, `shoppingCopy`, `IngredientsScreen`, shopping service index, `package.json`.

## 15. Remaining issues

- Purchase CTA inactive until 63-D adapter.
- Fridge CTA hidden until `FRIDGE_SHOPPING_CONFIG.enabled`.
- Disclosure text pending legal/policy review.

## 16. Sprint 63-D readiness

**Ready** for product adapter, affiliate links, disclosure copy, optional fridge bridge enable.

**Final judgment: PASS**
