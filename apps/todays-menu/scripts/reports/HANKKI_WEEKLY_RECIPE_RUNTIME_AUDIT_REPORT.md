# HANKKI_WEEKLY_RECIPE_RUNTIME_AUDIT_REPORT

**Date:** 2026-09-08  
**App:** `apps/todays-menu`  
**Scope:** Weekly card press → recipe detail on Android Preview. Investigate first, then safest runtime fix.  
**Not done:** EAS build, generator change, recipe DB mass edit.

---

## CARD_PRESS_RUNTIME

**WAS BROKEN ON ANDROID (code path existed).**

Shared `ElementaryWeeklyPlanDayCard` is a full-card `Pressable`. `onPress` → `handleOpenRecipe`. `disabled={busy}` only while `loading || refreshing || sharing` — it does not stick true after the week loads.

`레시피 보기 ›` is on the **visible** day card, not only on the off-screen share PNG.

**Root runtime bug:** each week screen mounted an opaque 360×450 share capture host at `top: 0, left: 0, opacity: 1, zIndex: 0` with `pointerEvents="none"`. On Android, parent `pointerEvents="none"` does **not** reliably apply to child `Image`s. That invisible card sat over the header and the first day rows and ate taps — so opening a recipe looked like a no-op.

**Fix:** park capture hosts at `left: -4000` while keeping `opacity: 1` (view-shot still needs a fully opaque tree). Inner capture wrapper also has `pointerEvents="none"`.

## CTA_VISIBLE

**YES** — `weeklyRecipeAccessCopy.recipeViewCta` = `레시피 보기 ›` on `ElementaryWeeklyPlanDayCard`. Share card has no Pressable and no CTA.

---

## TOTAL_WEEKLY_IDS

**117** (45 + 27 + 21 + 24)

## ROUTE_RESOLVED

**117**

## ROUTE_FAILED

**0**

## FAILED_RECIPE_IDS

**(none)**

Pool simulation (`scripts/audit-weekly-recipe-runtime-routes.ts`):

| Pool | Count | Failed |
|------|------:|-------:|
| elementary-breakfast | 45 | 0 |
| elementary-dinner | 27 | 0 |
| toddler-breakfast | 21 | 0 |
| toddler-dinner | 24 | 0 |

Every weekly `recipeId`:

- `getHankkiRecipeById` hit
- `getMenuById` would hit (`getFlagshipMenuById` is the full Hankki map; child IDs are **not** excluded here — only the Home catalog uses `isExcludedFromGeneralHomeByRecipeId`)
- `getRecipeById` would hit (`getFlagshipGoldMealById`)
- `fetchRecipe` would hit (master DB miss → `getRecipeById`)
- Ingredients fields present: name, image/hero key, servings, ingredients+amounts, cook time, steps

So `/recipe/[id]` was **not** bouncing weekly IDs home. The dead tap was the overlay, not a missing catalog row.

---

## ROOT_CAUSE

1. **Primary (device symptom):** Android touch steal by the on-screen share capture host.  
2. **Secondary (UX hop):** Weekly used `/recipe/{id}` → loading screen → `replace(/ingredients/{id})`. A failed tap plus a brief loading hop made detail feel missing even when a press got through.

Weekly child recipes were already in the Hankki catalog that `getMenuById` / `getRecipeById` / `fetchRecipe` can resolve.

---

## RECIPE_BRIDGE_FIX

**YES** — `app/recipe/[id].tsx` still prefers `getMenuById` (homemade → `/ingredients/`, delivery → `/delivery/`). If that misses, it now also accepts `getHankkiRecipeById` → `/ingredients/{id}` before `fetchRecipe`, then home.

Browse / search / fridge / baby feed still push `/recipe/{id}`. Delivery routing unchanged.

Preview/QA only: `[Weekly Recipe QA] recipe resolve failed` with `recipeId`, `getMenuById`, `getHankkiRecipeById`, `fetchRecipe`. No production UI debug.

## DIRECT_INGREDIENTS_ROUTE

**YES** (option A, weekly only) — four week screens + `/weekly-recipes` use `weeklyRecipeDetailHref` → `router.push(/ingredients/{recipeId})`.

Analytics kept: `recipe_id`, `seed`, `setRecipeOpenSource('kids_weekly_plan')`.

Preview/QA only: `[Weekly Recipe QA]` on press with `recipeId`, `audience`, `mealType`, `targetRoute`.

---

## ELEMENTARY_BREAKFAST

**PASS** — Pressable card + visible CTA → `/ingredients/{id}`. Capture host off-screen. Index source `elementary-breakfast`.

## ELEMENTARY_DINNER

**PASS** — same.

## TODDLER_BREAKFAST

**PASS** — `ToddlerBfDnWeeklyPlanScreen` breakfast. Same card + route.

## TODDLER_DINNER

**PASS** — same screen, dinner.

Same off-screen capture host also applied to baby weekly + legacy toddler weekly (same Android overlay class). Those screens still use `/recipe/{id}` and now get the hardened bridge.

---

## WEEKLY_RECIPE_INDEX

**PASS** — `/weekly-recipes` `레시피 보기 ›` uses the same `/ingredients/{recipeId}` helper + `kids_weekly_plan` source for all four:

- elementary-breakfast
- elementary-dinner
- toddler-breakfast
- toddler-dinner

---

## DETAIL_FIELDS

**PASS** — `IngredientsScreen` still renders:

| Field | Surface |
|-------|---------|
| 메뉴명 | `recipe.title` |
| 이미지 | `RecipeHeroImage` (image-audit fallback kept) |
| 인분 | `RecipeInfoMeta` + serving adjuster |
| 재료 + 분량 | `RecipeIngredientsList` |
| 조리시간 | `RecipeInfoMeta` |
| 조리순서 | `RecipeStepsList` |
| 유아/초등 추가 팁 | `ToddlerDetailExtraSections` / `ElementaryDetailExtraSections` |

A/B/C, `reviewed`, `unverified` remain hidden.

All 117 weekly IDs have name / image key / servings / ingredients+amounts / time / steps.

---

## IMAGE_FALLBACK_COMPATIBILITY

**PASS** — HANKKI_IMAGE_MISSING_AUDIT fallbacks kept:

- `MealImageView` / focal heroes QA `onError` logs
- shopping + meal-kit `showEmojiFallback`
- `RecipeHeroImage` + `AlternativeMealsRow` load-fail → this-recipe emoji
- weekly day card + share cell `showEmojiFallback`

Navigation change does not remap images or reuse another dish’s photo.

---

## FILES_CHANGED

**This audit**

| File | Change |
|------|--------|
| `utils/weeklyRecipeNavigation.ts` | Canonical `/ingredients/{id}` + QA logs |
| `app/recipe/[id].tsx` | Hankki resolve + QA fail log |
| `ElementaryBreakfastWeeklyPlanScreen.tsx` | Direct ingredients + off-screen capture |
| `ElementaryDinnerWeeklyPlanScreen.tsx` | same |
| `ToddlerBfDnWeeklyPlanScreen.tsx` | same |
| `WeeklyRecipeIndexScreen.tsx` | Direct ingredients + QA log |
| `BabyFoodWeeklyPlanScreen.tsx` | capture host off-screen |
| `ToddlerWeeklyPlanScreen.tsx` | capture host off-screen |
| `scripts/audit-weekly-recipe-runtime-routes.ts` | 117-id simulation |
| `scripts/test-weekly-recipe-runtime.ts` | wiring QA |
| weekly access / sprint4 / sprint12 / share tests | route + overlay asserts |
| `package.json` | `test:weekly-recipe-runtime`, `audit:weekly-recipe-runtime` |

**Preserved from image-missing audit (not reverted)**

`MealImageView`, `FocalMealImage`, `HomeHeroFocalImage`, `RecipeHeroImage`, `AlternativeMealsRow`, `ShoppingScreen`, `MealKitShoppingPanel`, weekly day/share image fallbacks, `utils/logMealImageLoadError.ts`.

---

## STATIC_QA

**PASS**

- `npx tsx scripts/audit-weekly-recipe-runtime-routes.ts` — 117/117
- `test:weekly-recipe-runtime`
- `test:weekly-recipe-access`
- `test:toddler-sprint12-weekly-ui`
- `test:weekly-plan-ui`
- `test:weekly-plan-share`
- `test-elementary-weekly-sprint4-ui`
- `test-elementary-weekly-sprint5-share`
- `test:elementary-dinner-weekly-plan`
- `test:runtime-image-missing`

Covered in scripts: 4 week card presses, weekly index, all pool IDs, IngredientsScreen fields, regenerate new IDs still in catalog, Hankki logo home, image fallback wiring. Interactive device tap / back / home not run in this session.

## WEB_EXPORT

**PASS** — `npx expo export --platform web` exit 0 (temp output removed, not committed)

---

## NEEDS_NEW_PREVIEW_BUILD

**YES**

Capture-host layout and weekly `router.push` are native runtime. Current Preview APK still has the on-screen overlay + `/recipe/{id}` hop.

EAS build **not** started. Waiting.

---

## RESULT

**PASS** (source + static QA + web export)

Device confirmation of the four week cards on the next Android Preview is still required after a new build.
