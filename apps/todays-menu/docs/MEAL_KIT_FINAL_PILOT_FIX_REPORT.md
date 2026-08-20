# MEAL_KIT_FINAL_PILOT_FIX_REPORT

Sprint: **66-B**  
Date: 2026-08-13  
Verdict: **MEALKIT_PILOT_READY_FOR_DEVICE_RETEST**

---

## CTA_POSITION_BEFORE

Ingredients list → `필요한 재료 장보기` (full orange) → meal-kit section below (HIGH only).

## CTA_POSITION_AFTER

Hero → 기본 정보 → **CTA 선택 영역** → 필요한 재료 → 주재료/부재료/양념.

## HIGH_2_CARD_LAYOUT

Validated eligible: same-row 2 cards, equal `flex: 1`.

- Left primary (orange): 🛒 필요한 재료 장보기 / 직접 만들어 먹어요 → `/shopping/{id}`
- Right secondary (cream): 🍲 밀키트로 간편하게 / 간편하게 준비해요 → `/shopping/{id}?mode=meal-kit`

## NON_ELIGIBLE_SINGLE_CARD

MEDIUM / LOW / NONE / runtime FAIL: meal-kit card not rendered. Shopping card full width. No empty column.

---

## JEYUK_ROOT_CAUSE

Audit HIGH was correct (a real 밀키트 existed). Runtime fetched **only top 3** Coupang hits. Live ranking now returns seasoned pork first (no 밀키트/간편식 in title). Guard correctly rejected those 3 → empty UI.

Meal kits were hits **#4–#5**. Not a 제육-only exception. Meal-kit mode now fetches `maxMealKitSearchResults=8`, then filters to max 3. Ingredient shopping still uses 3.

## JEYUK_AUDIT_KEYWORD

`제육볶음 밀키트`

Audit sample: `제육볶음 500g, 깔끔한 단짠매운맛 간편한 밥도둑 반찬 밀키트 금상첨육…` (1 valid)

## JEYUK_RUNTIME_KEYWORD

`제육볶음 밀키트` (unchanged)

## JEYUK_VALID_PRODUCT_COUNT

**2** (after fetch-8 + guard)

- 삼삼 고추장 불고기 제육볶음 두루치기 반찬 밀키트
- 제주 흑돼지 제육볶음 두루치기 … 캠핑 밀키트 1.2kg

Rejected (seasoned meat, not kit): 하이포크 한돈 고추장 제육볶음 / 하루신선 제육볶음 / 오늘차림 한돈 고추장 제육볶음

## JEYUK_FINAL_STATUS

**PASS** — remains on validated allowlist.

---

## HIGH_CANDIDATE_COUNT

24

## RUNTIME_PASS_COUNT

23

## RUNTIME_FAIL_COUNT

1

## FAIL_RECIPES

- **028** 콩나물국 — `콩나물국 밀키트` returned unrelated 즉석국 세트 / 오이냉국 (`missing_recipe_or_keyword`). No 콩나물국 밀키트/간편식 in current hits.

## FINAL_VALIDATED_ELIGIBLE_COUNT

**23**

## VALIDATED_ELIGIBILITY_FILE

`data/shopping/mealKitValidatedEligibility.ts`  
(`recipeId` / `recipeName` / `searchKeyword` only)

## FRIDGE_BEHAVIOR

Unchanged hierarchy: 부족한 재료 장보기 = primary, 밀키트로 간편하게 = secondary (validated eligible only). 028 no longer shows meal-kit secondary.

## 360PX / 390PX / 430PX

Cards use `flex: 1`, `minWidth: 0`, `numberOfLines={2}` on title/subtitle. Two-column on eligible; single full-width otherwise. Device retest on 360/390/430 still required.

---

## MODIFIED_FILES

- `components/shopping/RecipePrepChoiceCta.tsx` *(new)*
- `components/ingredients/IngredientsScreen.tsx`
- `data/shopping/mealKitValidatedEligibility.ts` *(new)*
- `services/shopping/mealKit/mealKitEligibility.ts`
- `services/shopping/mealKit/filterMealKitProducts.ts`
- `hooks/useMealKitProductSearch.ts`
- `services/shopping/productAdapter/coupangProductAdapter.ts` (honor requested limit up to meal-kit cap)
- `constants/shoppingConfig.ts` (`maxMealKitSearchResults`)
- `constants/shoppingCopy.ts`
- `scripts/validate-meal-kit-runtime.ts` *(new)*
- `scripts/test-meal-kit-final-pilot.ts` *(new)*
- `scripts/test-meal-kit-limited-pilot.ts`
- `scripts/test-shopping-screen.ts`
- `scripts/test-coupang-dynamic-banner.ts`
- `docs/meal-kit-runtime-validation.json` *(new)*

## TESTS

- `npm run test:meal-kit-final-pilot`
- `npm run test:meal-kit-limited-pilot`
- `npm run test:meal-kit-match-classifier`

## REGRESSION

shopping-selective-search, fridge-seasoning-policy, fridge-shopping-bridge, coupang-shopping-integration, affiliate-link-foundation, detail-hero-parity, home-final-qa, smoke:rc

## ANDROID_REBUILD_REQUIRED

**Yes** — Preview APK rebuild needed for 2-card CTA + 제육볶음 meal-kit products.

---

## 최종 판정

**MEALKIT_PILOT_READY_FOR_DEVICE_RETEST**
