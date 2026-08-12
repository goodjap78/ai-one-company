# SHOPPING_SELECTIVE_SEARCH_REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## 1. Existing default selection behavior

- All ingredients with non-empty `shoppingKeyword` were **selected by default**, except `COMMON_STAPLE_MATCH_KEYS` (water, salt, pepper, cooking_oil, sugar).
- Applied equally to `mode=all` and `mode=missing`.
- On screen entry → `buildProductSearchRequests` ran for **every selected item** (N concurrent Coupang searches, cap 2).

## 2. New default selection rule

| Mode | Default selected |
|------|------------------|
| `all` (general recipe) | `group === 'main'` only (+ staple rules) |
| `missing` (fridge) | All non-staples (unchanged) |

Search trigger unchanged: **selected keys only**. User checkbox toggle adds/removes keys → hook fetches or hides products.

## 3. Main ingredient behavior

- Checked on entry (`mode=all`).
- Product search starts immediately for main items only.
- Example recipe `001` (제육볶음): **1** initial request (돼지고기).

## 4. Side ingredient behavior

- Unchecked on entry.
- No product search until user checks.
- Checking adds key → search starts for that ingredient only.

## 5. Seasoning behavior

- Unchecked on entry (except staples already in `COMMON_STAPLE_MATCH_KEYS`).
- User can manually check 간장, 다진마늘, 참기름 etc. → search on select.
- Staples (설탕, water, salt, pepper, oil) remain in list, deselected, user-opt-in.

## 6. Fridge behavior

- `mode=missing` **not affected** by main-only policy.
- Missing ingredients list unchanged (`buildMissingRecipeShoppingList`).
- All non-staple missing items selected → auto search (same as before).

## 7. Request count before/after

| Scope | Before (non-staple all) | After (main only) |
|-------|-------------------------|-------------------|
| Recipe `001` | 9 | 1 |
| Full catalog (300 recipes) | 1,768 | 649 |

~63% reduction in initial Coupang API requests on general recipe entry.

## 8. First product visible before/after

- **Before:** First product after ~1st of N searches completes (N ≈ 9–15 typical recipe).
- **After:** First product after ~1st of M searches (M = main count, typically 1–3).
- Expected faster first visible product; device timing CHECK_REQUIRED on retest.

## 9. Modified files

- `services/shopping/shoppingSelection.ts` — mode-aware `defaultIngredientSelected` / `buildDefaultSelectedKeys`
- `components/shopping/ShoppingScreen.tsx` — pass `mode` to defaults
- `scripts/test-shopping-selection.ts` — updated scenarios
- `scripts/test-shopping-selective-search.ts` — new (6 scenarios + perf snapshot)
- `package.json` — `test:shopping-selective-search` script
- `docs/SHOPPING_SELECTIVE_SEARCH_REPORT.md` (this file)

## 10. Tests

- `test:shopping-selective-search` — PASS (new)
- `test:shopping-selection` — PASS (updated)
- `test:shopping-reselect` — PASS
- `test:recipe-shopping-list` — PASS
- `test:shopping-screen` — PASS
- `test:shopping-product-adapter` — PASS
- `test:affiliate-link-foundation` — PASS
- `test:coupang-product-adapter` — PASS
- `test:coupang-shopping-integration` — PASS
- `test:fridge-shopping-bridge` — PASS
- `test:fridge-raid` — PASS
- `smoke:rc` — PASS

## 11. Regression

No changes to: Coupang proxy, HMAC, Upstash, affiliate URLs, product mapping, fridge missing list logic, recommendation engine, recipe catalog, ranking.

Deselect → hide / reselect → SUCCESS cache restore verified in Scenario 5.

## 12. Android rebuild required

**Yes** — JS bundle change; Preview APK rebuild recommended for device validation of:
- General recipe: main-only search on entry
- Sub/seasoning opt-in search
- Fridge missing flow unchanged
