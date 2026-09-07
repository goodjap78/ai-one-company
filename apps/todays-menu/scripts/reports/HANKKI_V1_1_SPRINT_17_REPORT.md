# HANKKI_V1_1_SPRINT_17_REPORT

**Date:** 2026-09-08  
**Scope:** One EAS Android **preview** APK from latest v1.1 HEAD. No production AAB. No iOS. No device QA this sprint.

---

## GIT_HEAD

`8aee4f3adc1ff3753d55fb237760093b9c5169e7`

## REMOTE_HEAD

`8aee4f3adc1ff3753d55fb237760093b9c5169e7`

## GIT_CLEAN

**YES** — local = remote, no uncommitted files before build

### Recent commits included

| SHA | Sprint / change |
|-----|-----------------|
| `8aee4f3` | Weekly alternate QA (`다른 7일 식단 보기`) |
| `a9946c5` | Sprint 16 hero + 6-grid share card |
| `e6c28b5` | Sprint 15 card-news share design |
| `d720a49` | Sprint 14.1 breadcrumb + logo home + photo share |
| `57a8978` | v1.1.0 / versionCode 9 / adaptive icon |

---

## VERSION

`1.1.0` (not bumped)

## VERSION_CODE

`9` (not bumped)

## LATEST_SPRINTS_INCLUDED

**YES**

- Home IA, nickname IME, Hankki logo → home, breadcrumb removed
- Elementary + toddler weekly (UI + quality generators)
- Share card Sprint 15/16
- Alternate 7-day QA control
- Adaptive icon (transparent FG + `#FFF4EC`)
- Coupang native + AdMob preview test banner

---

## STATIC_QA

**PASS**

- `test-sprint-1-1-home-ux`
- `test-nickname-onboarding`
- `test-toddler-sprint12-weekly-ui`
- `test-elementary-weekly-sprint5-share`
- `test-elementary-weekly-sprint5-3-share`
- `test-weekly-alternate-qa`
- `test-coupang-dynamic-banner`
- `test-admob-production-gate`
- `npx expo config --type public` → 1.1.0 / versionCode 9 / adaptive `#FFF4EC`

---

## ADMOB_PREVIEW_MODE

**Google TEST adaptive banner**

- `eas.json` preview `EXPO_PUBLIC_QA_TOOLS=1`
- `isAdMobTestAdEnvironment` (QA_TOOLS or `EAS_BUILD_PROFILE=preview`) → `TestIds.ADAPTIVE_BANNER`
- Production units only if `EXPO_PUBLIC_ADMOB_USE_PRODUCTION_UNITS === 'true'` — **not set** on preview

## COUPANG_NATIVE

**YES** — Android WebView path unchanged

---

## BUILD_PROFILE

`preview` (Android APK, internal)

## BUILD_ID

`ec391575-be7e-4339-b79a-d5c44d828511`

## BUILD_RESULT

**PASS** (1 attempt)

| Field | Value |
|-------|--------|
| Commit | `8aee4f3` |
| Version / versionCode | `1.1.0` / `9` |
| Logs | https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/ec391575-be7e-4339-b79a-d5c44d828511 |
| APK | https://expo.dev/artifacts/eas/aahm6OVBzI6wC35DWqob0U0tEIkjhouj2J87MXNU1FY.apk |
| Cloud | 2026-09-08 08:27–08:37 KST |

---

## APK_INSTALL_URL

https://expo.dev/accounts/mymy1004/projects/todays-menu/builds/ec391575-be7e-4339-b79a-d5c44d828511

---

## READY_FOR_DEVICE_QA

**YES** — install the preview APK on an Android device. Device QA not run this sprint.

## BLOCKERS

None for build.

## WARNINGS

1. Archive still ~1.3 GB (slow upload). Consider `.easignore` later.
2. Confirm on-device AdMob shows **Test Ad** label.
3. Do not use this APK as production store binary.

## RESULT

**PASS**

Waiting. No production AAB, no iOS, no device QA in this sprint.
