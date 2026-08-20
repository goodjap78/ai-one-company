# MEALKIT_QA_MENU_REPORT

Generated: 2026-08-13

ELIGIBILITY_SOURCE: `data/shopping/mealKitValidatedEligibility.ts` (`MEAL_KIT_VALIDATED_ELIGIBILITY`)
TOTAL_QA_MENUS: **27** (23 existing + 4 expansion)
AUTO_SYNC: **YES** — `listMealKitQaRecipes()` reads production eligibility; no duplicated 27-row QA array
SORT_ORDER: recipeId numeric ascending; UI sections `기존 validated` / `신규 catalog expansion` (`recipe_0301+`)
PREVIEW_VISIBLE: YES (`__DEV__` or `EXPO_PUBLIC_QA_TOOLS=1` on EAS preview)
PRODUCTION_HIDDEN: YES — entry returns null; route redirects to tabs
NEW_0301_0304_INCLUDED: YES (via eligibility, not hard-code)
MODIFIED_FILES:
- `constants/mealKitQaFixtures.ts` (adapter only)
- `components/qa/MealKitQaScreen.tsx` (list + 레시피/밀키트 shortcuts)
- `scripts/test-meal-kit-qa-route.ts`
TESTS: `test:meal-kit-qa-route` PASS
ANDROID_REBUILD_REQUIRED: **YES**

Device flow (after new Preview APK):
마이 → 앱 설정 → QA Meal Kit Test → 27개 중 레시피 또는 밀키트 tap

판정: **READY_FOR_DEVICE_QA**
