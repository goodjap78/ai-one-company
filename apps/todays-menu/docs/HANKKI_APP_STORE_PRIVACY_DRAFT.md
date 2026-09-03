# HANKKI App Store Connect Privacy Nutrition Label Draft

기준일: 2026-08-29  
Bundle ID: `com.aionecompany.todaysmenu`  
근거: 앱 코드, `app.json`, `app.config.js`, `legal/privacy.html`

이 문서는 App Store Connect 입력용 **초안**이다. App Store Connect를 자동 변경하지 않는다.

## Tracking (ATT)

| 항목 | 권장 | 근거 |
|---|---|---|
| App Tracking Transparency prompt | **NO** | No `NSUserTrackingUsageDescription` / no ATT flow in app |
| “Used for tracking” third-party data | **NO** (current) | No cross-app tracking implementation in app code; Firebase ADID collection off; AdMob iOS banner UI off |

## Photo Library

| 항목 | 권장 | 근거 |
|---|---|---|
| Photo Library — **Add Photos Only** | **YES (permission)** | `expo-media-library`: `photosPermission: false`, `savePhotosPermission` set, `granularPermissions: ["photo"]`. User taps Save on weekly plan share card → `MediaLibrary.saveToLibraryAsync`. |
| Photo Library — read / linked to user | **NO** | No read of existing library; no upload to company server |

iOS usage string (via Expo plugin): “한끼가 식단 이미지를 사진 앨범에 저장할 수 있도록 허용해 주세요.”  
**9/1:** merged Info.plist `NSPhotoLibraryAddUsageDescription` 확인.

## Data Linked to You

| Category | Collected | Linked | Tracking | Notes |
|---|---|---|---|---|
| Name | NO | — | — | Nickname local only; not uploaded |
| Email / Phone | NO | — | — | Contact opens mail app; not collected by app |
| User ID (account) | NO | — | — | No login |
| Photos or Videos (off-device) | NO | — | — | Save-only on device |
| Search History (off-device) | PARTIAL | NO | NO | Shopping keywords to proxy; child search = query_length only in analytics |
| Product Interaction | YES | NO | NO | Firebase custom events: recipe_id, stage, meal_type, mode, etc. |
| Other Usage Data | YES | NO | NO | Firebase auto session/device events |

## Third-party advertising / affiliate content

| Source | Where shown | Declares ads |
|---|---|---|
| Coupang Partners Dynamic Banner (WebView) | Home, general recipe ingredients (shopping) | YES — affiliate/ad content |
| Google AdMob banner | Android Home (when unit resolved) | YES — when displayed |
| Coupang shopping links | Recipe shopping flow | Affiliate disclosure in UI |

**Not shown:** baby recipe detail (`hideCoupang`), baby batch cooking, baby grocery checklist.

## Analytics payload (custom events, non-PII)

Examples: `recipe_id`, `stage`, `meal_type`, `mode`, `query_length`, `filter_types`, `result_count`, `source`, `is_affiliate`, `merchant`.

**Excluded:** raw query text, menu name, ingredient name, child age/month, nickname, email, ad id in custom params.

## Identifiers

| Type | Declared |
|---|---|
| Device ID (Firebase app instance) | YES — Analytics SDK |
| Advertising ID | NO (intended) — Firebase ADID off; Android AD_ID blocked in config |

**9/1:** merged manifest / ATT N/A confirmation on preview build.

## CHECK_REQUIRED before App Store submit

1. Deploy updated privacy URL to Vercel.
2. Preview build: photo save permission prompt + save flow.
3. Confirm Privacy Nutrition Label matches Firebase console + actual AdMob visibility on Android preview.
4. Review “Product Interaction” vs “Usage Data” bucket labels with Apple guidance.
