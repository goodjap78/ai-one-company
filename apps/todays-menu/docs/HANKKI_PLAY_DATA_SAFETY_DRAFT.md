# HANKKI Google Play Data Safety / Ads Declaration Draft

기준일: 2026-08-14  
Package: `com.aionecompany.todaysmenu`  
근거: 앱 코드, `firebase.json`, `app.config.js`, `@react-native-firebase/app|analytics@26.2.0`, AdMob 미설치, Coupang WebView 배너

이 문서는 Play Console 입력용 **초안**이다. Play Console을 자동 변경하지 않는다.

## Contains ads

| 항목 | 권장 | 근거 |
|---|---|---|
| Declares ads / Contains ads | **YES** | Home·Ingredients에 Coupang Partners Dynamic Banner WebView (`ads-partners.coupang.com`) 표시. AdMob은 없으나 제휴 광고성 콘텐츠가 UI에 노출됨. |

## Data Safety 표

범례: Collected = 앱/SDK가 기기 밖으로 전송·처리하는 데이터. Shared = Google 등 제3자 처리자와의 공유(Play 의미의 Shared).

| Data type | Collected | Shared | Required/Optional | Purposes | Verdict |
|---|---|---|---|---|---|
| App activity → **App interactions** | YES | YES (Google Firebase/GA4) | Required for Analytics features as shipped | Analytics | **YES** — custom events + Firebase auto events (`first_open`, `session_start` 등, auto collection on) |
| Device or other IDs | YES | YES (Google) | Required (SDK) | Analytics | **YES** — app-instance ID (Firebase docs). Not a custom installId we invent. |
| Advertising ID | NO (intended) | NO (intended) | — | — | **NO** with **CHECK_REQUIRED** — `firebase.json` `google_analytics_adid_collection_enabled: false`; iOS `withoutAdIdSupport`. Merged AAB에 `AD_ID` permission 잔존 여부는 빌드 후 재확인. |
| Approximate location | CHECK_REQUIRED | CHECK_REQUIRED | — | Analytics | Firebase default docs list **Geography**. App does not request GPS. Play에서 IP 기반 geo를 Approximate location으로 넣을지 **CHECK_REQUIRED**. |
| Precise location | NO | NO | — | — | No location permission / no GPS collection in app code. |
| Personal info (name, email, phone, address) | NO (off-device) | NO | — | — | Nickname stays on-device AsyncStorage; not in Analytics params. |
| Search history | PARTIAL | PARTIAL | Optional (feature use) | App functionality | Local recent searches stay on device. **Shopping keywords** go to Shopping Proxy → Coupang. Declare if Play maps merchant search keywords to Search history; otherwise App activity. **CHECK_REQUIRED** label choice. |
| Web browsing | CHECK_REQUIRED | CHECK_REQUIRED | — | Advertising or marketing / App functionality | Coupang banner WebView loads partner widget URL. Not a general browser. Whether Play “Web browsing” applies: **CHECK_REQUIRED**. |
| Purchase history | NO | NO | — | — | No IAP / Play Billing in app. Coupang purchases happen off-app. |
| Photos and videos | NO | NO | — | — | No photo library access. |
| Contacts | NO | NO | — | — | No contacts access. |
| Health and fitness | NO | NO | — | — | Not collected. |
| Crash logs | NO | NO | — | — | No Crashlytics / Sentry app dependency for crash reporting. |
| Diagnostics | NO / CHECK_REQUIRED | — | — | — | No separate diagnostics SDK beyond Analytics. Do not invent. |
| Financial info | NO | NO | — | — | Not collected by app. |
| Messages | NO | NO | — | — | Not collected. |

### Purpose mapping (권장)

- Firebase Analytics custom + auto events: **Analytics**
- Shopping Proxy keywords / IP rate limit: **App functionality** (not Analytics events)
- Coupang Dynamic Banner: **Advertising or marketing** (affiliate) — Contains ads YES와 정합

### Ephemeral / on-device only (보통 Data Safety “collected”에서 제외되는 경우)

- Nickname, favorites, meal history, pantry, recommendation feedback — AsyncStorage only, not uploaded to company account server or Firebase custom params.

## Firebase vs custom events

**Custom (app code):** recipe_id, meal_time, source, favorite action, fridge result_count, shopping mode, merchant, is_affiliate, combo_id. No nickname/email/keyword/title/ad id params.

**SDK auto (Firebase docs):** users/sessions, OS/device model, geography, first launches, app opens/updates, app-instance ID; Advertising ID **disabled in our firebase.json**.

## Retention

Do not invent Firebase retention days in Play form beyond Google’s defaults / console settings. Privacy policy points to Google policy.

## CHECK_REQUIRED before submitting Play form

1. Uploaded AAB merged manifest: `com.google.android.gms.permission.AD_ID` present or removed?
2. Play “Approximate location” for Firebase Geography — confirm with Play help / legal.
3. “Search history” vs shopping keywords labeling.
4. “Web browsing” for Coupang WebView.
5. Deploy updated `privacy.html` to `hankki-legal.vercel.app` so store privacy URL matches repo.
6. Confirm Firebase Analytics data-sharing / ads personalization flags in Firebase/GA console (app sets ADID off; console linking still CHECK_REQUIRED).
