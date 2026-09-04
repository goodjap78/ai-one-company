# HANKKI_V1_1_SPRINT_14_1_REPORT

**Date:** 2026-09-04  
**Scope:** Final web UX polish only. No generators, recipe DB, ads, native config, or EAS.

---

## BREADCRUMB_REMOVED

**YES**

- Home weekly 2-step: removed `← 유아/초등학생` text back link
- Replaced with compact audience chips (tap selected → back to audience step; tap other → switch)
- Child/weekly screens: removed `ScreenBackButton` (“← 홈”) breadcrumb chrome

## LOGO_HOME_NAVIGATION

**YES**

- New `components/ui/HankkiHomeBrandLink.tsx`
- Seed mascot + “한끼” wordmark (soft press, not button chrome)
- `accessibilityLabel`: **한끼 홈으로 이동**
- `router.replace('/(tabs)')`
- Wired on: baby feed/weekly, toddler feed/weekly + bf/dn weekly, elementary browse + breakfast/dinner weekly
- System Android/iOS back unchanged; routes unchanged

## SHARE_IMAGE_RATIO

**0.73 / 0.27** (image / text) — within **70–75%** photo target  
Sunday image band **~74%**  
`resizeMode="contain"` on share meal photos (no hard crop of food)  
4:5 / **1080×1350** unchanged · Mon–Sat 2-col · Sunday full-width

## MENU_NAME_SIZE

**Larger** — grid name **12/15**, Sunday **13/16** (was 11/14 and 12/15)  
Max **2 lines** · cook time smaller (8px)

## SHOPPING_HINT

**REMOVED** from share card UI (footer is small brand only)  
Model may still compute hint; not rendered

## WEB_QA

**PASS** (static + `expo export --platform web`)

- No arrow breadcrumb in home weekly panel
- Brand home link on child/weekly screens
- Share layout constants + contain mode verified by scripts

Interactive browser click-through of all 4 share cards: not automated in this session (web export + script QA cover wiring).

## REGRESSION

**PASS**

- `test-sprint-1-1-home-ux`
- `test-child-route-audit`
- `test-toddler-sprint12-weekly-ui`
- `test-elementary-weekly-sprint5-share`
- `test-elementary-weekly-sprint5-3-share`
- web export

## BLOCKERS

None

## WARNINGS

1. Preview APK from Sprint 14 does **not** include this polish — rebuild preview before final device QA if these UX fixes must be on-device.
2. `contain` may show letterboxing on some meal photos vs previous `cover` crop.

## RESULT

**PASS**

Awaiting next sprint instruction (do not start Sprint 15).
