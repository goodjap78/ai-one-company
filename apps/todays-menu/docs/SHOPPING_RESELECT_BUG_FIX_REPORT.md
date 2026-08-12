# SHOPPING_RESELECT_BUG_FIX_REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## 1. Root cause

`useShoppingProductResults` treated every selection change as a **full reset**:

1. Replaced the entire `results` array with `loading` for *all* currently selected ingredients  
2. Re-called `searchProductsForRequests` for the full selected set  
3. Kept **no session SUCCESS cache** across deselect → reselect  
4. On rapid toggle / concurrent cancellation, in-flight searches were discarded (`cancelled = true`) while a later pass could leave the UI on **EMPTY/ERROR** without a reliable per-ingredient retry path  
5. Re-searching every still-selected ingredient on each toggle also amplified **rate-limit / empty** risk

So: `selected → unselected → selected` did not reliably restore SUCCESS or cleanly retry EMPTY.

## 2. 기존 selection/result state 구조

| Layer | Behavior (before) |
|-------|-------------------|
| `ShoppingScreen.selectedKeys` | `Set` toggled per ingredient |
| `buildProductSearchRequests` | Filter items by selected keys |
| `useShoppingProductResults` | `useEffect([requests])` → wipe all → search all selected |
| UI | `productResultByKey.get(itemKey)` when selected |

Selection and result lifetime were over-coupled: deselect removed the row from `results`; reselect depended on a fresh full-batch search.

## 3. 수정 내용

- Added `services/shopping/productResultCache.ts`:
  - `shouldReuseProductResult` — SUCCESS + products only  
  - `planProductSearches` — reuse SUCCESS / fetch others as loading  
  - `invalidateNonSuccessProductCache` — drop EMPTY/ERROR so reselect retries  
  - `applyFetchedProductResults` — merge fetch into session cache  
- Rewrote `hooks/useShoppingProductResults.ts`:
  - Session `Map` cache (cleared when `items` list identity changes / recipe reload)  
  - Stable `selectionSig` for Set contents  
  - Fetch **only** ingredients that need search  
  - Deselect hides UI; SUCCESS remains in cache  

## 4. SUCCESS cache 재사용 여부

**Yes** — same screen session, same `matchKey::shoppingKeyword`:  
SELECT → SUCCESS → DESELECT → RESELECT → show cached SUCCESS (no API call).

## 5. EMPTY/ERROR retry behavior

**Yes** — EMPTY/ERROR are not reused; invalidated on plan; reselect triggers a new search.

## 6. Multi ingredient behavior

A/B selected with SUCCESS: deselect A → B stays from cache; reselect A → A restored from cache; B unchanged. New selects only fetch missing keys.

## 7. Outbound behavior

Unchanged: `ShoppingProductResults` → `openShoppingProduct` (Android https `canOpenURL` skip intact). Cached products keep `affiliateUrl`.

## 8. Modified files

- `hooks/useShoppingProductResults.ts`
- `services/shopping/productResultCache.ts` (new)
- `services/shopping/index.ts` (exports)
- `scripts/test-shopping-reselect.ts` (new)
- `package.json` (`test:shopping-reselect`)
- `docs/SHOPPING_RESELECT_BUG_FIX_REPORT.md` (this file)

**Not changed:** Shopping Proxy, Coupang client, Upstash, affiliate policy, recipes, Home, recommendation, Fridge logic.

## 9. Tests

| Test | Result |
|------|--------|
| `npm run test:shopping-reselect` | PASS (scenarios 1–4) |
| `test:shopping-selection` | PASS |
| `test:shopping-screen` | PASS |
| `test:shopping-outbound-android` | PASS |
| `test:coupang-shopping-integration` | PASS |
| `test:affiliate-link-foundation` | PASS |
| `test:fridge-shopping-bridge` | PASS |

## 10. Android rebuild 필요 여부

**Yes.** Hook/cache fix is in the JS bundle — need a new Android Preview build to device-retest. Previous APK does not include this fix.

### Device retest checklist

1. Select ingredient → products OK  
2. Deselect → products hidden  
3. Reselect → products back (cache or fresh search; not stuck empty)  
4. Multi: A off/on while B stays  
5. Product tap → Coupang outbound  
