# HANKKI Google Play Data Safety / Ads Declaration Draft

기준일: 2026-08-29  
Package: `com.aionecompany.todaysmenu`  
근거: 앱 코드, `firebase.json`, `app.config.js`, `app.json`, `@react-native-firebase/app|analytics`, `react-native-google-mobile-ads`, Coupang WebView 배너, `expo-media-library` (save-only)

이 문서는 Play Console 입력용 **초안**이다. Play Console을 자동 변경하지 않는다.

## Contains ads

| 항목 | 권장 | 근거 |
|---|---|---|
| Declares ads / Contains ads | **YES** | Home·일반 레시피 재료(장보기)에 Coupang Partners Dynamic Banner WebView (`ads-partners.coupang.com`). Android Home에 Google AdMob 배너 SDK 가능. 이유식 상세·일괄 조리·장보기 체크리스트에는 Coupang 배너 없음. |

## Device access vs off-device collection

| 구분 | 설명 |
|---|---|
| **Device access (기기 내 처리)** | AsyncStorage(닉네임, 즐겨찾기, 주간 식단, 장보기 체크리스트 등), 로컬 추천·검색 이력 |
| **Off-device collection** | Firebase Analytics 이벤트, Shopping Proxy 검색 키워드, AdMob/Coupang WebView를 통한 제3자 처리 |
| **Photo library save** | 사용자가 주간 식단 「저장」 선택 시 앱 생성 PNG를 기기 사진 보관함에 **추가(write/add)**. 기존 사진 **읽기·업로드·수집 아님**. Play “Photos and videos collected off-device”와 **구분**. |

## Data Safety 표

범례: Collected = 앱/SDK가 기기 밖으로 전송·처리하는 데이터. Shared = Google 등 제3자 처리자와의 공유(Play 의미의 Shared).

| Data type | Collected | Shared | Required/Optional | Purposes | Verdict |
|---|---|---|---|---|---|
| App activity → **App interactions** | YES | YES (Google Firebase/GA4) | Required for Analytics features as shipped | Analytics | **YES** — custom events + Firebase auto events |
| Device or other IDs | YES | YES (Google) | Required (SDK) | Analytics | **YES** — app-instance ID (Firebase docs). Not a custom installId we invent. |
| Advertising ID | NO (intended) | NO (intended) | — | — | **NO** with **CHECK_REQUIRED** — `firebase.json` `google_analytics_adid_collection_enabled: false`; `app.config.js` blocks `AD_ID` + AdServices permissions; iOS `withoutAdIdSupport`. **Merged AAB manifest 확인은 9/1 preview build.** |
| Approximate location | CHECK_REQUIRED | CHECK_REQUIRED | — | Analytics | Firebase default docs list **Geography**. App does not request GPS. |
| Precise location | NO | NO | — | — | No location permission / no GPS collection in app code. |
| Personal info (name, email, phone, address) | NO (off-device) | NO | — | — | Nickname stays on-device AsyncStorage; not in Analytics params. Child flows do not collect child name/age/month. |
| Search history | PARTIAL | PARTIAL | Optional (feature use) | App functionality | Local recent searches on device. **Shopping keywords** → Shopping Proxy → Coupang. Child search sends **query_length only**, not raw query. **CHECK_REQUIRED** label choice. |
| Web browsing | CHECK_REQUIRED | CHECK_REQUIRED | — | Advertising or marketing / App functionality | Coupang banner WebView loads partner widget URL. Not a general browser. |
| Purchase history | NO | NO | — | — | No IAP / Play Billing. Coupang purchases off-app. |
| Photos and videos (off-device collection) | NO | NO | — | — | **NO off-device collection.** Save-to-album is user-initiated write of app-generated PNG on device only; no read/scan/upload of user's existing photos. |
| Contacts | NO | NO | — | — | No contacts access. |
| Health and fitness | NO | NO | — | — | Not collected. |
| Crash logs | NO | NO | — | — | No Crashlytics / Sentry dependency for crash reporting. |
| Diagnostics | NO / CHECK_REQUIRED | — | — | — | No separate diagnostics SDK beyond Analytics. |
| Financial info | NO | NO | — | — | Not collected by app. |
| Messages | NO | NO | — | — | Not collected. |

### Purpose mapping (권장)

- Firebase Analytics custom + auto events: **Analytics**
- Shopping Proxy keywords / IP rate limit: **App functionality** (not Analytics events)
- Coupang Dynamic Banner + AdMob (when shown): **Advertising or marketing** (affiliate / ads) — Contains ads YES와 정합

### Ephemeral / on-device only (보통 Data Safety “collected”에서 제외)

- Nickname, favorites, meal history, pantry, recommendation feedback, weekly plan slots, baby grocery checklist — AsyncStorage only
- Photo library: add-only save of generated weekly plan PNG on user action — **not** uploaded; **not** “photos collected” off-device

## Firebase vs custom events

**Custom (app code, non-PII):**  
`recipe_id`, `meal_time`, `source`, favorite action, `fridge` result_count, shopping `mode`, `merchant`, `is_affiliate`, `combo_id`, child `stage`, `meal_type`, `query_length`, `filter_types`, `result_count`, weekly plan `mode`, baby batch/grocery checklist events.

**Not sent:** raw search query, menu name, ingredient name, child age/month, nickname, email, ad id.

**SDK auto (Firebase docs):** users/sessions, OS/device model, geography, first launches, app opens/updates, app-instance ID; Advertising ID **disabled in firebase.json**.

## AdMob (Android)

- `react-native-google-mobile-ads` installed; banner **Android Home only** in UI code
- NPA (`requestNonPersonalizedAdsOnly: true`)
- Production unit requires env gate; store-like builds without gate may show **no** AdMob unit (implementation detail — Data Safety still accounts for SDK capability)
- iOS: plugin App ID only; banner UI returns null on iOS

## Retention

Do not invent Firebase retention days in Play form beyond Google’s defaults / console settings.

## CHECK_REQUIRED before submitting Play form

1. **9/1** — Uploaded preview AAB merged manifest: `com.google.android.gms.permission.AD_ID` present or removed?
2. Play “Approximate location” for Firebase Geography — confirm with Play help / legal.
3. “Search history” vs shopping keywords labeling.
4. “Web browsing” for Coupang WebView.
5. Deploy updated `privacy.html` to `hankki-legal.vercel.app` before store submit.
6. Confirm Firebase Analytics data-sharing / ads personalization flags in Firebase/GA console.
7. Photo save: confirm Play form does **not** declare off-device photo collection for save-only flow.
