# HANKKI ANDROID FINAL DEVICE QA FIX REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_FINAL_ANDROID_BUILD

## 1. Home alternative image root cause
Two issues combined:
- **Regression:** `MealImageView` `mediaFrame` + `absoluteFill` wrapper broke cover sizing on Android (blur/background band).
- **Missing focal:** Home main hero uses `HomeHeroFocalImage` focal system; alternatives/recipe hero used plain center crop on wide hero assets.

## 2. Recipe Hero image root cause
Same as above — plain `MealImageView` center crop without focal repositioning.

## 3. Image fixes
- Reverted `MealImageView` to direct `Image` + `resizeMode="cover"` (no `mediaFrame`).
- Added `FocalMealImage` (shared focal layout from `computeHomeHeroImageLayout` / `HOME_HERO_FOCAL_OVERRIDES`).
- `AlternativeMealsRow` → `FocalMealImage` (scale 1.22 for small cards).
- `RecipeHeroImage` → `FocalMealImage` + `recipeId` prop from `IngredientsScreen`.

## 4. 한끼 더하기 clipping fix
- `HomeComingSoonSection`: `minHeight` 48→52, padding 8→10, removed `overflow: hidden` on cards, badge lineHeight 12.

## 5. Ingredients Shopping CTA
**Maintained** — orange primary, white text, subtitle hint (`IngredientsShoppingCta.tsx`).

## 6. Fridge Shopping CTA
**Maintained** — in-card orange CTA + missing-only route (no logic changes).

## 7. "선택한 재료 상품 보기" 기존 역할
- **No `onPress` handler** — disabled-looking button with no action.
- Products already load inline per selected ingredient via `useShoppingProductResults`.
- **Redundant duplicate CTA.**

## 8. 제거/유지 결정
| Item | Decision |
|------|----------|
| Bottom sticky footer + purchase button | **Removed** |
| Inline per-ingredient products | **Kept** |
| `SHOPPING_CONFIG.purchaseCtaLabel` in config | **Kept** (config only; not shown on screen) |
| Affiliate disclosure on Shopping | **Kept** |

## 9. Sticky bottom area 결과
Footer container removed; scroll content uses bottom padding only (SafeAreaView edges).

## 10. 다른 메뉴 추천 CTA
Underline link → secondary cream button: `다른 메뉴 추천 →` (same `onOtherMenu` route).

## 11. 더 많은 메뉴 보기 CTA
Already secondary cream + `→` from prior polish; verified in tests.

## 12. Dynamic Banner regression
**No code changes** — placement/size unchanged.

## 13. 360 / 390 / 430 responsive
`test:android-card-polish` layout math PASS for Home alternatives + Fridge cards.

## 14. Modified files
- `components/meal/MealImageView.tsx`
- `components/meal/FocalMealImage.tsx` (new)
- `components/home/AlternativeMealsRow.tsx`
- `components/recipe/RecipeHeroImage.tsx`
- `components/ingredients/IngredientsScreen.tsx`
- `components/home/HomeComingSoonSection.tsx`
- `components/shopping/ShoppingScreen.tsx`
- `components/recipe/RecipeDetailActions.tsx`
- `scripts/test-android-final-device-qa.ts` (new)
- `scripts/test-android-card-polish.ts`
- `scripts/test-shopping-screen.ts`
- `package.json`

## 15. Tests
- `test:android-final-device-qa` — PASS
- `test:android-card-polish` — PASS
- `test:shopping-screen` — PASS (updated)
- `test:shopping-reselect` — PASS
- `test:fridge-shopping-bridge` — PASS
- `test:home-final-qa` — PASS
- `smoke:rc` — PASS
- Additional sprint regressions — PASS

## 16. Regression
PASS on listed shopping/fridge/home tests. No changes to proxy, Coupang API, ranking, or fridge missing logic.

## 17. Remaining issues
- **Asset-level:** Recipes without focal override may still need per-recipe `HOME_HERO_FOCAL_OVERRIDES` after device check (e.g. 얼큰콩나물국, 버섯계란라이트 if not in overrides).
- **Product card hint** `"외부 쇼핑으로 이동"` — unchanged (low priority).

## 18. Android Preview rebuild readiness
**Yes** — new Preview build required for all fixes above.

### Device retest checklist
1. Home alternatives — food visible (닭가슴살덮밥, 연어포케, 퀴노아볼)
2. Recipe hero — food visible (얼큰콩나물국, 버섯계란라이트)
3. 한끼 더하기 cards — no bottom clip
4. Shopping — no bottom sticky bar; products inline; reselect still works
5. Recipe — 다른 메뉴 추천 secondary button
6. Fridge CTAs + Dynamic Banner — unchanged PASS

**Sprint 64 COMPLETE:** Do not mark until user completes final device QA.
