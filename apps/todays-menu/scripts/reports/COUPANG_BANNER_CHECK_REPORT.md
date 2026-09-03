# COUPANG_BANNER_CHECK_REPORT

**Date:** 2026-09-03  
**Scope:** Home bottom Coupang Dynamic Banner — web preview QA visibility  
**Status:** PASS

---

## LOCAL_HOME_RENDER

**HomeScreen still renders `<CoupangDynamicBanner />`** after `HomePersonalSection`, before `<AdMobBanner />` inside `ScrollView` content.

```166:167:apps/todays-menu/components/home/HomeScreen.tsx
            <CoupangDynamicBanner />
            <AdMobBanner />
```

Sprint 1–7 changes did **not** remove or gate the Home Coupang slot. Ingredients screen still uses the same import (with existing `hideCoupang` baby-flow gate unchanged).

---

## NATIVE_BANNER_PRESERVED

**YES** — `CoupangDynamicBanner.native.tsx` is a verbatim move of the prior single-file implementation:

- Same `COUPANG_DYNAMIC_BANNER_URL` / widget ID / tracking code (`constants/coupangDynamicBanner.ts` untouched)
- Same `react-native-webview` load + `onShouldStartLoadWithRequest` outbound handling
- Same quiet failure (`onError` / `onHttpError` → `null`)
- Same 328×50 responsive sizing + `paddingVertical: 8`

Android native Coupang affiliate behavior is unchanged.

---

## WEB_FAILURE_CAUSE

Prior single file `CoupangDynamicBanner.tsx` loaded Coupang Partners widget via `react-native-webview` on **all** platforms.

On web preview:

1. `react-native-webview` does not reliably render Coupang `ads-partners.coupang.com` iframe/widget in browser QA
2. Component sets `failed` on load/HTTP error → **`return null`** (lines 85–87 in native file)
3. Result: **empty space at Home bottom** — no visible QA marker for ad slot spacing

This is an environment limitation, not a Sprint 7 regression.

---

## WEB_PLACEHOLDER

**Added:** `CoupangDynamicBanner.web.tsx`

| Behavior | Detail |
|----------|--------|
| Partner widget | **Not loaded** (no `COUPANG_DYNAMIC_BANNER_URL`, no WebView) |
| Height | Same responsive 328×50 logic as native |
| Spacing | Same `paddingVertical: 8`, centered frame |
| Label | `쿠팡 광고 영역 · 실기기에서 표시` |
| Visual | Light gray bordered frame for layout QA |

Metro resolves `import { CoupangDynamicBanner } from '../ads/CoupangDynamicBanner'` to `.web.tsx` on web and `.native.tsx` on Android/iOS.

**Removed:** `CoupangDynamicBanner.tsx` (prevents web graph from picking WebView implementation).

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `components/ads/CoupangDynamicBanner.native.tsx` | **NEW** — prior native WebView ad (unchanged logic) |
| `components/ads/CoupangDynamicBanner.web.tsx` | **NEW** — QA placeholder |
| `components/ads/CoupangDynamicBanner.tsx` | **REMOVED** — platform split |
| `scripts/test-coupang-dynamic-banner.ts` | Assert native/web split |
| `scripts/reports/COUPANG_BANNER_CHECK_REPORT.md` | This report |

**Unchanged:** `constants/coupangDynamicBanner.ts`, affiliate URLs, HomeScreen mount order, Android AdMob/Coupang ordering.

---

## REGRESSION

| Check | Result |
|-------|--------|
| `npx tsx scripts/test-coupang-dynamic-banner.ts` | PASS |
| Home mount order (Coupang → AdMob) | Preserved |
| Native WebView + outbound | Preserved in `.native.tsx` |

---

## RESULT

**PASS**

Browser QA can now see the Home bottom ad slot with correct height/margin. Real Coupang widget remains on native only.

**Verify locally:** `npx expo start --web --port 8090` → scroll Home past “나의 한끼” → placeholder visible above AdMob (AdMob web stub still null per existing split).
