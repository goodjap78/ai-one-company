# HANKKI_V1_1_SPRINT_19_REPORT

**Date:** 2026-09-08  
**Scope:** One EAS Android **preview** APK from Sprint 18 HEAD. No production AAB. No iOS. No device install this sprint.

---

## GIT_HEAD

`f5e1eb812272bd6f4a7f5c990277f03853880759`

## REMOTE_HEAD

`f5e1eb812272bd6f4a7f5c990277f03853880759`

## GIT_CLEAN

**YES** — local = remote, working tree clean before build

---

## VERSION

`1.1.0` (not bumped)

## VERSION_CODE

`9` (not bumped)

---

## SPRINT_18_INCLUDED

**YES** — build gitCommitHash is Sprint 18 report tip (`f5e1eb8`)

Includes:

- Weekly Recipe Access + `/weekly-recipes`
- AdMob Preview `EXPO_PUBLIC_*` static inline fix
- Share card recipe hint
- Toddler quality user extras

## WEEKLY_RECIPE_ACCESS_INCLUDED

**YES**

- Full-card Pressable
- `레시피 보기 ›`
- `이번 주 7개 레시피 보기`
- Elementary + toddler breakfast/dinner
- Regenerated plan sync

---

## ADMOB_PREVIEW_GATE

**YES** — `eas.json` preview `EXPO_PUBLIC_QA_TOOLS=1`  
Client reads static `process.env.EXPO_PUBLIC_*` (Sprint 18 fix)

## ADMOB_TEST_UNIT

**Google TEST adaptive banner** — production units not enabled on preview

## ADMOB_INIT

**YES** on Android preview (`shouldInitializeAdMob === true`)

---

## COUPANG_NATIVE

**YES** — `CoupangDynamicBanner.native.tsx` WebView path unchanged. Affiliate URL/tracking not modified.

---

## PREBUILD_QA

**PASS**

- `test:weekly-recipe-access`
- `test:weekly-plan-ui` (elementary)
- `test:toddler-sprint12-weekly-ui`
- `test:weekly-plan-share`
- `test-nickname-onboarding`
- `test:coupang-dynamic-banner`
- `test:admob-production-gate`

---

## BUILD_PROFILE

`preview` (Android APK, internal)

## BUILD_ID

`17753bab-4ddd-4cc3-8f15-5e5bcaa367b9`

## BUILD_RESULT

**PASS** (1 cloud attempt)

| Field | Value |
|-------|--------|
| Commit | `f5e1eb8` |
| Version / versionCode | `1.1.0` / `9` |
| Logs | https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/17753bab-4ddd-4cc3-8f15-5e5bcaa367b9 |
| APK | https://expo.dev/artifacts/eas/x5KWCCtenZRQINM8-0X_XexnS0JikrGLu7dr9du18JA.apk |
| Cloud | 2026-09-08 01:22–01:31 UTC |

Local `eas` was not on PATH; used `npx eas-cli` (same command, one cloud job).

---

## APK_INSTALL_URL

https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/17753bab-4ddd-4cc3-8f15-5e5bcaa367b9

## DIRECT_APK_URL

https://expo.dev/artifacts/eas/x5KWCCtenZRQINM8-0X_XexnS0JikrGLu7dr9du18JA.apk

---

## READY_FOR_FINAL_DEVICE_QA

**YES** — install this preview APK on an Android device. Device QA not run this sprint.

## RESULT

**PASS**

Waiting. No APK install, no production AAB, no iOS.
