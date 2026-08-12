# COUPANG_DYNAMIC_BANNER_REPORT

Date: 2026-08-12  
Status: READY_FOR_DEVICE_RETEST / WAITING_DEVICE_QA  
Sprint 64: **NOT COMPLETE** (device retest pending)

## 1. WebView dependency
- Added via `npx expo install react-native-webview`
- Version: `13.15.0` (Expo SDK 54 compatible)

## 2. Banner component
- `components/ads/CoupangDynamicBanner.tsx`
- Constants: `constants/coupangDynamicBanner.ts`

## 3. Banner URL
Exact user widget (no invented IDs):

`https://ads-partners.coupang.com/widgets.html?id=1016733&template=carousel&trackingCode=AF7656335&subId=&width=328&height=50&tsource=`

Size baseline: **328 × 50**

## 4. Home placement
- After `HomePersonalSection` (“나의 한끼”)
- Inside ScrollView content (not sticky / not fixed)
- Before bottom tab bar

## 5. Ingredients / Recipe placement
- `IngredientsScreen` is the recipe detail surface
- Order: ingredients → shopping CTA → steps → completion/actions/feedback → **banner**
- Banner never before “필요한 재료 장보기”

## 6. Excluded screens
No banner on: ShoppingScreen, Fridge Raid results/cards/bridge, Favorites, Recently Viewed, My/Settings, legal.

## 7. External click handling
- Widget host `ads-partners.coupang.com` stays in WebView
- Product navigations (`coupang.com` / `link.coupang.com` / other Coupang hosts) → `openOutboundUrl` (Linking; https skips Android `canOpenURL` trap)
- No full tracking URL console logs
- Open failures do not crash

## 8. Responsive 360 / 390 / 430
- Width = `min(328, windowWidth - 32)`
- Centered; does not stretch on 390/430
- Height scales down only when width &lt; 328

## 9. Error fallback
- `onError` / `onHttpError` → quiet hide (`return null`)
- No error box; Home / Ingredients remain usable

## 10. Modified files
- `package.json` / lock (webview)
- `constants/coupangDynamicBanner.ts` (new)
- `components/ads/CoupangDynamicBanner.tsx` (new)
- `components/home/HomeScreen.tsx`
- `components/ingredients/IngredientsScreen.tsx`
- `scripts/test-coupang-dynamic-banner.ts` (new)
- `scripts/test-home-final-qa.ts` (banner order assert)
- `docs/COUPANG_DYNAMIC_BANNER_REPORT.md` (this file)

## 11. Tests
- `npm run test:coupang-dynamic-banner` — **PASS**

## 12. Regression (target set)
All **PASS**:
- home-final-qa, shopping-screen, shopping-selection, fridge-shopping-bridge
- recipe-shopping-list, affiliate-link-foundation, coupang-product-adapter
- coupang-shopping-integration, fridge-raid, smoke:rc
- shopping-outbound-android (prior QA preserved)

## 13. Android preview build
- Prior preview build finished **without** this banner — do not use for banner QA
- New banner-inclusive preview build: **FINISHED**
- Install: https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/d5f66729-34aa-49f2-a841-1d2a25536554
- Install APK → run device checklist (§14)

## 14. Device QA status
WAITING_DEVICE_QA — use checklist in sprint brief (HOME / RECIPE / FRIDGE / SHOPPING)

### Verdict
**READY_FOR_DEVICE_RETEST**
