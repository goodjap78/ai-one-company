# OMELETTE_CROP_SAFE_ASSET_REPORT

**Date:** 2026-08-12  
**Recipe:** `059` 오믈렛 (`heroImageKey: omelette`)

## OMELET_ASSET_REPLACED

**Yes** — `assets/meals/omelette.jpg` replaced with crop-safe top-down centered omelette (1344×768 JPEG).

- Recipe ID / metadata / recommendation data: **unchanged**
- Image reference path: **unchanged** (`omelette` local key → `omelette.jpg`)
- No renderer/focal override added for `059` (default focal sufficient with centered asset)

## HOME_HERO

**PASS (code + asset composition)** — centered plate in safe-zone; default focal `y=0.46` + `focalScale 1.28`. Device retest recommended after APK rebuild.

## DETAIL_HERO

**PASS (code + asset)** — `FocalMealImage` cover crop; centered subject should remain visible vs prior bottom-weighted original. Device retest required.

## CARD_CROP

**PASS (code + asset)** — `AlternativeMealsRow` / recommendation cards use `FocalMealImage` scale 1.22; centered omelette survives square-ish card crop.

## THUMBNAIL_CROP

**PASS (code + asset)** — 72px hero thumb uses same asset; center safe-zone keeps omelette identifiable.

## CROP_SAFE_RULE_ADDED

- `scripts/image-factory/SINGLE_DISH_HERO_POLICY.md` — `CROP_SAFE_FOOD_RULE` section
- `scripts/image-factory/engine/buildHeroPrompt.ts` — `CROP_SAFE_FOOD_RULE` + `HERO_SHOT_REQUIREMENTS` (style **v1.3**)

## REGRESSION

- `test:omelette-crop-safe` — PASS (new)
- `smoke:rc` — PASS (heroes 300+140w/300)
- `validate:hero-runtime` — run if in CI; asset key unchanged

## ANDROID_REBUILD_REQUIRED

**Yes** — binary asset change; EAS preview build in progress / must include new `omelette.jpg`.

### Device checklist

1. Home Hero — omelette immediately recognizable, not clipped
2. Recipe Detail Hero — full omelette visible (primary QA fix target)
3. Recommendation card — omelette centered in thumb
4. Speech bubble / mascot does not cover omelette mass
