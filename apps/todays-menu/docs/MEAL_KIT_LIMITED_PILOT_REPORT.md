# MEAL_KIT_LIMITED_PILOT_REPORT

Sprint: **66-A**  
Date: 2026-08-13  
Verdict: **READY_FOR_DEVICE_RETEST**

---

## 1. HIGH eligibility source

Production-safe static list extracted from `docs/meal-kit-audit-results.json` (HIGH only):

- `data/shopping/mealKitHighEligibility.ts`
- Runtime helpers: `services/shopping/mealKit/mealKitEligibility.ts`

No product title / price / URL stored. Docs JSON is **not** read at runtime.

## 2. HIGH recipe count

**24** recipes (`MEAL_KIT_HIGH_COUNT = 24`)

MEDIUM (19) / LOW / NONE → CTA hidden (`isMealKitEligible` returns false).

## 3. Search keyword source

Audit-validated `searchKeyword` per HIGH entry (e.g. `부대찌개 밀키트`, `순대국 간편식`).  
No invented keywords at runtime.

## 4. General recipe CTA

Ingredients screen:

1. Primary: `필요한 재료 장보기` (unchanged)
2. Sibling section (HIGH only): `간편하게 먹을래요?` + `밀키트로 간편하게 →`

Non-eligible recipes: section not rendered (no empty space reserved beyond `null`).

## 5. Fridge CTA

`FridgeShoppingBridge`:

1. Primary: `부족한 재료 장보기` (orange)
2. Secondary: `밀키트로 간편하게 →` (HIGH only)

Missing-zero path also shows meal-kit secondary under seasoning link when eligible.

## 6. Meal Kit mode

- Route: `/shopping/[recipeId]?mode=meal-kit`
- `parseShoppingListMode` accepts `meal-kit`
- `ShoppingScreen` branches to `MealKitShoppingPanel` (no ingredient list duplication)
- Search: **1 keyword** via existing Coupang product adapter / proxy

## 7. Product count

`MEAL_KIT_MAX_PRODUCTS = 3` after runtime filter. Reuses `ShoppingProductCard`.

## 8. Runtime match guard

`services/shopping/mealKit/filterMealKitProducts.ts`

- Recipe name or keyword core must appear in title
- Must include 밀키트 / 간편식·즉석·냉동 등 ready-meal terms
- Cookware (팬 등) excluded when not a meal kit

## 9. Empty handling

Copy: `현재 추천 가능한 밀키트가 없어요.`  
No fake products. Ingredient shopping flow unchanged.

## 10. Affiliate / disclosure

- Tap → `openShoppingProduct` (existing affiliate outbound)
- Same `SHOPPING_CONFIG.affiliateDisclosureText` on meal-kit panel

## 11. Performance

- Meal-kit mode: **1** Coupang search per screen entry
- No ingredient multi-search
- Proxy / HMAC / Upstash unchanged

## 12. Modified files

- `data/shopping/mealKitHighEligibility.ts` *(new)*
- `services/shopping/mealKit/mealKitEligibility.ts` *(new)*
- `services/shopping/mealKit/filterMealKitProducts.ts` *(new)*
- `hooks/useMealKitProductSearch.ts` *(new)*
- `components/shopping/MealKitShoppingCta.tsx` *(new)*
- `components/shopping/MealKitShoppingPanel.tsx` *(new)*
- `components/shopping/ShoppingScreen.tsx`
- `components/shopping/IngredientsShoppingCta` host: `IngredientsScreen.tsx`
- `components/fridge/FridgeShoppingBridge.tsx`
- `constants/shoppingConfig.ts` (`meal-kit` mode)
- `constants/shoppingCopy.ts`
- `scripts/test-meal-kit-limited-pilot.ts` *(new)*
- `package.json` (`test:meal-kit-limited-pilot`)

## 13. Tests

```bash
npm run test:meal-kit-limited-pilot
```

Scenarios A–H covered (HIGH show / MEDIUM·NONE hide / mode / empty / affiliate / fridge secondary / ingredients primary / match guard).

## 14. Regression

| Suite | Result |
|-------|--------|
| shopping-selective-search | PASS |
| fridge-seasoning-policy | PASS |
| fridge-shopping-bridge | PASS |
| affiliate-link-foundation | PASS |
| coupang-product-adapter | PASS |
| coupang-shopping-integration | PASS |
| home-final-qa | PASS |
| smoke:rc | PASS |

## 15. Android rebuild required

**Yes** — Preview APK rebuild needed for device retest of HIGH CTAs and meal-kit mode products.

Device check suggestions:

- HIGH: 부대찌개 (`024`), 김치찌개 (`003`), 제육볶음 (`001`)
- MEDIUM control: 비빔밥 (`005`) — no meal-kit CTA
- NONE control: 오믈렛 (`059`) — no meal-kit CTA
- Fridge HIGH: missing CTA primary still orange; meal kit secondary below

## 16. Pilot readiness

**READY_FOR_DEVICE_RETEST**

MEDIUM remains inactive until post-pilot Sprint decision.
