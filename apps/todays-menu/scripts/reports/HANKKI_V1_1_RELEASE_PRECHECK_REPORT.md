# HANKKI_V1_1_RELEASE_PRECHECK_REPORT

Sprint: HANKKI v1.1 — Release Precheck Audit (code/settings only)  
Date: 2026-08-29  
Scope: Audit + recommendations only — **no builds, no version bumps, no store upload, no policy auto-edit**

---

## APP_VERSION

| Field | Current value | Source |
|-------|---------------|--------|
| **version** (user-facing) | `1.0.0` | `app.json` + `package.json` |
| **android.versionCode** | `8` | `app.json` |
| **ios.buildNumber** | `1` | `app.json` |
| **EAS appVersionSource** | `local` | `eas.json` |
| **EAS production autoIncrement** | `true` (versionCode only on EAS build) | `eas.json` |

### v1.1 출시 시 제안 (수정하지 않음)

| Platform | Suggested | Notes |
|----------|-----------|-------|
| **version** | `1.1.0` | Child meal planning MVP (baby/toddler/elementary weekly, batch, checklist) |
| **android.versionCode** | `9` (minimum) | Current `8` published baseline unknown — Play에 `8` 이미 live면 `9`; EAS `autoIncrement` 사용 시 첫 production build가 자동 +1 |
| **ios.buildNumber** | `2` (minimum) | Monotonic increment from `1` |

---

## ANDROID_VERSION_CODE

**Current:** `8`  
**Suggested at v1.1 ship:** `9+` (see above)

---

## IOS_BUILD_NUMBER

**Current:** `1`  
**Suggested at v1.1 ship:** `2+`

---

## NATIVE_MODULES

| Module | Purpose | Prebuild required | Expo Go |
|--------|---------|-------------------|---------|
| `@react-native-firebase/app` + `analytics` | Firebase Analytics | **YES** (conditional on `google-services.json` / plist) | **NO** |
| `react-native-google-mobile-ads` | Android Home banner | **YES** | **NO** |
| `react-native-view-shot` | Weekly plan PNG capture | **YES** | Partial / unreliable |
| `expo-media-library` | Album save (weekly PNG) | Config plugin in `app.json` | **YES** |
| `expo-sharing` | OS share (PNG / text) | Bundled Expo module | **YES** |
| `@react-native-async-storage/async-storage` | Local persistence | **YES** | **YES** |
| `react-native-webview` | Coupang dynamic banner | **YES** | **YES** |
| `expo-haptics`, `expo-router`, `expo-font`, etc. | Core UX | Mixed | Mostly **YES** |

**Child-feature critical native paths:** weekly save/share (view-shot + media-library + sharing), Firebase analytics, Coupang WebView, AdMob banner (Android only).

**Expo Go로 테스트 불가 (preview/dev client 필요):**
- Firebase Analytics events
- AdMob banner + init
- Full weekly PNG capture pipeline (view-shot quality)
- Production-like manifest (AD_ID block, media permissions)

---

## PREVIEW_BUILD_REQUIRED

**YES** — `eas.json` profile `preview` (APK, `EXPO_PUBLIC_QA_TOOLS=1`) exists and is the correct path for 9/1 device QA.

---

## ANDROID_PERMISSIONS

Expected merged manifest (prebuild + plugins; **verify on real APK 9/1**):

| Permission | Status | Notes |
|------------|--------|-------|
| `INTERNET` | **PRESENT** | Standard |
| `com.google.android.gms.permission.AD_ID` | **BLOCKED** | `app.config.js` → `blockedPermissions` when `google-services.json` present |
| `android.permission.ACCESS_ADSERVICES_AD_ID` | **BLOCKED** | Same |
| `android.permission.ACCESS_ADSERVICES_ATTRIBUTION` | **BLOCKED** | Same |
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | **REVIEW_REQUIRED** | `expo-media-library` save-only config (`photosPermission: false`, `granularPermissions: ["photo"]`) — merged manifest must be checked; broad read should **not** appear |
| `WRITE_EXTERNAL_STORAGE` | **REVIEW_REQUIRED** | Legacy API levels only if plugin adds; target SDK 34+ typically scoped storage |
| Notification permissions | **REMOVED / N/A** | No push notification SDK in dependencies |
| Location | **REMOVED** | No GPS permissions in config |

**Checks passed statically:**
- Media Library: save-only intent (`savePhotosPermission` string; `photosPermission: false`)
- AD_ID: blocked list + `firebase.json` `google_analytics_adid_collection_enabled: false`
- No broad storage permission declared in `app.json` directly

**9/1 action:** Inspect merged `AndroidManifest.xml` from preview APK (step 12 in QA plan).

---

## IOS_PERMISSIONS

| Key | Status | Notes |
|-----|--------|-------|
| `NSPhotoLibraryAddUsageDescription` | **REVIEW_REQUIRED** | Expected via `expo-media-library` save plugin string (Korean save message in `app.json`) |
| `NSPhotoLibraryUsageDescription` (read) | **REMOVED** (`photosPermission: false`) | Save-only design |
| `NSUserTrackingUsageDescription` (ATT) | **REMOVED** | Verified absent in `app.config.js` / analytics tests |
| `ITSAppUsesNonExemptEncryption` | **PRESENT** | `false` in `app.json` |

**ATT:** Not required for current config — iOS AdMob UI/init **OFF**, no tracking description, Firebase iOS `withoutAdIdSupport: true`, NPA on Android only relevant when banner shown.

**9/1 action:** Confirm generated Info.plist on preview iOS build if iOS QA is in scope.

---

## ADMOB_STATUS

| Item | Status |
|------|--------|
| Production gate | `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'` **AND** real banner unit required (`constants/admobGate.ts`) |
| Test units | Only when `__DEV__`, `EXPO_PUBLIC_QA_TOOLS=1`, or EAS `development`/`preview` |
| Production-like without gate | **`null` unit → banner hidden** (no TestIds leak) |
| Android App ID | Env or Google **sample** ID in manifest plugin fallback |
| Banner | Android Home only; NPA `requestNonPersonalizedAdsOnly: true` |
| iOS UI/init | **OFF** (`platform !== 'android'`) |
| AD_ID | Blocked in manifest config |
| EAS production env | **No AdMob vars** in `eas.json` → gate OFF → **no live ads on store builds** |

**TestIds in production build:** **Possibility ≈ 0** for banner unit when gate OFF. Residual: manifest may still embed **sample App ID** if `ADMOB_ANDROID_APP_ID` unset.

**If real IDs absent:** Ads **disabled** (component returns null) — correct fail-closed behavior.

### READY_FOR_PRODUCTION_ADS

**NO**

Reason: Production env not configured; gate OFF; sample App ID may remain in manifest; monetization not validated. Safe from accidental TestIds exposure, but **not ready to ship live ads**.

---

## COUPANG_STATUS

| Surface | Status |
|---------|--------|
| Home dynamic banner | WebView (`CoupangDynamicBanner`) |
| Recipe detail (general/toddler/elementary) | Banner + native shopping CTA |
| Baby recipe detail | Coupang banner **hidden**; shopping CTA deferred below safety |
| Baby batch / grocery | **No** Coupang/AdMob |
| Affiliate disclosure | `ShoppingScreen` + legal copy; banner WebView has **no inline** disclosure |
| Path | WebView widget + native proxy shopping API |

**Contains ads (Play):** **YES** recommended — Coupang affiliate banner + (when enabled) AdMob.

---

## DATA_SAFETY

**Code reality (2026-08-29):**

| Data | Collected off-device? |
|------|------------------------|
| Firebase Analytics custom events | YES — `recipe_id`, `stage`, `meal_type`, `mode`, `seed`, counts; **no** raw query, title, ingredient name, child age |
| Firebase auto events | YES — session, device, app-instance ID |
| Advertising ID | **Intended NO** — blocked + Firebase ADID off |
| Search query raw text | **NO** in analytics (`query_length` only); **YES** to Shopping Proxy for Coupang search keywords |
| Child age/month PII | **NO** user input |
| Photo read | **NO** |
| Photo write | **User-initiated** weekly PNG save only |
| Purchase data | **NO** in-app billing |

**Stale internal draft (`docs/HANKKI_PLAY_DATA_SAFETY_DRAFT.md`):**

| Stale claim | Reality |
|-------------|---------|
| “AdMob 미설치” | **STALE** — `react-native-google-mobile-ads` installed |
| “Photos and videos \| NO” | **STALE** — save-to-album on user action |
| Basis date 2026-08-14 | Pre-child-weekly / pre-checklist |

**Play form gaps:** Approximate location (Firebase geo), Web browsing (Coupang WebView), search keyword labeling — all **REVIEW_REQUIRED** before submit.

---

## PRIVACY_POLICY

**Source:** `legal/privacy.html` (deploy via Vercel)

| Topic | Policy vs code |
|-------|----------------|
| Firebase Analytics | **Aligned** |
| AdMob + NPA + AD_ID off | **Aligned** |
| Coupang proxy + banner | **Aligned** |
| Child features | Policy: “만 14세 미만 비대상”; app has parent-facing baby/toddler/elementary — **positioning tension**, not a code bug |
| Photo library | **UPDATE_REQUIRED** — §1 says “사진 라이브러리 접근 … 수행하지 않습니다” but weekly save uses `expo-media-library` **write-only on user tap** |

**Recommended manual edits (do not auto-apply):**
- Add user-initiated **photo album save** (write-only) for weekly plan PNG
- Clarify parent-use app for child meal content
- Redeploy to privacy URL before store submit
- Sync `HANKKI_PLAY_DATA_SAFETY_DRAFT.md` with AdMob + photo save

---

## CHILD_PRIVACY

**Code facts (not legal conclusion):**

| Check | Finding |
|-------|---------|
| Child age/month user input | **None** |
| Child profile / name / birthday | **None** |
| Parent nickname | On-device only |
| Baby “stage” | Recipe taxonomy + UI filter, not user DOB |
| Analytics child events | `stage`, `meal_type`, `recipe_id` — no PII |
| Ads on child journeys | Home shows Coupang + AdMob (Android); baby detail hides Coupang banner; toddler/elementary detail shows Coupang |
| COPPA SDK / age gate | **None** |
| UI framing | Parent-facing copy (이유식/유아식/초등 메뉴 골라보기) |

**Store impact (factual):** App includes child-oriented **content** for **parents**; policy states not directed at under-14. Play Families / COPPA / “child-directed” classification requires **human/legal review** — not asserted here.

---

## SHARE_MEDIA

| Flow | Mechanism | Permission handling |
|------|-----------|-------------------|
| Weekly PNG save | `react-native-view-shot` → `expo-media-library` | `permission_denied` / `unavailable` / `failed` unions; Alert in screens |
| Weekly OS share | `expo-sharing` (Android) / `Share` (iOS) | Cancel-safe |
| Baby grocery text share | `Share.share` message only | try/catch, dismiss OK |
| Image capture | Off-screen 1080×1350 host | — |

**9/1 must-test:** Save permission grant/deny, share sheet cancel, PNG content matches plan, album write success.

---

## ASYNC_STORAGE

**Child-related keys (no collisions):**

| Key | Data |
|-----|------|
| `@hankki/baby_weekly_plan/{early\|middle\|late\|completion}` | Weekly plan + seed |
| `@hankki/baby_food_feed_stage` | Last baby stage tab |
| `@hankki/baby_grocery_checklist` | fingerprint + checked row ids |
| `@hankki/toddler_weekly_plan/{breakfast\|lunch\|dinner\|snack}` | Weekly plans |
| `@hankki/toddler_weekly_plan/last_meal` | Last meal tab |
| `@hankki/elementary_breakfast_weekly_plan` | Breakfast weekly |
| `@hankki/elementary_dinner_weekly_plan` | Dinner weekly |

**Other `@hankki/*` keys:** favorites, history, pantry, profile (nickname), searches, etc. — all unique namespaces.

**Sensitive data:** No child PII; nickname local only; checklist stores row ids not ingredient names.

**Batch cooking session:** In-memory only (no AsyncStorage).

---

## ANALYTICS

| Metric | Value |
|--------|-------|
| **Total events** | **49** |
| Duplicate names | **0** (`test:analytics-events` PASS) |
| Raw search query | **Not sent** (`query_length`, `filter_types`) |
| Menu / ingredient names | **Forbidden** (`FORBIDDEN_ANALYTICS_PARAM_KEYS`) |
| Child age/month | **Not sent** |
| PII | Stripped in `sanitizeAnalyticsParams` |
| `recipe_id` | Click/view events only |
| `stage` / `meal_type` / `mode` | Child weekly/feed events |
| `seed` | Weekly plan events |

**Gap:** Child search track helpers not in typed-helper loop (events still registered and used in UI).

---

## IMAGE_ASSETS

| Check | Status |
|-------|--------|
| Child Hero | **222/222** (`test:child-image-registry` PASS) |
| Broken runtime heroes | **0** (registry QA) |
| Step registry broken | **0** |
| Batch4 deferred steps (2) | Empty slot → text-only render |
| Hero spec | 800×800 locked in tests |
| Bundled meals JPG | ~522 files, **~83 MB** |
| Bundled step JPG | ~201 files, **~75 MB** |
| **Total image bundle (meals+steps)** | **~158 MB** |

**AAB/APK size risk:** **MEDIUM–HIGH** — large bundled JPG catalog; exact compressed size unknown until 9/1 build. Optimization pipeline exists (`prepare:new-recipes`, image-factory) but release size not measured.

---

## PERFORMANCE_RISKS

| Risk | Severity | Fix now? |
|------|----------|----------|
| Child browse ScrollView full map (70–78 rows) | **HIGH** | **No** — acceptable for v1.1 pilot; FlatList post-release |
| Weekly 7× hero `getHankkiRecipeById` linear scan | **MEDIUM** | **No** |
| ~158 MB bundled images | **MEDIUM** | Monitor on 9/1 APK size |
| Filter/search `useMemo` | **LOW** | OK |
| Batch aggregation on user action | **LOW** | OK |

**BLOCKERS from performance alone:** **None**

---

## PLAY_CONSOLE

| Item | Status |
|------|--------|
| Contains ads | **UPDATE_REQUIRED** — Coupang YES; AdMob when enabled |
| Data Safety | **UPDATE_REQUIRED** — draft stale (AdMob, photo save) |
| Target audience | **REVIEW_REQUIRED** — parent app with child content |
| Content rating | **REVIEW_REQUIRED** — questionnaire not in repo |
| App access | **REVIEW_REQUIRED** |
| Privacy Policy URL | **UPDATE_REQUIRED** — deploy photo-save wording |
| Photo/media permissions | **REVIEW_REQUIRED** — verify merged manifest |
| Advertising ID | **REVIEW_REQUIRED** — confirm AD_ID removed in AAB |
| Families policy | **REVIEW_REQUIRED** — legal/product decision |

---

## APP_STORE_CONNECT

| Item | Status |
|------|--------|
| App Privacy | **UPDATE_REQUIRED** — align with Firebase + photo save |
| Tracking (ATT) | **READY** — no ATT string; iOS AdMob off |
| Photo Library | **UPDATE_REQUIRED** — Add-only usage for weekly save |
| Advertising | **REVIEW_REQUIRED** — iOS banner off; Coupang affiliate still present via WebView on universal flows |
| Kids Category | **REVIEW_REQUIRED** — likely **NO** if positioned as parent tool |
| Privacy URL | **UPDATE_REQUIRED** — same as Play |

---

## BLOCKERS

1. **No real-device QA** (scheduled 9/1) — share/save/permissions/AdMob/manifest unverified on hardware  
2. **Data Safety draft stale** vs actual AdMob + photo save  
3. **Privacy policy gap** on photo album save (write-only)  
4. **Production AAB not built** — merged manifest / size unknown  

---

## HIGH

1. Play **Contains ads** + Data Safety must be updated before production submit  
2. Child browse list not virtualized (device perf on low-end Android)  
3. ~158 MB bundled images — APK/AAB size unknown  
4. Coupang WebView on Home while app ships child meal features — store positioning clarity  

---

## MEDIUM

1. Sample AdMob App ID in manifest when env unset  
2. Elementary breakfast share module duplicate (behavior OK)  
3. Privacy policy deploy sync (`hankki-legal.vercel.app`)  
4. Firebase Geography / Web browsing Play labels — human review  

---

## LOW

1. Analytics test coverage gap for 3 child-search helpers  
2. Copy inconsistency (elementary “다른 일주일 추천” vs “골라보기”)  
3. Coupang banner lacks inline disclosure on Home/Ingredients  

---

## REQUIRED_BEFORE_9_1

- [ ] None blocking **preview APK** build authorization (product decision)  
- [ ] Privacy policy photo-save wording draft (manual)  
- [ ] Update `HANKKI_PLAY_DATA_SAFETY_DRAFT.md` (manual)  
- [ ] Prepare EAS preview credentials / internal testers  

---

## REQUIRED_AFTER_9_1

- [ ] EAS **preview** APK install + 13-step QA plan (below)  
- [ ] Merged manifest AD_ID + media permission audit  
- [ ] APK/AAB size measurement  
- [ ] Version bump to `1.1.0` / versionCode / buildNumber (when approved)  
- [ ] Production AAB **only after** preview QA PASS  
- [ ] AdMob production env (if monetization intended)  
- [ ] Play / App Store form submission  

---

## 9/1 REAL DEVICE QA PLAN (proposed order)

1. EAS Preview APK  
2. Android install  
3. Home / baby / toddler / elementary feeds + detail  
4. Baby 1/3/6 portions  
5. Weekly save/share (all 4 weekly surfaces)  
6. Baby grocery checklist toggle/reset/persist  
7. Media permission grant/deny  
8. AdMob test banner (preview profile + QA_TOOLS)  
9. Coupang banner + shopping outbound  
10. Analytics smoke (Firebase DebugView)  
11. Hero image load / scroll perf on child browse  
12. **Merged manifest** permission final check  
13. Production readiness sign-off → then production AAB  

---

## FILES_MODIFIED

**NONE** (audit-only sprint)

---

## READY_FOR_PREVIEW_APK

**YES**

Static tests pass (child image 222/222, analytics 49 events, integrated QA, batch/checklist/weekly suites). Preview profile configured. Native modules require dev/preview build, not Expo Go alone.

---

## READY_FOR_ANDROID_PRODUCTION

**NO**

Requires: 9/1 preview QA PASS, manifest verification, Data Safety + privacy updates, version bump (when allowed), production secrets decision (AdMob optional).

---

## READY_FOR_IOS_PRODUCTION

**NO**

Requires: device QA, Info.plist verification, App Privacy labels, buildNumber bump (when allowed). iOS AdMob intentionally off — lower ads surface but Coupang WebView still present on shared flows.

---

## TEST_BASELINE (static, this audit)

```
test:child-image-registry              → PASS (222/222)
test:analytics-events                  → PASS (49 events)
test:child-meal-planning-integrated    → PASS
test:baby-grocery-checklist            → PASS
test:baby-batch-cooking                → PASS
test:baby-weekly-plan / toddler / elementary weekly → PASS (per prior sprints)
test:admob-production-gate             → (recommended before preview build)
test:legal-coupang-compliance          → (recommended before preview build)
```
