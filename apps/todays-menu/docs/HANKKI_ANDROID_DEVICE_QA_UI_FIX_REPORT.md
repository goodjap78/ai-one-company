# HANKKI ANDROID DEVICE QA UI FIX REPORT

**Date:** 2026-08-12  
**Verdict:** READY_FOR_DEVICE_RETEST

## HOME_ADD_MORE_CARD_CLIPPING

**Root cause:** Horizontal `ScrollView` on Android clips `elevation` / bottom rounded-corner shadow at the scroll viewport edge. Cards had no bottom padding bleed and `clipToPadding` default clips shadow outside content bounds.

**Fix:**
- `clipToPadding={false}` on horizontal scroll
- `paddingTop: 2`, `paddingBottom: 10` on `contentContainerStyle` for shadow bleed
- Card `minHeight` 52→54, `paddingVertical` 10→11
- Section `paddingBottom: 2`

**Scope:** 외식 / 우리아이 식단 / 영수증 / 건강 / 한끼 리워드 cards — horizontal peek unchanged.

## FRIDGE_EMPTY_BOX_ROOT_CAUSE

**Root cause:** `FridgeRaidResultsScreen` `rotateButton` rendered when `canRotatePrimary` is true, but `FRIDGE_RAID_COPY.anotherMenuRecommendation` was **undefined** (key missing from `fridgeRaidCopy.ts`). Result: small left-aligned cream rounded `Pressable` with empty label — visible above `FridgeShoppingBridge` “지금 있는 재료로 바로 만들 수 있어요” complete state.

**Not:** `moreButton` placeholder, banner slot, or shopping bridge.

## FRIDGE_MORE_MENU_CTA

| CTA | Status |
|-----|--------|
| **다른 메뉴 추천 →** (`rotateButton`) | Fixed — copy added + label with arrow; rotates primary window |
| **더 많은 메뉴 보기 →** (`moreButton`) | Already correct — secondary cream, shows when `extendedFeed` hidden |
| **부족한 재료 장보기** | Unchanged — orange primary in-card CTA |

## MODIFIED_FILES

- `components/home/HomeComingSoonSection.tsx`
- `constants/fridgeRaidCopy.ts`
- `components/fridge/FridgeRaidResultsScreen.tsx`
- `scripts/test-android-card-polish.ts`
- `scripts/test-android-final-device-qa.ts`
- `docs/HANKKI_ANDROID_DEVICE_QA_UI_FIX_REPORT.md` (this file)

## TESTS

Run after merge:

- `npm run test:android-card-polish` — PASS
- `npm run test:android-final-device-qa` — PASS

## ANDROID_REBUILD_REQUIRED

**Yes** — Preview APK rebuild required for device retest (UI + copy fixes).

## Device retest checklist

1. Home → 한끨 더하기: no bottom clip on cards/shadow at 360 / 390 / 430
2. Fridge results (zero missing): no empty cream box; “지금 있는 재료로…” only
3. Fridge results (rotatable primary): “다른 메뉴 추천 →” visible with text
4. Fridge extended feed: “더 많은 메뉴 보기 →” when applicable
