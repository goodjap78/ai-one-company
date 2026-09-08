# HANKKI_IMAGE_MISSING_AUDIT_REPORT

**Date:** 2026-09-08  
**Scope:** Runtime meal-image missing audit + minimal fallback/logging.  
No EAS. No mass image replace. No other-dish photo reuse.

---

## SCREENS_AUDITED

Home recommendation (`TodayMealCard` / `MealHeroImage`), alt row, weekly day cards (4 week types + index), weekly share cells, toddler/elementary browse, favorites, recently viewed, recipe detail hero, cooking thumb, shopping + meal-kit header.

## RECIPES_AUDITED

**517** HANKKI catalog recipes (`resolveMealHeroImage` path + `assets/meals/*.jpg` + `mealImageAssets` require keys).

---

## MISSING_ASSET

**0** for catalog recipes. Every `heroImageKey` has `assets/meals/{key}.jpg` (>32 bytes).

Registry keys **without** a same-name jpg (13): legacy `gold_*` aliases + `category_*`. These `require()` existing files (`kimchi_stew.jpg` / `jaeyuk.jpg` / `bibimbap.jpg` or `category_*.png`). **Not used as HANKKI weekly/detail heroes.**

## BROKEN_MAPPING

**0** catalog. `recipe.image` path key matches `heroImageKey`. No two catalog recipes share a photo. `RECIPE_IMAGE_MAP` remote entries: **0**.

## REMOTE_LOAD_RISK

**LOW** for catalog (local `require()` only). Risk remains if a DTO passes a bad `imageUrl` **and** local source is missing (Home/detail prefer local when present).

## FALLBACK_DISABLED_SCREENS

**Before this fix (blank peach `View`):**

| Screen | Component |
|--------|-----------|
| 장보기 헤더 | `ShoppingScreen` |
| 밀키트 장보기 헤더 | `MealKitShoppingPanel` |

**Load-fail with photo present, no `onError` (broken/blank Image):**

| Screen | Component |
|--------|-----------|
| Recipe detail | `RecipeHeroImage` → `HomeHeroFocalImage` |
| Home alternatives | `AlternativeMealsRow` → `FocalMealImage` |

**Already had emoji fallback:** weekly cards, share cells, browse, favorites, recently viewed, cooking, home hero (onError already).

---

## WEEKLY_IMAGE_ISSUES

**NONE** in mapping.

| Pool | Size | Mapping issues |
|------|------|----------------|
| Elementary breakfast | 45 | 0 |
| Elementary dinner | 27 | 0 |
| Toddler breakfast | 21 | 0 |
| Toddler dinner | 24 | 0 |

Day cards already `showEmojiFallback`.

## SHARE_CARD_IMAGE_ISSUES

**Mapping: none.** Cells already emoji-fallback. Blank PNG still possible if capture runs **before** Image decode (timing, not missing asset). QA `onError` now logs `WeeklyShareMealCell`.

## DETAIL_IMAGE_ISSUES

Mapping complete. **Runtime:** failed decode used to stay on empty `HomeHeroFocalImage` (no `onError`). Now falls back to **this recipe’s** emoji, not another dish.

---

## AFFECTED_RECIPE_IDS

**None** for missing/broken catalog mapping.

Device blanks were **screen behavior**, not a list of bad ids. Next Preview: watch `[MealImage QA] onError` for real recipeIds.

---

## ROOT_CAUSE

1. **Catalog mapping is healthy** — 517/517 resolve to bundled JPGs.
2. **Blank slots** came from `MealImageView` default `showEmojiFallback={false}` (shopping) and **focal heroes without `onError`** (detail + home alts). Failed loads looked like “missing images.”
3. Legacy `gold_*` / `category_*` keys are pairing-chip / alias assets, not weekly recipe heroes.

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `scripts/audit-runtime-missing-images.ts` | Full catalog + weekly pool audit |
| `utils/logMealImageLoadError.ts` | QA-only `console.warn` |
| `components/meal/MealImageView.tsx` | Log onError |
| `components/meal/FocalMealImage.tsx` | Log onError |
| `components/home/HomeHeroFocalImage.tsx` | Log onError |
| `components/recipe/RecipeHeroImage.tsx` | Load-fail → this-recipe emoji |
| `components/home/AlternativeMealsRow.tsx` | Load-fail → emoji |
| `ShoppingScreen` / `MealKitShoppingPanel` | `showEmojiFallback` |
| Weekly day/share cells | `debugScreen` for logs |
| `scripts/test-runtime-image-missing.ts` | Wiring QA |
| `package.json` | `audit:runtime-images`, `test:runtime-image-missing` |

---

## WEB_QA

**PASS** — `npx expo export --platform web` exit 0 (temp output, not committed)

## STATIC_QA

**PASS**

- `audit:runtime-images` — catalog clean
- `validate:hero-runtime`
- `test:runtime-image-missing`
- `test:weekly-plan-share`
- `test:shopping-screen`

---

## NEEDS_NEW_PREVIEW_BUILD

**YES** — logging + fallback fixes are not in the Sprint 19 APK.

## RESULT

**PASS**
