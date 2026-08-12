# ANDROID_CARD_POLISH_REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## HOME_ALTERNATIVE_CARDS
PASS (layout code)
- Removed `maxWidth: '33.33%'` + row `overflow: 'hidden'` (Android clip cause)
- Equal `flexGrow/Shrink` + `flexBasis: 0` + `minWidth: 0`
- Gap **8**, text padding tightened for 360dp
- Still 3 cards in one row

## HOME_IMAGE_CENTERING
PASS (UI)
- `MealImageView`: frame + `resizeMode="cover"` + centered frame (no stretch)
- Absolute-fill image inside sized container
- Geometric center crop only — subject bias in source PNGs is asset-side

## FRIDGE_RECOMMENDATION_CARDS
PASS (layout code)
- Removed `minHeight: metrics.minHeight` binding (fixed-height clip trap)
- Removed `flexGrow: 1` / body `flex: 1`
- Content-driven height so image / title / stars / 활용·부족 / 시간 / 장보기 CTA fully show
- Image wrap clips with `cover` center; card grows with CTA

## FRIDGE_SIDE_DISH_CARDS
PASS (same `FridgeRaidCompactCard` + feed)
- Shared compact card/feed fixes apply to “함께 만들기 좋은 반찬”
- Feed `alignItems: 'flex-start'` so horizontal row does not force short stretch-clip

## MORE_MENU_CTA
PASS
- Cream/neutral secondary: `secondaryButton` + `secondaryBorder`, radius 14
- Label: `더 많은 메뉴 보기 →`
- Route/behavior unchanged (`setShowExtended(true)`)

## 360PX / 390PX / 430PX
PASS (layout math tests)
| Width | Home col | Fridge card |
|------:|---------:|------------:|
| 360 | 104 | 147 |
| 390 | 114 | 161 |
| 430 | 127 | 176 |

All fit content width without forced edge clip.

## ORIGINAL_ASSET_POSITION_ISSUES
CHECK_REQUIRED on device
- UI cannot re-compose plating inside the PNG
- If a dish subject sits far from image center after cover crop, re-export / reframe that hero asset
- No specific recipe IDs flagged from code-only review

## MODIFIED_FILES
- `components/home/AlternativeMealsRow.tsx`
- `components/meal/MealImageView.tsx`
- `components/fridge/FridgeRaidCompactCard.tsx`
- `components/fridge/FridgeRaidCompactFeed.tsx`
- `components/fridge/FridgeRaidResultsScreen.tsx`
- `constants/fridgeCompactLayout.ts`
- `utils/androidCardLayout.ts` (new)
- `scripts/test-android-card-polish.ts` (new)
- `scripts/test-home-final-qa.ts`
- `package.json`
- `docs/ANDROID_CARD_POLISH_REPORT.md` (this file)

## TESTS
- `npm run test:android-card-polish` — PASS
- `test:home-final-qa` — PASS
- `test:fridge-compact-ui` — PASS
- `test:fridge-shopping-bridge` — PASS
- `test:fridge-raid` — PASS

## ANDROID_REBUILD_REQUIRED
**Yes** — native preview APK must include these UI changes for device QA.

### Out of scope (unchanged)
Recommendation / fridge ranking / shopping proxy / Coupang / affiliate / recipe data
