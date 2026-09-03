# HANKKI_V1_1_SPRINT_14_ANDROID_RC_REPORT

**Date:** 2026-09-04  
**Scope:** One EAS Android **preview** APK + device QA. No production AAB. No Play upload. No iOS build. No feature work.

---

## Pre-build

| Check | Result |
|-------|--------|
| `git status` | clean |
| HEAD | `df0cb52e4a39999329212f5ba6b5d26324d6211e` |
| `origin/hankki/ai-recommendation-metadata-stabilization` | same SHA |
| version | **1.1.0** |
| versionCode | **9** |
| preview | `distribution: internal`, `buildType: apk`, `EXPO_PUBLIC_QA_TOOLS=1` |

### AdMob QA policy (preview)

- Preview env loads `EXPO_PUBLIC_QA_TOOLS=1` (and may load `ADMOB_ANDROID_APP_ID` from EAS env).
- `isAdMobTestAdEnvironment`: QA_TOOLS=1 **or** `EAS_BUILD_PROFILE=preview` → **Google test adaptive banner** (`TestIds.ADAPTIVE_BANNER`).
- Production units only when `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'` — **not set** on preview.
- `test-admob-production-gate.ts` **PASS** before build.
- Coupang: unchanged native WebView path (not stubbed on Android).

---

## BUILD_PROFILE

`preview` (Android APK, internal)

## BUILD_VERSION

`1.1.0`

## VERSION_CODE

`9`

## BUILD_RESULT

**PASS** (1 attempt, exit 0)

| Field | Value |
|-------|--------|
| Build ID | `7495e6ed-7c0f-4305-8c54-60d15808c36a` |
| Commit | `df0cb52` |
| Logs / install | https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/7495e6ed-7c0f-4305-8c54-60d15808c36a |
| APK | https://expo.dev/artifacts/eas/oeJmdvG6aL9-kQ6aOitgU9CUIXewQ0Wd7Du27_DPYYI.apk |
| Fingerprint | `78990743e1e1c3d6cdfdf2ee21cffb93ddd3faf8` |
| Duration | ~13 min (cloud) after upload |

**WARNING:** Project archive uploaded at **~1.3 GB** — consider `.easignore` later (not changed this sprint).

---

## APK_INSTALLED

**NOT_VERIFIED** — no `adb` on agent host; no device attached from this environment.

Install on device: open build link / scan QR from Expo, or sideload the APK URL above.

---

## Device QA (A–L)

| Area | Status |
|------|--------|
| ICON | NOT_RUN |
| SPLASH | NOT_RUN |
| ONBOARDING | NOT_RUN |
| NICKNAME_PERSISTENCE | NOT_RUN |
| HOME | NOT_RUN |
| ELEMENTARY_WEEKLY | NOT_RUN |
| TODDLER_WEEKLY | NOT_RUN |
| SHARE_CARD_SAVE | NOT_RUN |
| ANDROID_SHARE | NOT_RUN |
| COUPANG_NATIVE | NOT_RUN |
| ADMOB_NATIVE | NOT_RUN (config: expect **test** banner) |
| FAVORITES | NOT_RUN |
| RECENTLY_VIEWED | NOT_RUN |
| BACKGROUND_RESUME | NOT_RUN |
| MEMORY_START | N/A (no adb) |
| MEMORY_AFTER_10MIN | N/A |
| MEMORY_BACKGROUND | N/A |

**CRASHES:** unknown (device QA pending)  
**UI_ISSUES:** unknown (device QA pending)

---

## BLOCKERS

1. **Device QA not executed in this session** — physical Android install + checklist A–L required before declaring RC ship-ready.

## WARNINGS

1. EAS upload archive ~1.3 GB (slow uploads / cost).
2. EAS preview env includes `ADMOB_ANDROID_APP_ID`; banner unit still forced to **test** via QA_TOOLS + preview profile — confirm on-device “Test Ad” label.
3. Agent has no ADB → memory dumps not collected.

---

## READY_FOR_ANDROID_PRODUCTION_AAB

**NO** — await device QA PASS (no BLOCKERs on A–L).

## READY_FOR_IOS_TESTFLIGHT

**NO** — iOS build not in scope; Android device QA first.

## RESULT

**PARTIAL**

- Build: **PASS** (single preview APK)
- Device QA: **PENDING** (user / next session with device)

Production AAB and iOS builds **not** started. Waiting.
